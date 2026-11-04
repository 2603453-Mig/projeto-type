import type { Consulta } from "./tipos";

// Todas as consultas que estão no banco
export async function listarConsultas(): Promise<Consulta[]> {
    const resposta = await fetch("/api/consultas");

    if (!resposta.ok) {
        throw new Error(
            "Não foi possível carregar as consultas. A API está rodando?"
        );
    }

    const bruto = (await resposta.json()) as Consulta[];

    // O JSON não possui objetos Date:
    // criadaEm chega como texto e precisa ser convertida.
    return bruto.map((consulta) => ({
        ...consulta,
        criadaEm: new Date(consulta.criadaEm)
    }));
}

// Busca uma consulta pelo ID.
// Devolve undefined caso ela não exista (mesmo padrão do find).
export async function buscarConsulta(
    id: number
): Promise<Consulta | undefined> {
    const resposta = await fetch(`/api/consultas/${id}`);

    if (resposta.status === 404) {
        return undefined;
    }

    if (!resposta.ok) {
        throw new Error(
            `Erro ${resposta.status} ao buscar a consulta #${id}.`
        );
    }

    const bruto = (await resposta.json()) as Consulta;

    return {
        ...bruto,
        criadaEm: new Date(bruto.criadaEm)
    };
}