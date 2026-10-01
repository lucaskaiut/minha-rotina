# Documento de Requisitos Funcionais

## Aplicativo de Gestão de Tarefas entre Mãe e Filha

### Versão

1.0

### Objetivo

Desenvolver um aplicativo web responsivo (PWA) que permita que uma mãe organize, acompanhe e monitore as atividades diárias da filha, promovendo disciplina, autonomia e acompanhamento das responsabilidades.

O sistema deverá permitir a criação de tarefas com horários definidos, acompanhamento da execução, notificações recorrentes e visualização de desempenho através de um painel de acompanhamento.

---

# 1. Tecnologias

## Backend

* Laravel 12+
* API REST
* Banco de Dados MySQL
* Laravel Queue
* Laravel Notifications
* Firebase Cloud Messaging (FCM)

## Frontend

* React
* PWA (Progressive Web App)
* Responsive Design (Mobile First)

---

# 2. Perfis de Usuário

## 2.1 Perfil Mãe

Responsável por:

* Cadastrar e gerenciar tarefas
* Criar rotinas semanais
* Acompanhar desempenho
* Visualizar relatórios
* Receber informações sobre conclusão das atividades
* Configurar notificações

---

## 2.2 Perfil Filha

Responsável por:

* Visualizar tarefas do dia
* Marcar tarefas como concluídas
* Acompanhar progresso pessoal
* Visualizar conquistas e metas

Não possui acesso para:

* Alterar configurações do sistema
* Editar tarefas criadas pela mãe
* Excluir registros

---

# 3. Módulos do Sistema

## Módulo 1 - Autenticação

### Funcionalidades

* Cadastro de conta
* Login
* Recuperação de senha
* Logout

### Regras

* Cada família possui uma única mãe responsável.
* A mãe pode cadastrar uma ou mais filhas.
* Cada filha possui login próprio.

---

# Módulo 2 - Gestão de Filhas

## Cadastro de Filha

Campos:

* Nome
* Foto (opcional)
* Data de nascimento
* E-mail ou usuário
* Senha

### Funcionalidades

* Criar perfil
* Editar perfil
* Ativar/Inativar perfil

---

# Módulo 3 - Gestão de Tarefas

## Cadastro de Tarefa

Campos:

* Título
* Descrição
* Categoria
* Dia da semana
* Horário de início
* Horário limite
* Cor da tarefa
* Pontuação (opcional)

Exemplos:

* Fazer lição
* Arrumar quarto
* Escovar os dentes
* Alimentar animal de estimação
* Tomar banho

---

## Funcionalidades

### Criar tarefa

A mãe poderá criar tarefas para:

* Um dia específico
* Vários dias da semana
* Todos os dias

---

### Editar tarefa

Permitir alterações futuras.

---

### Excluir tarefa

Remover tarefas da rotina.

---

### Duplicar tarefa

Facilitar criação de rotinas semelhantes.

---

# Módulo 4 - Agenda Diária

## Visualização da Filha

Ao acessar o sistema, a filha verá:

### Hoje

Lista cronológica das tarefas do dia:

08:00 - Arrumar cama

09:00 - Escovar dentes

10:00 - Fazer lição

14:00 - Organizar brinquedos

---

Cada tarefa deverá possuir:

* Status pendente
* Status concluída
* Horário previsto
* Horário de conclusão

---

## Concluir Tarefa

A filha poderá clicar em:

✅ Concluir tarefa

O sistema registrará:

* Data
* Hora
* Usuário

---

# Módulo 5 - Notificações

## Notificações para Filha

O sistema deverá enviar notificações push.

### Exemplos

* Você possui atividades pendentes.
* Verifique sua lista de tarefas.
* Hora de realizar sua próxima atividade.

---

## Configuração pela Mãe

A mãe poderá definir:

### Frequência

* A cada 30 minutos
* A cada 1 hora
* A cada 2 horas

### Janela de envio

Exemplo:

* Início: 12:00
* Fim: 20:00

O sistema enviará lembretes recorrentes durante o período.

---

## Notificações de Conclusão

Quando a filha concluir uma tarefa:

A mãe poderá receber:

* Tarefa concluída
* Horário da conclusão

---

# Módulo 6 - Área de Acompanhamento

## Dashboard da Mãe

Tela principal de acompanhamento.

---

### Indicadores do Dia

Exibir:

* Total de tarefas programadas
* Total concluídas
* Total pendentes
* Percentual de conclusão

Exemplo:

* 10 tarefas previstas
* 7 concluídas
* 3 pendentes
* 70% de aproveitamento

---

### Indicadores Semanais

Exibir:

* Total da semana
* Média diária
* Evolução

---

### Histórico

Listagem:

Data | Tarefa | Status | Horário

---

### Gráfico de Desempenho

Visualização por:

* Dia
* Semana
* Mês

---

# Módulo 7 - Sistema de Conquistas

Objetivo: incentivar o cumprimento das atividades.

---

## Conquistas Automáticas

Exemplos:

### Primeira Missão

Concluir a primeira tarefa.

---

### Dia Perfeito

Concluir todas as tarefas do dia.

---

### Semana Completa

Concluir todas as tarefas durante 7 dias consecutivos.

---

## Exibição

A filha terá uma tela de:

* Conquistas desbloqueadas
* Próximas conquistas

---

# Módulo 8 - Relatórios

## Relatório Diário

Exibir:

* Tarefas programadas
* Tarefas concluídas
* Tarefas não realizadas

---

## Relatório Semanal

Exibir:

* Aproveitamento
* Evolução
* Dias com melhor desempenho

---

## Relatório Mensal

Exibir:

* Percentual geral
* Quantidade de tarefas realizadas
* Quantidade de tarefas não realizadas

---

# Módulo 9 - Gamificação

## Sistema de Pontos

Cada tarefa poderá gerar pontos.

Exemplo:

* Arrumar quarto = 10 pontos
* Fazer lição = 20 pontos

---

## Ranking Pessoal

Exibir:

* Pontuação acumulada
* Meta semanal
* Meta mensal

---

# Regras de Negócio

### RN001

Somente a mãe pode criar, editar ou excluir tarefas.

---

### RN002

A filha somente pode marcar tarefas como concluídas.

---

### RN003

Uma tarefa só pode ser concluída uma vez por dia.

---

### RN004

Todas as conclusões devem registrar data e horário.

---

### RN005

O dashboard deve ser atualizado em tempo real após conclusão de uma tarefa.

---

### RN006

As notificações devem respeitar a janela de horário configurada pela mãe.

---

### RN007

O sistema deve funcionar como PWA instalável em Android, iPhone e desktop.

---

# MVP (Primeira Versão)

Para entrega inicial recomenda-se:

### Incluso

* Login Mãe
* Login Filha
* Cadastro de Filha
* Cadastro de Tarefas
* Agenda Diária
* Conclusão de Tarefas
* Notificações Push
* Dashboard de Acompanhamento
* Relatório Diário
* Relatório Semanal

### Fase 2

* Conquistas
* Gamificação
* Ranking
* Metas
* Relatórios avançados
* Múltiplas filhas por família

Essa estrutura atende integralmente o que foi solicitado no áudio: cadastro de responsabilidades por dia e horário, acesso separado para mãe e filha, notificações recorrentes ao longo do dia e uma área de acompanhamento mostrando o que foi realizado e o que ficou pendente.
