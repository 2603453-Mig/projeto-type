-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 04/11/2026 às 02:22
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `consultas`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `consultas`
--

CREATE TABLE `consultas` (
  `id` int(10) UNSIGNED NOT NULL,
  `usuario_id` int(10) UNSIGNED NOT NULL,
  `titulo` varchar(120) NOT NULL,
  `descricao` text DEFAULT NULL,
  `prioridade` enum('baixa','media','alta') NOT NULL DEFAULT 'media',
  `status` enum('marcada','confirmada','realizada','cancelada') NOT NULL DEFAULT 'marcada',
  `especialidade` enum('cardiologia','gastroenterologia','geriatria','endocrinologia') NOT NULL,
  `prazo` date DEFAULT NULL,
  `criada_em` datetime NOT NULL DEFAULT current_timestamp()
) ;

--
-- Despejando dados para a tabela `consultas`
--

INSERT INTO `consultas` (`id`, `usuario_id`, `titulo`, `descricao`, `prioridade`, `status`, `especialidade`, `prazo`, `criada_em`) VALUES
(1, 1, 'Check-up geral', 'Avaliação periódica da saúde.', 'baixa', 'confirmada', 'geriatria', '2026-11-15', '2026-11-03 22:14:13'),
(2, 2, 'Eletrocardiograma', 'Exame para avaliar a atividade elétrica do coração.', 'alta', 'realizada', 'cardiologia', '2026-11-10', '2026-11-03 22:14:13'),
(3, 1, 'Avaliação de arritmia', 'Investigação de alterações no ritmo cardíaco.', 'alta', 'marcada', 'cardiologia', '2026-11-20', '2026-11-03 22:14:13'),
(4, 3, 'Consulta de gastrite', 'Avaliação de sintomas gastrointestinais.', 'media', 'confirmada', 'gastroenterologia', '2026-11-12', '2026-11-03 22:14:13'),
(5, 3, 'Desconforto intestinal', 'Consulta cancelada pelo paciente.', 'baixa', 'cancelada', 'gastroenterologia', NULL, '2026-11-03 22:14:13'),
(6, 2, 'Avaliação da tireoide', 'Acompanhamento da função hormonal.', 'media', 'marcada', 'endocrinologia', '2026-11-25', '2026-11-03 22:14:13');

-- --------------------------------------------------------

--
-- Estrutura para tabela `procedimentos`
--

CREATE TABLE `procedimentos` (
  `consulta_id` int(10) UNSIGNED NOT NULL,
  `ordem` int(10) UNSIGNED NOT NULL,
  `descricao` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `procedimentos`
--

INSERT INTO `procedimentos` (`consulta_id`, `ordem`, `descricao`) VALUES
(1, 1, 'Hemograma completo'),
(1, 2, 'Exame parasitológico de fezes'),
(1, 3, 'Glicemia em jejum'),
(2, 1, 'Eletrocardiograma de repouso'),
(2, 2, 'Avaliação dos resultados'),
(3, 1, 'Holter 24 horas'),
(3, 2, 'Ecocardiograma'),
(4, 1, 'Endoscopia digestiva alta'),
(4, 2, 'Pesquisa de Helicobacter pylori'),
(5, 1, 'Avaliação clínica'),
(6, 1, 'TSH'),
(6, 2, 'T4 livre'),
(6, 3, 'Ultrassonografia da tireoide');

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(10) UNSIGNED NOT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `senha_hash` char(60) NOT NULL,
  `criado_em` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `usuarios`
--

INSERT INTO `usuarios` (`id`, `nome`, `email`, `senha_hash`, `criado_em`) VALUES
(1, 'Marcelo Macrino', 'marcelo@email.com', 'hash_da_senha_123', '2026-11-03 22:14:13'),
(2, 'João Silva', 'joao@email.com', 'hash_da_senha_456', '2026-11-03 22:14:13'),
(3, 'Maria Souza', 'maria@email.com', 'hash_da_senha_789', '2026-11-03 22:14:13');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `consultas`
--
ALTER TABLE `consultas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_consultas_usuario` (`usuario_id`),
  ADD KEY `idx_consultas_status` (`status`),
  ADD KEY `idx_consultas_prioridade` (`prioridade`),
  ADD KEY `idx_consultas_especialidade` (`especialidade`);

--
-- Índices de tabela `procedimentos`
--
ALTER TABLE `procedimentos`
  ADD PRIMARY KEY (`consulta_id`,`ordem`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_usuarios_email` (`email`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `consultas`
--
ALTER TABLE `consultas`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `consultas`
--
ALTER TABLE `consultas`
  ADD CONSTRAINT `fk_consultas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `procedimentos`
--
ALTER TABLE `procedimentos`
  ADD CONSTRAINT `fk_procedimentos_consulta` FOREIGN KEY (`consulta_id`) REFERENCES `consultas` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
