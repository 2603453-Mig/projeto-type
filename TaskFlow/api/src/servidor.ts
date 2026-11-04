
import "dotenv/config"; // primeira linha: carrega o .env antes de tudo
import express from "express";
import type { RowDataPacket } from "mysql2";
import { banco } from "./banco";

const app = express();
app.use(express.json());

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

// Todas as consultas
app.get("/api/consultas", async (_req, res) => {
    const [linhas] = await banco.execute<RowDataPacket[]>(
        `${SELECT_CONSULTAS} ORDER BY c.id, p.ordem`,
        []
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
        `${SELECT_CONSULTAS} WHERE c.id = ? ORDER BY p.ordem`,
        [id]
    );

    if (linhas.length === 0) {
        res.status(404).json({
            erro: `Consulta #${id} não encontrada.`
        });
        return;
    }

    res.json(organizarConsultas(linhas)[0]);
});

app.listen(3000, () =>
    console.log("API de Consultas em http://localhost:3000")
);