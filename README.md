# PlanoERP - Gestão & Planejamento da Produção (PCP)

Sistema web full-stack completo para planejamento de produção, controle de estoque de matéria-prima, acompanhamento de ordens de produção e emissão de laudos técnicos para pequenas e médias empresas industriais.

---

## 🚀 Funcionalidades Principais

### 1. Módulos de Cadastro com Persistência
- **Ficha Técnica do Produto (BOM):**
  - Cadastro de produtos com código, nome, unidade e preço de venda.
  - **Tempo de processo por etapa:** definição dos minutos de trabalho por unidade em cada centro fabril, calculando o tempo total de fabricação automaticamente.
  - **Estrutura de materiais (BOM):** composição de matérias-primas por unidade com margem de perda/refugo (%) e cálculo de custo e margem de contribuição.
- **Matéria-Prima & Almoxarifado:**
  - Cadastro completo de insumos, unidade de medida, custo unitário e fornecedor preferencial.
  - Controle de estoque atual e alerta automático de estoque mínimo.
  - Histórico de movimentações e baixas automáticas de produção.
- **Clientes & Fornecedores:**
  - Cadastros completos (Razão Social, CNPJ/CPF, telefones, e-mails, endereços e prazos médios).
- **Capacidade Produtiva:**
  - Definição de centros de trabalho (ex: Corte, Usinagem CNC, Serralheria, Pintura, Montagem).
  - Cálculo de horas diárias, operadores alocados e taxa de eficiência (%).
  - Monitoramento da carga alocada em minutos/horas a partir das OPs em carteira.

### 2. Módulo de Pedidos de Venda
- Emissão de pedidos com múltiplos itens, produtos, preços e prazos de entrega.
- **Emissão Direta de OP:** botão para disparar a Ordem de Produção diretamente a partir de um item de pedido de venda.

### 3. Módulo de Produção (PCP)
- **Emissão de Ordens de Produção (OP):**
  - Número de OP sequencial, lote a produzir e cronograma.
  - Cálculo automático de insumos necessários pela Ficha Técnica x Quantidade do lote.
  - Verificação de estoque em tempo real (alerta se houver matéria-prima em falta).
- **Acompanhamento de Produção:**
  - Modos de visualização em Lista Operacional e Kanban de Chão de Fábrica.
  - Rastreamento e avanço de etapas de produção.
- **Baixa (Conclusão) de Ordens de Produção:**
  - Deduz automaticamente os insumos do estoque de matérias-primas.
  - Incrementa o estoque do produto acabado.
  - Registra data/hora da baixa, tempo real gasto e assinatura do Responsável Técnico.

### 4. Relatórios e Documentos Oficiais
- **Emissão e Impressão de OPs:** layout formal no padrão A4 com cabeçalho da empresa, dados técnicos, lista de conferência para almoxarifado, roteiro com tempos e campo para anotações e assinatura.
- **Relatórios de Desempenho:** tempos planejados vs realizados, taxa de eficiência e balanço de consumo de matéria-prima.

### 5. Identificação do Responsável Técnico
- Exibição do nome e registro profissional (CREA/CRQ) do Responsável Técnico em todos os documentos, relatórios e telas de homologação.
- Editável a qualquer momento na aba de Configurações.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React (Ícones).
- **Backend:** Node.js, Express, tsx.
- **Banco de Dados & Persistência:** Banco de dados JSON persistente com atomic file writes (`/data/erp_database.json`) e sincronização resiliente via REST API (`/api/*`).

---

## 💻 Instruções de Execução Local

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm (gerenciador de pacotes)

### Passo a Passo

1. **Instalar as dependências:**
   ```bash
   npm install
   ```

2. **Executar a aplicação em desenvolvimento:**
   ```bash
   npm run dev
   ```
   O servidor iniciará tanto a API Express quanto o frontend em:
   `http://localhost:3000`

3. **Banco de Dados:**
   - Na primeira execução, o sistema cria automaticamente a pasta `/data` e o arquivo `/data/erp_database.json` com dados de demonstração realistas.
   - Não requer instalação de servidores de banco externos (MySQL/Postgres adicionais não são obrigatórios para rodar).
   - Você pode realizar backup (download em JSON) e restauração diretamente pela interface em "Configurações".

4. **Gerar build de produção:**
   ```bash
   npm run build
   npm start
   ```
