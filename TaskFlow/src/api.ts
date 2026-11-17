import type { NovaConsulta, Status, Consulta, Sessao } from "./tipos";

const CHAVE_SESSAO = "consultas:sessao";

// ---------- A sessão: o "crachá" guardado no navegador ----------

export function sessaoAtual(): Sessao | undefined {
    const texto = localStorage.getItem(CHAVE_SESSAO);

    return texto ? (JSON.parse(texto) as Sessao) : undefined;
}

export function guardarSessao(sessao: Sessao): void {
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

export function encerrarSessao(): void {
    localStorage.removeItem(CHAVE_SESSAO);
}

// ---------- Enviar requisições à API ----------

// Ajudante que envia o token em todo pedido.
async function enviar(
    metodo: string,
    url: string,
    corpo?: unknown
): Promise<Response> {
    const sessao = sessaoAtual();

    const resposta = await fetch(url, {
        method: metodo,
        headers: {
            "Content-Type": "application/json",
            ...(sessao ? { Authorization: `Bearer ${sessao.token}` } : {}),
        },
        body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });

    // Crachá vencido ou inválido: volta para a tela de entrada.
    if (resposta.status === 401 && sessao) {
        encerrarSessao();
        location.reload();
    }

    if (!resposta.ok) {
        // A API manda { erro: "..." }; se não mandar, usamos o código.
        const dados = (await resposta.json().catch(() => ({}))) as {
            erro?: string;
        };

        // 502/504: o Vite não encontrou a API.
        const semApi = resposta.status === 502 || resposta.status === 504;

        throw new Error(
            dados.erro ??
            (semApi
                ? "A API não respondeu. Rode npm run dev na pasta api."
                : `Erro ${resposta.status}`)
        );
    }

    return resposta;
}

// ---------- Conversão dos dados ----------

// JSON não possui Date: criadaEm chega como texto.
function converter(consulta: Consulta): Consulta {
    return {
        ...consulta,
        criadaEm: new Date(consulta.criadaEm),
    };
}

// ---------- Consultas ----------

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
export async function buscarConsulta(
    id: number
): Promise<Consulta | null> {
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

// ---------- Usuários ----------

// Realiza o login.
export async function entrar(
    email: string,
    senha: string
): Promise<Sessao> {
    const resposta = await enviar("POST", "/api/login", { email, senha });

    return (await resposta.json()) as Sessao;
}

// Cria uma nova conta.
export async function criarConta(
    nome: string,
    email: string,
    senha: string
): Promise<void> {
    await enviar("POST", "/api/usuarios", { nome, email, senha });
}
