import { elemento } from "./dom";
import { tarefas } from "./dados";

// ---------- Parte 1: tipos primitivos ----------
const nomeDoSistema: string = "TaskFlow";
const versao: string = "0.1.0";
const hoje: string = new Date().toLocaleDateString("pt-BR");
const autor = "Turma de quinta"; // inferência: o TypeScript deduz que é string

elemento("nome-do-sistema").textContent = nomeDoSistema;
elemento("versao").textContent = `v${versao}`;
elemento("data-de-hoje").textContent = hoje;
console.log(`TaskFlow iniciado. Autor: ${autor}`); // aparece no F12

// ---------- Parte 3: o array e os laços ----------
const lista = elemento("lista");

// LAÇO 1 — for...of: percorre os valores, sem índice
for (const tarefa of tarefas) {
    const item = document.createElement("li");
    item.className = `tarefa tarefa--${tarefa.prioridade}`;
    const titulo = document.createElement("h3");
    titulo.className = "tarefa__titulo";
    titulo.textContent = `#${tarefa.id} ${tarefa.titulo}`;
    const etiqueta = document.createElement("span");
    etiqueta.className = `etiqueta etiqueta--${tarefa.prioridade}`;
    etiqueta.textContent = tarefa.prioridade;
    item.append(titulo, etiqueta);
    lista.append(item);
}

// LAÇO 2 — for com índice: contando as pendentes
let pendentes = 0;
for (let i = 0; i < tarefas.length; i++) {
    if (tarefas[i].status === "pendente") {
    pendentes++;
    }
}

elemento("total").textContent = String(tarefas.length);
elemento("pendentes").textContent = String(pendentes);

// LAÇO 3 — while: achar a primeira tarefa de prioridade alta
// (não sabemos quantas voltas: o laço para assim que encontra)
let posicao = 0;

while (posicao < tarefas.length && tarefas[posicao].prioridade !== "alta") {
    posicao++;
}

if (posicao < tarefas.length) {
    // achou: mostra o aviso na página
    const urgente = tarefas[posicao];
    elemento("comece-por").textContent = `Comece por: #${urgente.id} ${urgente.titulo}`;
    elemento("comece-por").hidden = false;
}

//import { elemento } from "./dom";
//import type { Tarefa } from "./tipos";

////Criar as variaveis
//const nomeDoSistema: string = "TaskFlow";
//const versao: string = "0.1.0";
//const hoje: string = new Date().toLocaleDateString("pt-BR");
//const autor = "Turma de quinta"; // inferência: o TypeScript deduz que é string


////Renderiza np Html pelo elemento do arquivo do arquiv dom importado
//elemento("nome-do-sistema").textContent = nomeDoSistema;
//elemento("versao").textContent = `v${versao}`;
//elemento("data-de-hoje").textContent = hoje;
//console.log(`TaskFlow iniciado. Autor: ${autor}`); // aparece no F12