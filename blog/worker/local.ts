export function localLogin() {
  return new Response(
    `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Entrar no CMS local</title><link rel="stylesheet" href="/assets/public.css"></head><body><main class="article institutional"><h1>Seu espaço editorial.</h1><p>Informe o LOCAL_DEV_TOKEN definido em .dev.vars. Esta entrada só funciona em localhost.</p><form data-local-login><label>Token local<input type="password" name="token" required autocomplete="current-password"></label><button>Entrar no painel</button></form></main><div class="toast" role="status"></div><script type="module" src="/assets/public.js"></script></body></html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}
