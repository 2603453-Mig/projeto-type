
import "dotenv/config";

import bcrypt from "bcryptjs";
import express, { type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { exigirLogin, SEGREDO, usuarioDe } from "./autenticacao";
import { banco } from "./banco";

import {
    PRIORIDADES,
    STATUS,
    ESPECIALIDADES,
    type DadosConsulta,
    type Status
} from "./tipos";

const app = express();

app.use(express.json());

// ---------- Consulta SQL principal ----------

const SELECT_CONSULTAS = `
    SELECT
        c.id,
        c.usuario_id AS usuarioId,
        c.titulo,
        c.descricao,
        c.prioridade,
        c.status,
        c.especialidade,
        DATE_FORMAT(c.prazo, '%Y-%m-%d') AS prazo,
        c.criada_em AS criadaEm,
        p.descricao AS procedimento
    FROM consultas c
    LEFT JOIN procedimentos p ON p.consulta_id = c.id
`;

// ---------- Organização dos resultados ----------

interface LinhaConsulta extends RowDataPacket {
    id: number;
    usuarioId: number;
    titulo: string;
    descricao: string | null;
    prioridade: string;
    status: Status;
    especialidade: string;
    prazo: string | null;
    criadaEm: Date;
    procedimento: string | null;
}

function organizarConsultas(linhas: LinhaConsulta[]) {
    const consultas = new Map<number, {
        id: number;
        usuarioId: number;
        titulo: string;
        descricao: string | null;
        prioridade: string;
        status: Status;
        especialidade: string;
        prazo: string | null;
        criadaEm: Date;
        procedimentos: string[];
    }>();

    for (const linha of linhas) {
        if (!consultas.has(linha.id)) {
            consultas.set(linha.id, {
                id: linha.id,
                usuarioId: linha.usuarioId,
                titulo: linha.titulo,
                descricao: linha.descricao,
                prioridade: linha.prioridade,
                status: linha.status,
                especialidade: linha.especialidade,
                prazo: linha.prazo,
                criadaEm: linha.criadaEm,
                procedimentos: []
            });
        }

        if (linha.procedimento) {
            consultas.get(linha.id)!.procedimentos.push(linha.procedimento);
        }
    }

    return Array.from(consultas.values());
}

// ---------- Validação dos dados ----------

function validar(dados: DadosConsulta): string | null {
    if (
        typeof dados.titulo !== "string" ||
        dados.titulo.trim().length < 3
    ) {
        return "O título deve ter pelo menos 3 caracteres.";
    }

    if (
        dados.prioridade !== undefined &&
        !PRIORIDADES.includes(dados.prioridade)
    ) {
        return "Prioridade inválida.";
    }

    if (!ESPECIALIDADES.includes(dados.especialidade)) {
        return "Especialidade inválida.";
    }

    if (
        dados.descricao !== undefined &&
        dados.descricao !== null &&
        typeof dados.descricao !== "string"
    ) {
        return "Descrição inválida.";
    }

    if (
        dados.procedimentos !== undefined &&
        (
            !Array.isArray(dados.procedimentos) ||
            !dados.procedimentos.every(
                procedimento =>
                    typeof procedimento === "string" &&
                    procedimento.trim().length > 0
            )
        )
    ) {
        return "Procedimentos inválidos.";
    }

    if (
        dados.prazo !== undefined &&
        dados.prazo !== null &&
        (
            typeof dados.prazo !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(dados.prazo) ||
            Number.isNaN(Date.parse(`${dados.prazo}T00:00:00`))
        )
    ) {
        return "Prazo inválido.";
    }

    return null;
}

// ---------- Busca de uma consulta ----------

async function buscarUma(id: number, usuarioId: number) {
    const [linhas] = await banco.execute<LinhaConsulta[]>(
        `
            ${SELECT_CONSULTAS}
            WHERE c.id = ? AND c.usuario_id = ?
            ORDER BY p.ordem
        `,
        [id, usuarioId]
    );

    return organizarConsultas(linhas)[0] ?? null;
}

// ---------- Verificação do corpo da requisição ----------

function corpoValido(req: Request): req is Request & { body: DadosConsulta } {
    return (
        req.body !== null &&
        typeof req.body === "object" &&
        !Array.isArray(req.body)
    );
}

// ---------- Listar consultas ----------

app.get(
    "/api/consultas",
    exigirLogin,
    async (_req: Request, res: Response) => {
        const usuarioId = usuarioDe(res);

        const [linhas] = await banco.execute<LinhaConsulta[]>(
            `
                ${SELECT_CONSULTAS}
                WHERE c.usuario_id = ?
                ORDER BY c.criada_em DESC, c.id DESC, p.ordem
            `,
            [usuarioId]
        );

        res.json(organizarConsultas(linhas));
    }
);

// ---------- Buscar consulta por ID ----------

app.get(
    "/api/consultas/:id",
    exigirLogin,
    async (req: Request, res: Response) => {
        const usuarioId = usuarioDe(res);
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ erro: "ID inválido." });
            return;
        }

        const consulta = await buscarUma(id, usuarioId);

        if (!consulta) {
            res.status(404).json({ erro: "Consulta não encontrada." });
            return;
        }

        res.json(consulta);
    }
);

// ---------- Cadastrar consulta ----------

app.post(
    "/api/consultas",
    exigirLogin,
    async (req: Request, res: Response) => {
        if (!corpoValido(req)) {
            res.status(400).json({ erro: "Dados inválidos." });
            return;
        }

        const dados = req.body;
        const erro = validar(dados);

        if (erro) {
            res.status(400).json({ erro });
            return;
        }

        const usuarioId = usuarioDe(res);
        const conexao = await banco.getConnection();

        let consultaId: number;

        try {
            await conexao.beginTransaction();

            const [resultado] = await conexao.execute<ResultSetHeader>(
                `
                    INSERT INTO consultas
                    (usuario_id, titulo, descricao, prioridade, especialidade, prazo)
                    VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    usuarioId,
                    dados.titulo.trim(),
                    dados.descricao?.trim() || null,
                    dados.prioridade ?? "media",
                    dados.especialidade,
                    dados.prazo || null
                ]
            );

            consultaId = resultado.insertId;

            if (dados.procedimentos?.length) {
                for (let i = 0; i < dados.procedimentos.length; i++) {
                    await conexao.execute(
                        `
                            INSERT INTO procedimentos
                            (consulta_id, ordem, descricao)
                            VALUES (?, ?, ?)
                        `,
                        [
                            consultaId,
                            i + 1,
                            dados.procedimentos[i].trim()
                        ]
                    );
                }
            }

            await conexao.commit();
        } catch (erro) {
            await conexao.rollback();
            throw erro;
        } finally {
            conexao.release();
        }

        const consulta = await buscarUma(consultaId, usuarioId);

        if (!consulta) {
            res.status(500).json({
                erro: "A consulta foi cadastrada, mas não pôde ser recuperada."
            });
            return;
        }

        res.status(201).json(consulta);
    }
);

// ---------- Alterar status ----------

app.patch(
    "/api/consultas/:id/status",
    exigirLogin,
    async (req: Request, res: Response) => {
        const usuarioId = usuarioDe(res);
        const id = Number(req.params.id);
        const status = req.body?.status as Status;

        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ erro: "ID inválido." });
            return;
        }

        if (!STATUS.includes(status)) {
            res.status(400).json({ erro: "Status inválido." });
            return;
        }

        const [resultado] = await banco.execute<ResultSetHeader>(
            `
                UPDATE consultas
                SET status = ?
                WHERE id = ? AND usuario_id = ?
            `,
            [status, id, usuarioId]
        );

        if (resultado.affectedRows === 0) {
            res.status(404).json({ erro: "Consulta não encontrada." });
            return;
        }

        res.status(204).send();
    }
);

// ---------- Remover consulta ----------

app.delete(
    "/api/consultas/:id",
    exigirLogin,
    async (req: Request, res: Response) => {
        const usuarioId = usuarioDe(res);
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ erro: "ID inválido." });
            return;
        }

        const [resultado] = await banco.execute<ResultSetHeader>(
            `
                DELETE FROM consultas
                WHERE id = ? AND usuario_id = ?
            `,
            [id, usuarioId]
        );

        if (resultado.affectedRows === 0) {
            res.status(404).json({ erro: "Consulta não encontrada." });
            return;
        }

        res.status(204).send();
    }
);


 // ---------- USUÁRIOS (Aula 5) ----------

app.post("/api/usuarios", async (req: Request, res: Response) => {
    const { nome, email, senha } = req.body as {
        nome?: string;
        email?: string;
        senha?: string;
    };

    if (
        !nome?.trim() ||
        !email?.includes("@") ||
        !senha ||
        senha.length < 6
    ) {
        res.status(400).json({
            erro: "Preencha nome, e-mail válido e senha de 6 caracteres ou mais."
        });
        return;
    }

    const hash = await bcrypt.hash(senha, 10);

    try {
        const [resultado] = await banco.execute<ResultSetHeader>(
            `
                INSERT INTO usuarios (nome, email, senha_hash)
                VALUES (?, ?, ?)
            `,
            [nome.trim(), email.trim().toLowerCase(), hash]
        );

        res.status(201).json({ id: resultado.insertId });
    } catch (erro) {
        if (
            (erro as { code?: string }).code === "ER_DUP_ENTRY"
        ) {
            res.status(409).json({
                erro: "Este e-mail já está cadastrado."
            });
            return;
        }

        throw erro;
    }
});

// ---------- LOGIN (Aula 5) ----------

app.post("/api/login", async (req: Request, res: Response) => {
    const { email, senha } = req.body as {
        email?: string;
        senha?: string;
    };

    const [linhas] = await banco.execute<RowDataPacket[]>(
        `
            SELECT id, nome, senha_hash
            FROM usuarios
            WHERE email = ?
        `,
        [email?.trim().toLowerCase() ?? ""]
    );

    const usuario = linhas[0];

    if (
        !usuario ||
        !senha ||
        typeof senha !== "string" ||
        !(await bcrypt.compare(senha, usuario.senha_hash))
    ) {
        res.status(401).json({
            erro: "E-mail ou senha inválidos."
        });
        return;
    }

    const token = jwt.sign(
        { id: usuario.id },
        SEGREDO,
        { expiresIn: "8h" }
    );

    res.json({
        token,
        nome: usuario.nome
    });
});


// ---------- Tratamento de erros ----------

app.use(
    (
        erro: unknown,
        _req: Request,
        res: Response,
        _next: NextFunction
    ) => {
        console.error("Erro na API:", erro);

        if (res.headersSent) {
            return;
        }

        res.status(500).json({
            erro: "Erro interno no servidor."
        });
    }
);

// ---------- Inicialização ----------

app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});
