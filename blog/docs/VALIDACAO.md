# Validação — 13/11/2026

## Verificações executadas

- TypeScript: `npm run check`.
- Build Vite: `npm run build`, com bundles separados para blog e painel. O editor gera aviso de tamanho de bundle; não impede o build.
- Migration D1 local: `wrangler d1 migrations apply DB --local`, executada no runtime Wrangler local; reaplicação identificou corretamente que não há migrations pendentes.
- Testes: `npm test`: **22 passaram em 3 arquivos**, unitários e integração com SQLite real em memória e o handler do Worker; comportamento DOM com jsdom.
- Worker: `wrangler deploy --dry-run --env production --outdir .wrangler/dry-run`: empacotamento concluído; o comando encerrou em dry-run, sem envio nem publicação.
- Dependências: instalação reportou zero vulnerabilidades no audit automático npm na data da validação.

## Cobertura automatizada

Criação, edição, rascunho, publicação, agendamento e exclusão; revisões e retenção; formatação e blocos em JSON; cópia integral com quebras e espaços por Clipboard API simulada; interpretação e rejeição de links Drive; substituição de imagem indisponível; SEO no HTML inicial, JSON-LD, sitemap, RSS e robots; redirects de slugs sem expor rascunhos; acesso administrativo negado sem sessão; JWT forjado; CSRF por origem; validação de conteúdo e configurações; persistência de referências de mídia; anúncios condicionados ao consentimento.

## Conferência no navegador

Executada no servidor local Wrangler, sem deploy:

1. Home abriu com cabeçalho, hero, categorias, busca e estado vazio sem estatísticas ou artigos inventados.
2. Conferência de tela pequena: largura útil 375 px, largura total do documento 375 px; sem overflow horizontal na home e no artigo.
3. Login local por token abriu o dashboard; criado um artigo de validação pela UI, adicionado bloco de prompt, salvo como rascunho e publicado **apenas no banco local de teste**.
4. Artigo público exibiu título e prompt com três linhas e indentação. Botão copiar mostrou “Prompt copiado!”. A leitura do clipboard pelo conector de navegador retornou vazia, portanto a integridade do clipboard real não foi confirmada por esse conector; o teste DOM verifica o argumento exato enviado a `navigator.clipboard.writeText`.
5. Capturas em `docs/screenshots/`. O banco de teste e o token local utilizados nessa conferência não são incluídos na entrega. A instalação nova começa sem artigos de teste.

Foi identificado e corrigido um loop de redirecionamento do asset `admin.html`, configurando `html_handling: none` no Wrangler. A resposta autenticada de `/admin` foi depois confirmada como HTTP 200 e o editor foi usado no navegador.

## Limites de verificação

Cloudflare Access real, domínio de produção, AdSense/CMP e disponibilidade de uma imagem pública real do Drive dependem de contas e configurações do responsável; não foram validados em produção. A validação JWT usa a biblioteca JOSE e os testes rejeitam token forjado, mas não simula toda a infraestrutura Access. Não foi executado Lighthouse nem auditoria formal WCAG. As capturas não são garantia de compatibilidade com todos os dispositivos.

As páginas legais devem ser preenchidas e revisadas antes de publicação. A marca textual aguarda o logotipo aprovado. Veja todos os limites no README.
