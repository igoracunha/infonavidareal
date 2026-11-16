# PROMPT PARA CODEX — CMS INFONAVIDAREAL 2.0

## 1. Papel e objetivo

Atue como engenheiro de software sênior, arquiteto de soluções Cloudflare, desenvolvedor full-stack e especialista em UX/UI, SEO e segurança de aplicações web.

Sua tarefa é **desenvolver um CMS próprio, completo, leve e responsivo para o InfoNaVidaReal 2.0**, uma plataforma brasileira dedicada a soluções práticas com inteligência artificial e tecnologia acessível ao público geral.

O projeto deverá incluir:

1. Blog público.
2. Painel administrativo privado.
3. Editor visual avançado semelhante ao WordPress.
4. Gerenciamento de artigos, categorias e páginas.
5. Blocos especiais para prompts e tutoriais.
6. Interpretador de links do Google Drive para imagens.
7. Recursos de SEO.
8. Integração configurável com Google AdSense.
9. Infraestrutura Cloudflare.
10. Documentação completa de implantação.

**Restrição obrigatória: toda a infraestrutura inicial deverá funcionar utilizando exclusivamente serviços e franquias gratuitas.**

Não utilizar serviços que exijam assinatura paga ou cartão de crédito como condição obrigatória para funcionamento.

Não realizar deploy em produção sem autorização.

---

## 2. Identidade visual

Nome: **InfoNaVidaReal**

Versão da marca: 2.0

Slogan: **Tecnologia que resolve.**

Posicionamento: soluções práticas com inteligência artificial e tecnologia para facilitar o cotidiano de pessoas comuns.

Utilizar a identidade visual já definida no projeto Info:

- Azul-marinho como cor principal.
- Roxo como cor secundária.
- Ciano para destaques e elementos interativos.
- Tipografia Poppins para títulos.
- Tipografia Inter para textos e interfaces.
- Estilo minimalista, moderno, tecnológico e acessível.
- Layout limpo, com excelente legibilidade.

O logotipo aprovado contém elementos de monitor, cursor, pixels e órbita.

Consultar, quando disponível, o arquivo `InfoNaVidaReal_Identidade_Visual(1).md` e os arquivos visuais correspondentes.

O documento de identidade visual deve prevalecer sobre interpretações genéricas. Não inventar um novo logotipo.

Caso os arquivos não estejam acessíveis no ambiente do Codex, solicitar os arquivos ou preparar a estrutura para inseri-los posteriormente.

### Diretrizes de interface

- Mobile-first.
- Modo claro como padrão.
- Modo escuro opcional.
- Cabeçalho responsivo.
- Navegação simples.
- Excelente acessibilidade.
- Componentes reutilizáveis.
- Animações discretas.
- Layout consistente em todas as páginas.

---

## 3. Stack tecnológica

Utilizar preferencialmente:

| Camada | Tecnologia |
|---|---|
| Frontend | React + TypeScript |
| Build | Vite |
| Estilização | Tailwind CSS |
| Backend | Cloudflare Workers |
| Banco de dados | Cloudflare D1 |
| Arquivos estáticos | Cloudflare Static Assets |
| Editor visual | TipTap, extensões gratuitas |
| Autenticação administrativa | Cloudflare Access |
| Validação | Zod |
| Deploy | Wrangler |
| Controle de versão | Git |

Priorizar arquitetura simples e de fácil manutenção.

Evitar dependências desnecessárias, serviços pagos e soluções excessivamente complexas.

Utilizar versões estáveis e compatíveis entre si.

Consultar a documentação oficial das tecnologias antes de implementar configurações que possam ter mudado.

---

## 4. Estrutura do blog público

Desenvolver as seguintes páginas:

### 4.1 Página inicial

Elementos:

- Cabeçalho com logotipo.
- Menu de navegação.
- Área de destaque.
- Campo de busca.
- Artigos recentes.
- Artigos em destaque.
- Categorias.
- Área de prompts populares.
- Rodapé institucional.

A página deverá apresentar a proposta do InfoNaVidaReal de maneira clara e convidativa.

### 4.2 Página de artigo

Cada artigo deverá conter:

- Título.
- Subtítulo opcional.
- Categoria.
- Data de publicação.
- Data de atualização.
- Autor.
- Imagem de capa opcional.
- Conteúdo completo.
- Sumário automático opcional.
- Blocos especiais.
- Compartilhamento.
- Artigos relacionados.
- Espaços configuráveis para anúncios.

### 4.3 Categorias iniciais

Criar categorias editáveis, incluindo:

- Inteligência Artificial.
- Prompts Prontos.
- Tutoriais.
- Ferramentas Digitais.
- Produtividade.
- Tecnologia no Dia a Dia.

Permitir criar, editar, organizar e desativar categorias.

### 4.4 Outras páginas

Implementar:

- Busca.
- Listagem de artigos.
- Página de categoria.
- Sobre o InfoNaVidaReal.
- Contato.
- Política de Privacidade.
- Política de Cookies.
- Termos de Uso.
- Página 404 personalizada.

As páginas institucionais deverão ter conteúdo inicial editável, sem inventar informações legais ou dados de contato.

---

## 5. Painel administrativo

Criar um painel acessível em `/admin`.

O painel deverá possuir:

### Dashboard

Exibir:

- Total de artigos.
- Artigos publicados.
- Rascunhos.
- Publicações agendadas.
- Categorias cadastradas.
- Últimas publicações.
- Atalhos para criação de conteúdo.

Não apresentar estatísticas fictícias de visitantes ou receita.

### Gerenciamento de artigos

Implementar:

- Criar artigo.
- Editar artigo.
- Duplicar artigo.
- Excluir artigo com confirmação.
- Salvar rascunho.
- Publicar imediatamente.
- Agendar publicação.
- Despublicar.
- Definir artigo em destaque.
- Definir slug personalizado.
- Pesquisar e filtrar artigos.

### Gerenciamento de páginas

Permitir criar e editar páginas institucionais e páginas personalizadas.

### Configurações

Incluir:

- Nome do site.
- Slogan.
- URL principal.
- Logotipo.
- Favicon.
- Dados de contato.
- Redes sociais.
- Configurações de SEO.
- Configurações de anúncios.
- Configurações de aparência.

---

## 6. Editor visual avançado

**Este é um dos componentes mais importantes do projeto.**

O editor deverá oferecer experiência próxima à do WordPress, combinando a facilidade do editor clássico com recursos de blocos semelhantes ao Gutenberg.

Utilizar TipTap e extensões gratuitas compatíveis.

Não utilizar funcionalidades pagas do TipTap.

### 6.1 Interface

O editor deverá conter:

- Campo de título.
- Barra de ferramentas completa.
- Área de edição visual.
- Menu para inserir blocos.
- Painel lateral de propriedades.
- Indicador de salvamento.
- Botões de pré-visualização e publicação.
- Alternância entre visualização desktop e mobile.

A edição deve ser WYSIWYG: o usuário deverá visualizar uma representação fiel da formatação final.

### 6.2 Formatação de texto

Implementar:

- Negrito.
- Itálico.
- Sublinhado.
- Tachado.
- Sobrescrito.
- Subscrito.
- Títulos H1 a H6.
- Parágrafos.
- Cores de texto.
- Destaque de texto.
- Alinhamento à esquerda.
- Centralização.
- Alinhamento à direita.
- Justificação.
- Listas com marcadores.
- Listas numeradas.
- Listas de tarefas.
- Recuo e redução de recuo.
- Citações.
- Linhas divisórias.
- Links.
- Tabelas.
- Blocos de código.
- Imagens.
- Legendas.

Permitir editar propriedades das tabelas, como linhas, colunas e células, conforme as extensões gratuitas disponíveis.

### 6.3 Ferramentas de edição

Implementar:

- Desfazer.
- Refazer.
- Atalhos de teclado.
- Copiar e colar preservando formatação compatível.
- Colar como texto simples.
- Seleção de blocos.
- Movimentação de blocos.
- Contagem de palavras.
- Tempo estimado de leitura.
- Salvamento automático.
- Histórico básico de revisões.

O histórico poderá utilizar snapshots armazenados no D1, com limite configurável para evitar consumo excessivo.

### 6.4 Formatos de edição

Armazenar o conteúdo principal como JSON estruturado do TipTap.

Oferecer:

- Edição visual.
- Visualização HTML.
- Pré-visualização final.

Caso seja implementada edição direta de HTML, sanitizar rigorosamente o conteúdo e impedir scripts ou atributos perigosos.

O conteúdo publicado deve preservar a formatação criada no editor.

---

## 7. Blocos personalizados do InfoNaVidaReal

Criar componentes especiais integrados ao editor.

### 7.1 Bloco de prompt

Campos:

- Título do prompt.
- Descrição.
- Texto completo.
- Instruções de utilização.
- Exemplo preenchido opcional.

No blog público, exibir botão:

**Copiar prompt**

A cópia deverá preservar o texto completo e suas quebras de linha.

Permitir vários blocos de prompt no mesmo artigo.

### 7.2 Bloco de tutorial

Permitir inserir etapas numeradas com:

- Título.
- Descrição.
- Imagem opcional.
- Observações.

### 7.3 Bloco de código

Implementar:

- Destaque de sintaxe.
- Seleção de linguagem.
- Botão copiar.
- Preservação da indentação.

### 7.4 Bloco de aviso

Criar variantes:

- Informação.
- Dica.
- Atenção.
- Importante.

### 7.5 Sumário automático

Gerar sumário a partir dos títulos H2 e H3.

Permitir habilitar ou desabilitar por artigo.

---

## 8. Sistema de imagens via Google Drive

**Não utilizar Cloudflare R2, Cloudinary ou qualquer serviço de armazenamento pago.**

As imagens serão armazenadas manualmente no Google Drive.

O CMS deverá possuir um interpretador de links.

### Funcionamento

O usuário deverá:

1. Enviar a imagem para seu Google Drive.
2. Configurar o compartilhamento público como leitor.
3. Copiar o link.
4. Colar no editor do CMS.
5. Visualizar a imagem no artigo.

### Interpretador

Reconhecer formatos comuns de links do Google Drive, incluindo:

`https://drive.google.com/file/d/FILE_ID/view`

`https://drive.google.com/open?id=FILE_ID`

`https://drive.google.com/uc?id=FILE_ID`

Extrair o identificador do arquivo.

Gerar uma URL de visualização compatível, quando possível.

Permitir adicionar:

- Texto alternativo.
- Legenda.
- Alinhamento.
- Largura.
- Imagem de capa.

### Tratamento de falhas

Não presumir que todo link público do Drive funcionará como imagem incorporada.

Implementar:

- Validação do formato.
- Pré-visualização.
- Detecção de falha de carregamento.
- Imagem substituta.
- Mensagens explicativas.

Não utilizar proxy para contornar restrições de acesso ou limites impostos pelo Google.

Manter o identificador original do arquivo e a URL de origem no banco, facilitando uma migração futura.

### Downloads

Permitir adicionar links para arquivos públicos do Google Drive.

Diferenciar visualização de imagem e download de arquivo.

---

## 9. SEO

Implementar SEO técnico e editorial.

### Por artigo

- SEO title.
- Meta description.
- Slug.
- Canonical URL.
- Open Graph.
- Twitter Cards.
- Imagem social.
- Dados estruturados Article.
- Data de publicação.
- Data de modificação.

### Recursos globais

- Sitemap XML dinâmico.
- Robots.txt.
- RSS.
- URLs amigáveis.
- Breadcrumbs.
- Dados estruturados apropriados.
- Redirecionamento de slugs antigos.
- Tratamento correto de páginas inexistentes.
- Noindex para páginas administrativas.
- HTML indexável pelos mecanismos de busca.

**Requisito importante:** o conteúdo principal dos artigos deverá estar presente no HTML entregue ao visitante, por SSR ou geração estática compatível com Cloudflare.

Não depender exclusivamente de renderização client-side para o conteúdo indexável.

O painel deverá indicar ausência de título SEO, descrição e texto alternativo das imagens.

---

## 10. Google AdSense

Criar sistema configurável de anúncios.

### Configurações

Permitir informar:

- Publisher ID.
- Ativação global.
- IDs dos blocos.
- Posições habilitadas.

### Posições previstas

- Página inicial.
- Listagem de artigos.
- Início do artigo.
- Meio do artigo.
- Final do artigo.
- Sidebar em telas grandes.

Não inserir anúncios automaticamente dentro de blocos de prompt, código ou elementos interativos.

O site deverá funcionar normalmente sem AdSense configurado.

Evitar anúncios invasivos e deslocamentos excessivos de layout.

Incluir estrutura para consentimento de cookies quando exigido pela legislação e pelas políticas aplicáveis.

Não afirmar que a integração garante aprovação ou receita.

---

## 11. Banco de dados Cloudflare D1

Criar migrations versionadas.

Estruturas sugeridas:

### posts

- id
- title
- subtitle
- slug
- excerpt
- content_json
- content_html
- status
- category_id
- cover_image_id
- author_id
- featured
- seo_title
- seo_description
- published_at
- scheduled_at
- created_at
- updated_at

### categories

- id
- name
- slug
- description
- active

### pages

- id
- title
- slug
- content_json
- content_html
- status
- seo_title
- seo_description
- created_at
- updated_at

### media

- id
- provider
- original_url
- file_id
- display_url
- alt_text
- caption
- created_at

### revisions

- id
- content_type
- content_id
- content_json
- created_at

### settings

- key
- value

### redirects

- id
- old_path
- new_path
- created_at

Adaptar a modelagem quando necessário, preservando integridade referencial, índices e consistência.

Não armazenar imagens binárias no D1.

Utilizar consultas parametrizadas.

---

## 12. Segurança

O painel administrativo deverá ser protegido pelo Cloudflare Access.

Requisitos:

- Validar autenticação no backend.
- Verificar os tokens de identidade emitidos pelo Access.
- Validar assinatura, emissor, audiência e expiração.
- Proteger todas as rotas administrativas e APIs de escrita.
- Não confiar apenas em verificações no frontend.
- Não expor tokens ou segredos.
- Sanitizar conteúdo renderizado.
- Validar dados de entrada.
- Proteger contra XSS e CSRF.
- Utilizar cabeçalhos de segurança adequados.
- Implementar mensagens de erro sem expor informações internas.

Se o Cloudflare Access exigir configuração manual, documentar os passos.

A aplicação deve funcionar localmente em modo de desenvolvimento sem comprometer a segurança da produção.

---

## 13. Desempenho e acessibilidade

Priorizar:

- Core Web Vitals.
- Carregamento rápido.
- HTML semântico.
- Imagens com lazy loading.
- Dimensões explícitas das imagens.
- Fontes otimizadas.
- Cache apropriado.
- Paginação.
- Consultas eficientes ao D1.
- Navegação por teclado.
- Contraste adequado.
- Labels acessíveis.
- Responsividade completa.

Não utilizar bibliotecas pesadas sem necessidade.

---

## 14. Organização do projeto

Criar estrutura de diretórios clara, separando:

- Aplicação pública.
- Painel administrativo.
- Componentes compartilhados.
- Editor.
- Blocos personalizados.
- API.
- Banco de dados.
- Autenticação.
- Utilitários.
- Estilos.
- Configurações.
- Testes.
- Documentação.

Preparar arquivos de configuração do Wrangler.

Utilizar variáveis de ambiente e bindings apropriados.

Não incluir credenciais reais no repositório.

---

## 15. Testes obrigatórios

Criar testes para:

1. Criação e edição de artigos.
2. Salvamento de rascunhos.
3. Publicação.
4. Agendamento.
5. Exclusão.
6. Formatação de texto.
7. Persistência dos blocos personalizados.
8. Cópia de prompts.
9. Interpretação dos links do Google Drive.
10. Falhas de carregamento de imagens.
11. SEO.
12. Sitemap.
13. Autenticação administrativa.
14. Validação das APIs.
15. Responsividade.

Executar os testes disponíveis e corrigir erros identificados.

Não declarar testes como concluídos sem executá-los.

---

## 16. Documentação e implantação

Entregar:

- README.md.
- Instruções de instalação.
- Comandos de desenvolvimento.
- Comandos de build.
- Configuração do D1.
- Execução de migrations.
- Configuração do Cloudflare Access.
- Configuração do domínio.
- Configuração do Google AdSense.
- Procedimento de deploy.
- Procedimento de backup.
- Procedimento de restauração.
- Orientações de atualização.

Criar `.env.example` ou equivalente, sem credenciais reais.

Incluir um guia específico para a criação de uma nova conta Cloudflare destinada exclusivamente ao InfoNaVidaReal.

Explicar quais recursos são gratuitos, quais possuem limites e quais podem exigir atenção futura.

---

## 17. Etapas de desenvolvimento

Executar na seguinte ordem:

**Etapa 1 — Fundação**

- Inicializar o projeto.
- Configurar React, TypeScript e Cloudflare.
- Implementar identidade visual.
- Criar estrutura de componentes.
- Configurar D1.

**Etapa 2 — Blog público**

- Criar layout.
- Implementar listagem.
- Implementar artigos.
- Implementar categorias.
- Implementar busca.
- Criar páginas institucionais.

**Etapa 3 — CMS**

- Implementar autenticação.
- Criar dashboard.
- Implementar CRUD de artigos.
- Implementar gerenciamento de categorias e páginas.

**Etapa 4 — Editor avançado**

- Integrar TipTap.
- Implementar barra de ferramentas.
- Criar blocos personalizados.
- Implementar salvamento automático.
- Implementar pré-visualização.

**Etapa 5 — Imagens**

- Criar interpretador de links.
- Integrar ao editor.
- Implementar validação e tratamento de falhas.

**Etapa 6 — SEO e monetização**

- Implementar SEO.
- Criar sitemap e RSS.
- Integrar configurações do AdSense.
- Criar páginas legais editáveis.

**Etapa 7 — Qualidade**

- Executar testes.
- Corrigir erros.
- Revisar segurança.
- Otimizar desempenho.
- Finalizar documentação.

---

## 18. Critérios de aceitação

O projeto estará pronto para implantação quando:

- O blog público funcionar corretamente.
- O painel administrativo estiver protegido.
- Artigos puderem ser criados e publicados.
- A formatação avançada for preservada.
- Os blocos de prompt funcionarem.
- O botão copiar funcionar.
- Os links públicos do Google Drive forem interpretados e tiverem tratamento adequado de falhas.
- O conteúdo for indexável.
- O sitemap funcionar.
- O AdSense puder ser configurado sem alterar código.
- O layout estiver responsivo.
- Os testes essenciais passarem.
- A documentação estiver completa.
- Nenhum serviço pago for obrigatório.

---

## 19. Instruções finais

Antes de começar, examine o repositório existente.

Se estiver vazio, inicialize o projeto.

Se já houver código, preserve a estrutura aproveitável e evite alterações destrutivas.

Trabalhe de forma incremental e organizada.

Tome decisões técnicas fundamentadas, sem pedir confirmação para detalhes triviais.

Quando houver alternativas, priorize:

1. Gratuidade.
2. Segurança.
3. Simplicidade.
4. Facilidade de manutenção.
5. Desempenho.
6. Possibilidade de expansão.

Não implementar recursos pagos por padrão.

Não realizar deploy em produção sem autorização.

Ao terminar, apresente:

- Resumo do que foi implementado.
- Estrutura do projeto.
- Tecnologias utilizadas.
- Testes executados e resultados.
- Pendências conhecidas.
- Instruções para execução local.
- Passos necessários para publicação na Cloudflare.

**Objetivo final: entregar um CMS próprio, gratuito, moderno e fácil de utilizar, capaz de transformar o InfoNaVidaReal em um portal de conteúdo tecnológico, com experiência editorial próxima ao WordPress, mas sem a complexidade de sua infraestrutura.**