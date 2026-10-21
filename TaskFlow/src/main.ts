import { elemento } from "./dom";
import { consultas } from "./dados";

// ---------- Parte 1: tipos primitivos ----------
const nomeDoSistema: string = "Consultas";
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
for (const consulta of consultas) {
    const item = document.createElement("li");
    item.className = `tarefa tarefa--${consulta.prioridade}`;
    const titulo = document.createElement("h3");
    titulo.className = "tarefa__titulo";
    titulo.textContent = `#${consulta.id} ${consulta.titulo}`;
    const etiqueta = document.createElement("span");
    etiqueta.className = `etiqueta etiqueta--${consulta.prioridade}`;
    etiqueta.textContent = consulta.prioridade;
    item.append(titulo, etiqueta);
    lista.append(item);
}

// LAÇO 2 — for com índice: contando as realizadas
let realizada = 0;
for (let i = 0; i < consultas.length; i++) {
    if (consultas[i].status === "realizada") {
    realizada++;
    }
}

elemento("total").textContent = String(consultas.length);
elemento("realizada").textContent = String(realizada);

//for com índice: contando as confirmadas
let confirmada = 0;
for (let i = 0; i < consultas.length; i++) {
    if (consultas[i].status === "confirmada") {
    confirmada++;
    }
}

elemento("confirmada").textContent = String(confirmada);

//for com índice: contando as canceladas
let cancelada = 0;
for (let i = 0; i < consultas.length; i++) {
    if (consultas[i].status === "cancelada") {
    cancelada++;
    }
}

elemento("cancelada").textContent = String(cancelada);

// LAÇO 3 — while: achar a primeira tarefa de prioridade alta
// (não sabemos quantas voltas: o laço para assim que encontra)
let posicao = 0;

while (posicao < consultas.length && consultas[posicao].prioridade !== "alta") {
    posicao++;
}

if (posicao < consultas.length) {
    // achou: mostra o aviso na página
    const urgente = consultas[posicao];
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