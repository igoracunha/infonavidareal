import { createRemoteJWKSet, jwtVerify } from "jose";
export type Env = {
  DB: D1Database;
  ASSETS: Fetcher;
  SITE_URL: string;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
  LOCAL_DEV_TOKEN?: string;
  REVISION_LIMIT?: string;
};
const keys = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
export async function authenticate(request: Request, env: Env) {
  const url = new URL(request.url);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    local &&
    env.LOCAL_DEV_TOKEN &&
    request.headers
      .get("cookie")
      ?.split(";")
      .some((c) => c.trim() === `local_session=${env.LOCAL_DEV_TOKEN}`)
  )
    return { email: "editor@localhost" };
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD)
    throw new Response("Configure o Cloudflare Access para acessar o painel.", {
      status: 401,
    });
  if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.ACCESS_TEAM_DOMAIN))
    throw new Response("Configuração de autenticação inválida.", {
      status: 503,
    });
  const issuer = `https://${env.ACCESS_TEAM_DOMAIN}`;
  if (!keys.has(issuer))
    keys.set(
      issuer,
      createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`)),
    );
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) throw new Response("Autenticação necessária.", { status: 401 });
  try {
    const { payload } = await jwtVerify(token, keys.get(issuer)!, {
      issuer,
      audience: env.ACCESS_AUD,
      algorithms: ["RS256"],
      requiredClaims: ["exp", "iat", "sub"],
    });
    return payload;
  } catch {
    throw new Response("Sessão inválida ou expirada.", { status: 401 });
  }
}
export function checkCsrf(request: Request) {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    if (request.headers.get("origin") !== new URL(request.url).origin)
      throw new Response("Origem não autorizada.", { status: 403 });
    if (
      request.method !== "DELETE" &&
      !request.headers.get("content-type")?.startsWith("application/json")
    )
      throw new Response("Envie JSON.", { status: 415 });
  }
}
