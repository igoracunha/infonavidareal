import { localLogin } from "./local";
import { ZodError } from "zod";
import { authenticate, checkCsrf, type Env } from "./auth";
import { api } from "./api";
import { publicSite } from "./public";
export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    let response: Response;
    try {
      const local = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
      if (url.pathname === "/entrar" && local) {
        response = localLogin();
      } else if (
        url.pathname === "/api/local-login" &&
        request.method === "POST"
      ) {
        checkCsrf(request);
        const { token } = (await request.json()) as any;
        if (!local || !env.LOCAL_DEV_TOKEN || token !== env.LOCAL_DEV_TOKEN)
          throw new Response("Acesso negado", { status: 401 });
        response = Response.json(
          { ok: true },
          {
            headers: {
              "Set-Cookie": `local_session=${env.LOCAL_DEV_TOKEN}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`,
            },
          },
        );
      } else if (
        url.pathname.startsWith("/admin") ||
        url.pathname.startsWith("/api/")
      ) {
        checkCsrf(request);
        await authenticate(request, env);
        if (url.pathname.startsWith("/api/admin/"))
          response = await api(request, env);
        else if (
          url.pathname === "/admin" ||
          url.pathname.startsWith("/admin/")
        )
          response = await env.ASSETS.fetch(
            new Request(new URL("/admin.html", url), request),
          );
        else response = new Response("Não encontrado", { status: 404 });
        response = new Response(response.body, response);
        response.headers.set("X-Robots-Tag", "noindex, nofollow");
        response.headers.set("Cache-Control", "no-store");
      } else if (url.pathname.startsWith("/assets/")) {
        response = await env.ASSETS.fetch(request);
      } else if (
        url.pathname === "/admin.html" ||
        url.pathname === "/public.html"
      ) {
        response = new Response("Não encontrado", { status: 404 });
      } else response = await publicSite(request, env);
    } catch (error) {
      if (error instanceof Response) response = error;
      else if (error instanceof ZodError)
        response = Response.json(
          {
            error: "Verifique os campos.",
            details: error.issues.map(
              (i) => `${i.path.join(".")}: ${i.message}`,
            ),
          },
          { status: 400 },
        );
      else {
        console.error(
          "Falha de operação",
          error instanceof Error ? error.name : "Unknown",
        );
        response = Response.json(
          {
            error:
              "Não foi possível concluir. Verifique slugs duplicados, vínculos e configuração do banco.",
          },
          { status: 500 },
        );
      }
    }
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("X-Frame-Options", "DENY");
    headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; connect-src 'self' https://*.googlesyndication.com https://*.doubleclick.net; frame-src https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
    );
    if (url.protocol === "https:")
      headers.set("Strict-Transport-Security", "max-age=31536000");
    return new Response(response.body, { status: response.status, headers });
  },
};
