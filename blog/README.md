# InfoNaVidaReal 2.0 — CMS

Blog com HTML público renderizado no Worker e painel React/TipTap. Sem deploy de produção realizado. O escopo original está em `REQUISITOS.md`.

## Execução local (Node 24+)

```powershell
cd E:\Github\InfoBlog
npm ci
Copy-Item .dev.vars.example .dev.vars
# Edite LOCAL_DEV_TOKEN com um valor longo próprio (não reutilize senhas).
npm run db:local
npm run dev
```

Abra http://localhost:8787 para o blog e http://localhost:8787/entrar para informar o token local e abrir o painel. O token gera cookie HttpOnly, SameSite=Strict, com validade de 8 horas. A entrada local e o bypass não funcionam em hosts de produção. Se o Wrangler não puder gravar logs, defina `$env:WRANGLER_LOG_PATH="$PWD\.wrangler\logs"` antes dos comandos. Não versione `.dev.vars`, backups nem `.wrangler`.

O servidor serve o build; após alterações no frontend, execute `npm run build` e atualize a página. O backend é acompanhado pelo Wrangler. Não é necessário cartão, bucket ou serviço de imagens externo pago.

## Estrutura

```
src/admin/       dashboard, CRUD, mídia e configurações
src/editor/      TipTap e extensões/blocos gratuitos
src/public/      cópia, compartilhamento, temas, imagens e consentimento
src/shared/      schemas Zod, interpretação Drive e renderização segura
src/styles/      identidade e layouts responsivos
worker/          autenticação, APIs D1 e HTML público
migrations/      schema, índices e conteúdo institucional inicial
tests/           testes unitários e integração SQL/Worker
docs/            implantação, operação e validação
```

## Recursos

- Blog, busca com paginação, categorias, destaque, páginas e 404; artigos no HTML inicial, metadados sociais, Article JSON-LD, sumário, sitemap e RSS.
- Painel com números reais de conteúdo, criação/edição/duplicação/exclusão, rascunhos, publicação, agendamento, categorias ordenáveis/desativáveis e configurações.
- TipTap: texto, cores, alinhamento, listas e tarefas, links, tabelas editáveis, imagens, código com linguagem, histórico de desfazer, HTML somente leitura e prévia desktop/mobile.
- Blocos de prompt, aviso e tutorial persistidos em JSON; propriedades editáveis ao selecionar o bloco. Prompts e códigos têm cópia no blog público. Tutoriais têm campos por etapa, inclusão, remoção e reordenação.
- Autosave de rascunhos a cada 15 s após título e slug. Artigos publicados exigem salvamento explícito. Revisões guardam snapshots de conteúdo anteriores, limitadas por `REVISION_LIMIT` (1–50), com restauração pelo editor.
- Drive: validação de host/ID, referência original preservada, prévia, texto alternativo e mensagem de falha. Nenhum proxy ou binário no D1.
- Access no backend: assinatura RS256/JWKS, emissor, audiência, expiração e claims obrigatórios. Validação Zod, origem em mutações, consultas parametrizadas e renderer com lista de elementos/atributos permitidos.
- AdSense configurável por posição, desativado por padrão. Consentimento local básico; veja limitações abaixo.

## Validação

```powershell
npm run check
npm test
npm run build
```

Resultados e limites em [docs/VALIDACAO.md](docs/VALIDACAO.md). Testes de integração usam SQLite real em memória via `node:sqlite` e o handler do Worker, além da migration local executada pelo Wrangler.

## Antes de publicar

Leia [docs/IMPLANTACAO.md](docs/IMPLANTACAO.md) e [docs/OPERACAO.md](docs/OPERACAO.md). A publicação requer autorização explícita. Configure D1, domínio/base URL e Access tanto no gateway quanto no Worker. O UUID zero é apenas placeholder local.

## Pendências e limites conhecidos

- O documento de identidade visual e o logotipo aprovado não foram fornecidos. As cores seguem o briefing (marinho/roxo/ciano); a marca aparece apenas como texto até inserir a URL aprovada em Configurações. Não foi desenhado novo logotipo. Poppins e Inter são carregadas do Google Fonts com fallback local; avalie hospedagem local para privacidade e desempenho.
- Privacidade, Cookies e Termos começam como rascunhos preparatórios. Complete-os com fatos reais, revise e publique. Não há formulário de contato nem entrega de e-mails; a página de contato pode ser editada.
- Consentimento básico não é CMP certificada. Integre uma CMP exigida pelo Google para as regiões aplicáveis antes de monetizar. AdSense requer aprovação externa e não garante receita. A posição “meio” está ao final do corpo para evitar inserção no interior de blocos.
- Listas administrativas têm limite de 100 resultados com busca/filtro. Sitemap inicial limitado a 1.000 artigos; divida em índices antes de ultrapassar isso. Agendamentos tornam-se públicos pela condição temporal na leitura, sem cron; o status editorial permanece `scheduled` no painel.
- Histórico guarda conteúdo JSON, não uma trilha completa de metadados/usuários. Autosave de conteúdo publicado não é feito para evitar publicação involuntária de alterações.
- Não há colaboração simultânea ou bloqueio otimista: use um editor por conteúdo para evitar sobrescrita. Sem upload binário, comentários públicos, métricas de tráfego ou serviços pagos.
- A validade e disponibilidade das imagens do Drive dependem do Google e do compartilhamento. A página pública fornece fallback, sem contornar permissões.
- Bundle editorial é maior por incluir o editor; o blog carrega um bundle independente. Não há garantia de pontuação Lighthouse sem avaliação no domínio real.

Bibliotecas efetivamente resolvidas estão fixadas em `package-lock.json`. Atualizações devem repetir os testes e build.
