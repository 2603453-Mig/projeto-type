import { campo, elemento, selecao } from "./dom";
import { consultas } from "./dados";
import type { Prioridade, Consulta, Especialidade } from "./tipos";
import { adicionarConsulta, transformar } from "./servicos"

// ---------- Parte 1: tipos primitivos ----------
const nomeDoSistema: string = "Consultas";
const versao: string = "0.2.0";
const hoje: string = new Date().toLocaleDateString("pt-BR");
const autor = "Turma de quinta"; // inferência: o TypeScript deduz que é string

elemento("nome-do-sistema").textContent = nomeDoSistema;
elemento("versao").textContent = `v${versao}`;
elemento("data-de-hoje").textContent = hoje;
console.log(`TaskFlow iniciado. Autor: ${autor}`); // aparece no F12

// ---------- Parte 2----------

//LAÇO 1 — for com índice: contando as canceladas
let cancelada = 0;
for (let i = 0; i < consultas.length; i++) {
    if (consultas[i].status === "cancelada") {
        if (!consultas[i].titulo.includes("(CANCELADA)")) {
            consultas[i].titulo = (consultas[i].titulo + " (CANCELADA)");
            console.log(consultas[i].titulo)
        }
        cancelada++;
    }
}

elemento("cancelada").textContent = String(cancelada);

// LAÇO 2 — for com índice: contando as realizadas
let realizada = 0;
for (let i = 0; i < consultas.length; i++) {
    if (consultas[i].status === "realizada") {
        if (!consultas[i].titulo.includes("(REALIZADA)")) {
            consultas[i].titulo = (consultas[i].titulo + " (REALIZADA)");
            console.log(consultas[i].titulo)
        }
        realizada++;
    }
}

elemento("marcada").textContent = String(consultas.length);
elemento("realizada").textContent = String(realizada);

// O estado do programa: a lista que está valendo agora
const lista: Consulta[] = [...consultas];
// Uma consulta vira um <li> pronto para a tela
function criarItem(consulta: Consulta): HTMLLIElement {
    const item = document.createElement("li");
    item.className = `consulta consulta--${consulta.prioridade}`;
    const titulo = document.createElement("h3");
    titulo.className = "consulta__titulo";
    titulo.textContent = `#${consulta.id} ${consulta.titulo}`;
    const etiqueta = document.createElement("span");
    etiqueta.className = `etiqueta etiqueta--${consulta.prioridade}`;
    etiqueta.textContent = consulta.prioridade;
    item.append(titulo, etiqueta);
    return item;
}
// A função que desenha a tela inteira a partir da lista
function desenhar(): void {
    const itens = transformar(lista, criarItem); // a SUA função de alta ordem
    elemento("lista").replaceChildren(...itens);
    let confirmada = 0;
    for (const consulta of lista) {
        if (consulta.status === "confirmada") {
            confirmada++;
        }
    }
    elemento("marcada").textContent = String(lista.length);
    elemento("confirmada").textContent = String(confirmada);
}
// O formulário: a função abaixo é um CALLBACK — quem a chama é o navegador
elemento("formulario").addEventListener("submit", (evento) => {
    evento.preventDefault(); // sem isto, a página recarrega e tudo se perde
    elemento("erro").textContent = "";
    try {
        adicionarConsulta(lista, {
            titulo: campo("titulo").value.trim(),
            prioridade: selecao("prioridade").value as Prioridade,
            especialidade: selecao("especialidade").value as Especialidade,
            procedimentos: [],
        });
        campo("titulo").value = "";
        desenhar(); // mudou a lista? desenhe de novo
    } catch (erro) {
        if (erro instanceof Error) {
            elemento("erro").textContent = erro.message;
        }
    }
});

desenhar();

// LAÇO 5 — while: achar a primeira consulta de prioridade alta
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