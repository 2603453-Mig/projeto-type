export type Prioridade = "baixa" | "media" | "alta";
export type Status = "marcada" | "confirmada" | "realizada" | "cancelada";
export type Especialidade = "cardiologia" | "gastroenterologia" | "geriatria" | "endocrinologia";

export const PRIORIDADES: Prioridade[] = ["baixa" , "media" , "alta"];
export const STATUS: Status[] = ["marcada" , "confirmada" , "realizada" , "cancelada"];
export const ESPECIALIDADES: Especialidade[]= ["cardiologia" , "gastroenterologia" , "geriatria" , "endocrinologia"];

export interface DadosConsulta {
    readonly id: number;
    titulo: string;
    descricao?: string | null;
    prioridade?: Prioridade;
    status: Status;
    especialidade: Especialidade;
    procedimentos: string[];
    prazo?: string | null;
    criadaEm: Date;

}