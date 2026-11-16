# Implantação Cloudflare — conta exclusiva

Nenhum deploy foi feito. Execute a publicação somente com autorização do responsável.

## Conta nova e gratuidade

1. Crie manualmente uma conta Cloudflare exclusiva do InfoNaVidaReal com um e-mail controlado pelo responsável, confirme o e-mail e habilite MFA.
2. Permaneça em Workers Free, D1 Free e Cloudflare Zero Trust Free. Não contrate Workers Paid, R2, produtos de imagens ou complementos. Se o fluxo solicitar cartão/plano pago, interrompa e confira a seleção do produto gratuito.
3. A conta gratuita permite começar com `workers.dev`, sem comprar domínio. Um domínio próprio é opcional e pode ter custo de registro fora do Cloudflare.
4. Revise os limites oficiais na data de implantação: [Workers](https://developers.cloudflare.com/workers/platform/limits/), [Assets](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/), [D1](https://developers.cloudflare.com/d1/platform/pricing/), [Zero Trust](https://www.cloudflare.com/plans/zero-trust-services/). Valores consultados em 13/11/2026: Workers Free 100 mil chamadas/dia; D1 Free 5 milhões de linhas lidas/dia, 100 mil escritas/dia, 5 GB totais. O tráfego SSR usa a franquia Workers; assets estáticos seguem regras próprias. Access Free é voltado a equipes pequenas; confira a franquia de usuários atual na contratação. Não há cobrança automática de excedente enquanto a conta permanece nos planos gratuitos; limites podem impedir atendimento. Monitore o painel.

## D1 e variáveis

```powershell
npm ci
npx wrangler login
npx wrangler d1 create infonavidareal
```

Copie o `database_id` retornado para o binding `DB` de `env.production` em `wrangler.jsonc`. Não altere o ID local se quiser manter o banco de desenvolvimento separado. Configure em `env.production.vars`:

- `SITE_URL`: origem HTTPS final, sem barra final.
- `ACCESS_TEAM_DOMAIN`: `sua-equipe.cloudflareaccess.com` (somente host, sem protocolo).
- `ACCESS_AUD`: audiência da aplicação Access.
- `REVISION_LIMIT`: entre 1 e 50, padrão 20.

Nunca defina `LOCAL_DEV_TOKEN` em produção. Variáveis públicas acima não são credenciais. Segredos futuros devem usar `wrangler secret put`, nunca arquivos versionados.

## Access antes de expor o painel

1. No Zero Trust Free, escolha o nome da equipe.
2. Configure um provedor de identidade ou One-time PIN por e-mail.
3. Crie aplicações Access do tipo self-hosted para o hostname e caminhos `/admin*` e `/api/admin/*` (conforme o formulário atual, podem ser entradas de uma mesma aplicação ou aplicações distintas). Use a mesma audiência configurada no Worker; se forem aplicações distintas com audiências diferentes, adapte explicitamente a validação antes de publicar.
4. Crie política Allow restrita aos e-mails exatos dos editores. Não use Everyone ou Bypass. Copie o AUD e confira o domínio da equipe.
5. Certifique-se de que o gateway injeta `Cf-Access-Jwt-Assertion`. O backend também valida o token; só o gateway não basta. Consulte [validação oficial](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/).
6. Domínio próprio facilita aplicações self-hosted por caminho. Se usar `workers.dev`, configure proteção Access compatível no painel Workers e valide a experiência de login. Proteção do hostname inteiro pode exigir login também no blog; não adote isso como configuração final para um portal público. Use domínio próprio se a configuração de caminhos do seu hostname gratuito não estiver disponível.
7. Teste: visitante anônimo lê blog; `/admin` e `/api/admin/posts` exigem login; token forjado, audiência errada, expirado ou emissor errado recebe 401. Se Access estiver ausente, o CMS falha fechado.

## Migrations e publicação autorizada

```powershell
npm run check
npm test
npm run build
npx wrangler d1 migrations apply DB --remote --env production
npx wrangler deploy --env production
```

O script `npm run deploy` também valida, compila e usa explicitamente o ambiente `production`. A migration remota não faz parte do deploy automático. Nenhum desses comandos de publicação foi executado na entrega local.

## Domínio e revisão final

Adicione o domínio à conta se já o possuir, ajuste DNS conforme o painel e use Workers → Domains & Routes para um Custom Domain. Atualize SITE_URL e publique a configuração. Evite múltiplos hostnames públicos concorrentes; redirecione os aliases na Cloudflare. Confira HTTPS, canonical, sitemap e RSS na origem final.

Antes de liberar: substitua a marca, revise contato, publique páginas legais reais, crie um artigo com prompt/imagem/tabela e valide mobile, cópia e compartilhamento. Confirme acesso anônimo bloqueado em todas as rotas administrativas. Faça backup antes de novas migrations.

## AdSense

Solicite aprovação diretamente ao Google, publique conteúdo original e políticas adequadas. Cadastre publisher e slots em Configurações. Habilite apenas as posições desejadas. Slots vazios não aparecem. Uma faixa reservada evita saltos bruscos. Integre CMP certificada quando exigida; o botão básico de consentimento não comprova conformidade. Teste rejeição e revogação sem requests publicitários. Anúncios podem exigir ajustes futuros de CSP conforme os domínios oficialmente usados pelo fornecedor. Não habilite permissões de script globais.
