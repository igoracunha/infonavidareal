import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { beforeEach, describe, it, expect } from "vitest";
import worker from "../worker/index";
import type { Env } from "../worker/auth";
let env: Env;
beforeEach(() => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync("migrations/0001_initial.sql", "utf8"));
  function statement(sql: string, values: any[] = []): any {
    return {
      bind: (...v: any[]) => statement(sql, v),
      first: async () => sqlite.prepare(sql).get(...values) ?? null,
      all: async () => ({ results: sqlite.prepare(sql).all(...values) }),
      run: async () => sqlite.prepare(sql).run(...values),
    };
  }
  env = {
    DB: {
      prepare: statement,
      batch: async (statements: any[]) => {
        sqlite.exec("BEGIN");
        try {
          const values = [];
          for (const s of statements) values.push(await s.run());
          sqlite.exec("COMMIT");
          return values;
        } catch (e) {
          sqlite.exec("ROLLBACK");
          throw e;
        }
      },
    } as any,
    ASSETS: { fetch: async () => new Response("<div>admin</div>") } as any,
    SITE_URL: "http://localhost:8787",
    LOCAL_DEV_TOKEN: "local-test",
    ACCESS_AUD: "",
    ACCESS_TEAM_DOMAIN: "",
    REVISION_LIMIT: "2",
  };
});
async function request(
  path: string,
  method = "GET",
  body?: any,
  authorized = true,
) {
  return worker.fetch(
    new Request("http://localhost:8787" + path, {
      method,
      headers: {
        ...(authorized ? { Cookie: "local_session=local-test" } : {}),
        Origin: "http://localhost:8787",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
    env,
  );
}
const input = (extra: any = {}) => ({
  title: "Um teste útil",
  slug: "teste-util",
  content_json: {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Como funciona" }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Conteúdo indexável no HTML" }],
      },
      {
        type: "promptBlock",
        attrs: { title: "Prompt", text: "Primeira linha\nSegunda linha" },
      },
    ],
  },
  status: "draft",
  ...extra,
});
describe("CMS com SQL real e Worker", () => {
  it("cria rascunho, edita, publica, preserva revisões e exclui", async () => {
    const create = await request("/api/admin/posts", "POST", input());
    expect(create.status).toBe(201);
    const { id } = (await create.json()) as any;
    expect((await request("/artigo/teste-util")).status).toBe(404);
    const edit = await request(
      "/api/admin/posts/" + id,
      "PUT",
      input({
        title: "Novo título",
        status: "published",
        seo_title: "SEO personalizado",
        seo_description: "Descrição de busca",
      }),
    );
    expect(edit.status).toBe(200);
    const publicResponse = await request("/artigo/teste-util");
    const html = await publicResponse.text();
    expect(html).toContain("Conteúdo indexável no HTML");
    expect(html).toContain("<title>SEO personalizado</title>");
    expect(html).toContain("application/ld+json");
    expect(html).toContain('name="description" content="Descrição de busca"');
    expect(html).toContain("Primeira linha\nSegunda linha");
    expect(html).toContain('id="secao-1"');
    expect(
      await (await request("/api/admin/posts/" + id + "/revisions")).json(),
    ).toHaveLength(1);
    expect((await request("/api/admin/posts/" + id, "DELETE")).status).toBe(
      200,
    );
    expect((await request("/artigo/teste-util")).status).toBe(404);
  });
  it("agenda sem revelar antes da hora e publica na data", async () => {
    const scheduled_at = new Date(Date.now() + 3600000).toISOString();
    expect(
      (
        await request(
          "/api/admin/posts",
          "POST",
          input({ status: "scheduled", scheduled_at }),
        )
      ).status,
    ).toBe(201);
    expect((await request("/artigo/teste-util")).status).toBe(404);
    await env.DB.prepare(
      "UPDATE posts SET scheduled_at='2020-01-01T00:00:00.000Z'",
    ).run();
    expect((await request("/artigo/teste-util")).status).toBe(200);
  });
  it("sitemap e RSS incluem publicados e excluem rascunhos", async () => {
    await request("/api/admin/posts", "POST", input({ status: "published" }));
    await request("/api/admin/posts", "POST", input({ slug: "segredo" }));
    const sitemap = await (await request("/sitemap.xml")).text();
    expect(sitemap).toContain("/artigo/teste-util");
    expect(sitemap).not.toContain("/artigo/segredo");
    expect(sitemap).not.toContain("/privacidade");
    expect(await (await request("/rss.xml")).text()).toContain("Um teste útil");
    expect(await (await request("/robots.txt")).text()).toContain(
      "Disallow: /admin",
    );
  });
  it("protege admin, API e arquivo HTML, valida entrada", async () => {
    expect((await request("/admin", "GET", undefined, false)).status).toBe(401);
    expect(
      (await request("/api/admin/posts", "GET", undefined, false)).status,
    ).toBe(401);
    expect(
      (await request("/api/admin/posts", "POST", { title: "" })).status,
    ).toBe(400);
    expect((await request("/admin.html")).status).toBe(404);
    expect((await request("/admin")).headers.get("X-Robots-Tag")).toContain(
      "noindex",
    );
    expect(
      (await request("/")).headers.get("Content-Security-Policy"),
    ).toContain("object-src 'none'");
  });
  it("redireciona slug antigo e não revela rascunhos por redirecionamento", async () => {
    const { id } = (await (
      await request("/api/admin/posts", "POST", input({ status: "published" }))
    ).json()) as any;
    await request(
      "/api/admin/posts/" + id,
      "PUT",
      input({ slug: "novo-slug", status: "published" }),
    );
    expect((await request("/artigo/teste-util")).status).toBe(301);
    await request(
      "/api/admin/posts/" + id,
      "PUT",
      input({ slug: "novo-slug", status: "draft" }),
    );
    expect((await request("/artigo/teste-util")).status).toBe(404);
  });
  it("limita histórico e persiste blocos em páginas", async () => {
    const { id } = (await (
      await request("/api/admin/pages", "POST", input())
    ).json()) as any;
    for (let i = 0; i < 4; i++)
      await request(
        "/api/admin/pages/" + id,
        "PUT",
        input({ title: "Revisão " + i }),
      );
    expect(
      await (await request("/api/admin/pages/" + id + "/revisions")).json(),
    ).toHaveLength(2);
    const saved = (await (
      await request("/api/admin/pages/" + id)
    ).json()) as any;
    expect(JSON.parse(saved.content_json).content[2].attrs.text).toBe(
      "Primeira linha\nSegunda linha",
    );
  });
  it("adiciona mídia preservando origem e ID, salva configurações", async () => {
    const media = (await (
      await request("/api/admin/media", "POST", {
        url: "https://drive.google.com/file/d/abcdefghijk_123/view",
        alt_text: "Descrição",
      })
    ).json()) as any;
    expect(media.file_id).toBe("abcdefghijk_123");
    const settings = (await (
      await request("/api/admin/settings")
    ).json()) as any;
    settings.publisher = "ca-pub-1234567890123456";
    settings.adsEnabled = true;
    settings.slots = { home: "123456" };
    expect((await request("/api/admin/settings", "PUT", settings)).status).toBe(
      200,
    );
    const html = await (await request("/")).text();
    expect(html).toContain('data-ad-slot="123456"');
    expect(html).not.toContain('<script src="https://pagead2');
    expect(
      (
        await request("/api/admin/settings", "PUT", {
          ...settings,
          publisher: "<script>",
        })
      ).status,
    ).toBe(400);
  });
});
