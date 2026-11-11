import express, { type NextFunction, type Request, type Response } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
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
const USUARIO_FIXO = 1;

// SELECT principal: consulta os dados de todas as consultas.
// Os AS adaptam os nomes das colunas do banco para o TypeScript.
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
LEFT JOIN procedimentos p
    ON c.id = p.consulta_id
`;

// Organiza os resultados e agrupa os procedimentos de cada consulta.
function organizarConsultas(linhas: RowDataPacket[]) {
    const resultado = new Map<number, {
        id: number;
        usuarioId: number;
        titulo: string;
        descricao: string | null;
        prioridade: string;
        status: string;
        especialidade: string;
        prazo: string | null;
        criadaEm: Date;
        procedimentos: string[];
    }>();

    for (const linha of linhas) {
        if (!resultado.has(linha.id)) {
            resultado.set(linha.id, {
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

        if (linha.procedimento !== null) {
            resultado.get(linha.id)!.procedimentos.push(linha.procedimento);
        }
    }

    return Array.from(resultado.values());
}

function validar(dados: DadosConsulta): string | null {
    if (!dados.titulo || dados.titulo.trim().length < 3) {
        return "O título deve possuir pelo menos 3 caracteres.";
    }

    if (dados.prioridade && !PRIORIDADES.includes(dados.prioridade)) {
        return "Prioridade inválida.";
    }

    if (!dados.especialidade || !ESPECIALIDADES.includes(dados.especialidade)) {
        return "Especialidade inválida.";
    }

    if (
        dados.procedimentos !== undefined &&
        (!Array.isArray(dados.procedimentos) ||
            !dados.procedimentos.every(p => typeof p === "string" && p.trim().length > 0))
    ) {
        return "A lista de procedimentos é inválida.";
    }

    return null;
}

async function buscarUma(id: number) {
    const [linhas] = await banco.execute<RowDataPacket[]>(
        `${SELECT_CONSULTAS} WHERE c.id = ? AND c.usuario_id = ? ORDER BY p.ordem`,
        [id, USUARIO_FIXO]
    );

    return linhas.length > 0
        ? organizarConsultas(linhas)[0]
        : null;
}

// Lista somente as consultas do usuário atual.
app.get("/api/consultas", async (_req, res) => {
    const [linhas] = await banco.execute<RowDataPacket[]>(
        `${SELECT_CONSULTAS}
        WHERE c.usuario_id = ?
        ORDER BY c.id, p.ordem`,
        [USUARIO_FIXO]
    );

    res.json(organizarConsultas(linhas));
});

// Uma consulta: pode não existir!
app.get("/api/consultas/:id", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ erro: "ID de consulta inválido." });
        return;
    }

    const [linhas] = await banco.execute<RowDataPacket[]>(
        `${SELECT_CONSULTAS}
    WHERE c.id = ? AND c.usuario_id = ?
    ORDER BY p.ordem`,
        [id, USUARIO_FIXO]
    );

    if (linhas.length === 0) {
        res.status(404).json({
            erro: `Consulta #${id} não encontrada.`
        });
        return;
    }

    res.json(organizarConsultas(linhas)[0]);
});

// ---------- CRIAR ----------
app.post("/api/consultas", async (req, res) => {
    const dados = req.body as DadosConsulta;
    const problema = validar(dados);

    if (problema) {
        res.status(400).json({ erro: problema });
        return;
    }

    const conexao = await banco.getConnection();

    try {
        await conexao.beginTransaction();

        const [resultado] = await conexao.execute<ResultSetHeader>(
            `INSERT INTO consultas
            (usuario_id, titulo, descricao, prioridade, especialidade, prazo)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                USUARIO_FIXO,
                dados.titulo!.trim(),
                dados.descricao ?? null,
                dados.prioridade ?? "media",
                dados.especialidade!,
                dados.prazo || null
            ]
        );

        const consultaId = resultado.insertId;

        const procedimentos = dados.procedimentos ?? [];

        for (let i = 0; i < procedimentos.length; i++) {
            await conexao.execute(
                `INSERT INTO procedimentos
                (consulta_id, ordem, descricao)
                VALUES (?, ?, ?)`,
                [consultaId, i + 1, procedimentos[i].trim()]
            );
        }

        await conexao.commit();

        res.status(201).json(await buscarUma(consultaId));
    } catch (erro) {
        await conexao.rollback();
        throw erro;
    } finally {
        conexao.release();
    }
});

// ---------- ATUALIZAR (só o status) ----------
app.patch("/api/consultas/:id/status", async (req, res) => {
    const { status } = req.body as { status?: Status };

    if (!status || !STATUS.includes(status)) {
        res.status(400).json({ erro: "Status inválido." });
        return;
    }

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ erro: "ID de consulta inválido." });
        return;
    }

    const [resultado] = await banco.execute<ResultSetHeader>(
        `UPDATE consultas
        SET status = ?
        WHERE id = ? AND usuario_id = ?`,
        [status, id, USUARIO_FIXO]
    );

    if (resultado.affectedRows === 0) {
        res.status(404).json({
            erro: `Consulta #${id} não encontrada.`
        });
        return;
    }

    res.status(204).end();
});

// ---------- APAGAR ----------
app.delete("/api/consultas/:id", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ erro: "ID de consulta inválido." });
        return;
    }

    const [resultado] = await banco.execute<ResultSetHeader>(
        `DELETE FROM consultas
        WHERE id = ? AND usuario_id = ?`,
        [id, USUARIO_FIXO]
    );

    if (resultado.affectedRows === 0) {
        res.status(404).json({
            erro: `Consulta #${id} não encontrada.`
        });
        return;
    }

    res.status(204).end();
});


// ---------- ERROS NÃO PREVISTOS ----------
app.use((
    erro: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    console.error(erro);

    res.status(500).json({
        erro: "Algo deu errado no servidor. Tente de novo."
    });
});

app.listen(3000, () =>
    console.log("API de Consultas em http://localhost:3000")
);