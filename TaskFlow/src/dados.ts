import type { Tarefa } from "./tipos";
export const tarefas: Tarefa[] = [
    { id: 1, titulo: "Estudar interfaces", prioridade: "alta", status: "pendente",
        tags: ["estudo", "ts"], criadaEm: new Date() },
    { id: 2, titulo: "Comprar café", prioridade: "baixa", status: "concluida",
        tags: ["casa"], criadaEm: new Date() },
    { id: 3, titulo: "Revisar pull request", descricao: "PR #42", prioridade: "alta",
        status: "em_andamento", tags: ["trabalho"], criadaEm: new Date() },
    { id: 4, titulo: "Praticar laços", prioridade: "media", status: "pendente",
        tags: ["estudo", "ts"], criadaEm: new Date() },
    { id: 5, titulo: "Agendar dentista", prioridade: "media", status: "pendente",
        tags: ["saude"], criadaEm: new Date() },
    { id: 6, titulo: "Organizar a mesa", prioridade: "baixa", status: "pendente",
        tags: ["casa"], criadaEm: new Date() },
];