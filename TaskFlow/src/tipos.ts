export type Prioridade = "baixa" | "media" | "alta";
export type Status = "marcada" | "confirmada" | "realizada" | "cancelada";
export type Especialidade = "cardiologia" | "gastroenterologia" | "geriatria" | "endocrinologia";

export interface Consulta {
    readonly id: number;
    titulo: string;
    descricao?: string | null;
    prioridade: Prioridade;
    status: Status;
    especialidade: Especialidade;
    procedimentos: string[];
    prazo?: string | null;
    criadaEm: Date;
}

//O que o usuario informa ao cadastrar:
//id, status e criadaEm são responsabilidade do sistema
export type NovaConsulta = Omit<Consulta, "id" | "status" | "criadaEm">;