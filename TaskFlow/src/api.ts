import type { NovaConsulta, Status, Consulta } from "./tipos";

// Ajudante que todas as chamadas usam:
// monta o pedido e trata possíveis erros.
async function enviar(
    metodo: string,
    url: string,
    corpo?: unknown
): Promise<Response> {
    const resposta = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });

    if (!resposta.ok) {
        // A API manda { erro: "..." }; se não mandar,
        // usamos o código HTTP.
        const dados = (await resposta.json().catch(() => ({}))) as {
            erro?: string;
        };

        throw new Error(dados.erro ?? `Erro ${resposta.status}`);
    }

    return resposta;
}

// JSON não possui Date: criadaEm chega como texto
// e precisa ser convertida novamente para Date.
function converter(consulta: Consulta): Consulta {
    return {
        ...consulta,
        criadaEm: new Date(consulta.criadaEm),
    };
}

// Lista todas as consultas.
export async function listarConsultas(): Promise<Consulta[]> {
    const resposta = await enviar("GET", "/api/consultas");
    const bruto = (await resposta.json()) as Consulta[];

    return bruto.map(converter);
}

// Cadastra uma nova consulta.
export async function cadastrarConsulta(
    dados: NovaConsulta
): Promise<Consulta> {
    const resposta = await enviar("POST", "/api/consultas", dados);

    return converter((await resposta.json()) as Consulta);
}

// Altera o status de uma consulta.
export async function alterarStatus(
    id: number,
    status: Status
): Promise<void> {
    await enviar("PATCH", `/api/consultas/${id}/status`, { status });
}

// Remove uma consulta.
export async function removerConsulta(id: number): Promise<void> {
    await enviar("DELETE", `/api/consultas/${id}`);
}

// Busca uma consulta específica pelo ID.
export async function buscarConsulta(id: number): Promise<Consulta | null> {
    try {
        const resposta = await enviar("GET", `/api/consultas/${id}`);
        const bruto = (await resposta.json()) as Consulta;

        return converter(bruto);

    } catch (erro) {
        if (
            erro instanceof Error &&
            erro.message === `Consulta #${id} não encontrada.`
        ) {
            return null;
        }

        throw erro;
    }
}