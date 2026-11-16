import { describe, it, expect, vi } from "vitest";
import {
  contentSchema,
  driveImage,
  renderDoc,
  headings,
  slugify,
  type DocNode,
} from "../src/shared/content";
import { authenticate, checkCsrf, type Env } from "../worker/auth";
const doc: DocNode = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Um título" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Olá",
          marks: [
            { type: "bold" },
            { type: "italic" },
            { type: "underline" },
            { type: "superscript" },
            { type: "textStyle", attrs: { color: "#7049df" } },
          ],
        },
      ],
    },
    {
      type: "promptBlock",
      attrs: {
        title: "Planeje",
        text: "Linha 1\n  Linha 2\nLinha 3",
        instructions: "Copie",
      },
    },
    {
      type: "tutorialBlock",
      attrs: {
        title: "Tutorial",
        steps: '[{"title":"Passo 1","description":"Faça isso"}]',
      },
    },
    { type: "noticeBlock", attrs: { variant: "warning", text: "Cuidado" } },
  ],
};
describe("Conteúdo e editor", () => {
  it("preserva formatação e blocos estruturados", () => {
    const parsed = JSON.parse(JSON.stringify(doc));
    const html = renderDoc(parsed);
    expect(html).toContain("<strong>Olá</strong>");
    expect(html).toContain("<sup>");
    expect(html).toContain("color:#7049df");
    expect(html).toContain("Linha 1\n  Linha 2\nLinha 3");
    expect(html).toContain("Copiar prompt");
    expect(html).toContain("Passo 1");
    expect(html).toContain("notice-warning");
    expect(headings(doc)).toEqual([
      { id: "secao-1", text: "Um título", level: 2 },
    ]);
  });
  it("não permite HTML ou atributos executáveis", () => {
    const html = renderDoc({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "<script>alert(1)</script>",
              marks: [
                { type: "link", attrs: { href: "javascript:alert(1)" } },
                { type: "textStyle", attrs: { color: "red;position:fixed" } },
              ],
            },
          ],
        },
        {
          type: "image",
          attrs: { src: "javascript:alert(1)", alt: '" onerror="alert(1)' },
        },
        {
          type: "noticeBlock",
          attrs: { text: "<img src=x onerror=alert(1)>" },
        },
      ],
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain('href="javascript');
    expect(html).not.toContain('src="javascript');
    expect(html).not.toContain('style="color:red;');
  });
  it("rejeita agendamento inválido e slug perigoso", () => {
    expect(
      contentSchema.safeParse({
        title: "Olá",
        slug: "ola",
        content_json: doc,
        status: "scheduled",
        scheduled_at: "2020-01-01T00:00:00.000Z",
      }).success,
    ).toBe(false);
    expect(
      contentSchema.safeParse({
        title: "Olá",
        slug: "../admin",
        content_json: doc,
      }).success,
    ).toBe(false);
    expect(slugify("Inteligência Artificial!")).toBe("inteligencia-artificial");
  });
});
describe("Google Drive", () => {
  it.each([
    "https://drive.google.com/file/d/abcdefghijk_123/view",
    "https://drive.google.com/open?id=abcdefghijk_123",
    "https://drive.google.com/uc?id=abcdefghijk_123",
  ])("interpreta %s", (url) => {
    expect(driveImage(url)).toMatchObject({
      file_id: "abcdefghijk_123",
      original_url: url,
      display_url:
        "https://drive.google.com/thumbnail?id=abcdefghijk_123&sz=w1600",
    });
  });
  it.each([
    "https://evil.test/open?id=abcdefghijk",
    "https://drive.google.com.evil.test/file/d/abcdefghijk/view",
    "http://drive.google.com/open?id=abcdefghijk",
    "https://drive.google.com/open?id=bad",
  ])("rejeita %s", (url) => expect(() => driveImage(url)).toThrow());
});
describe("Autenticação e CSRF", () => {
  it("nega acesso sem configuração e ignora bypass local em produção", async () => {
    const env = { LOCAL_DEV_TOKEN: "secret" } as Env;
    await expect(
      authenticate(
        new Request("https://portal.test/admin", {
          headers: { Cookie: "local_session=secret" },
        }),
        env,
      ),
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      authenticate(
        new Request("http://localhost/admin", {
          headers: { Cookie: "local_session=secret" },
        }),
        env,
      ),
    ).resolves.toMatchObject({ email: "editor@localhost" });
  });
  it("rejeita JWT forjado", async () => {
    await expect(
      authenticate(
        new Request("https://portal.test/admin", {
          headers: { "Cf-Access-Jwt-Assertion": "fake" },
        }),
        {
          ACCESS_TEAM_DOMAIN: "team.cloudflareaccess.com",
          ACCESS_AUD: "test",
        } as Env,
      ),
    ).rejects.toMatchObject({ status: 401 });
  });
  it("rejeita origens externas e aceita mesma origem JSON", () => {
    expect(() =>
      checkCsrf(
        new Request("https://portal.test/api/admin/posts", {
          method: "POST",
          headers: {
            Origin: "https://evil.test",
            "Content-Type": "application/json",
          },
        }),
      ),
    ).toThrow();
    expect(() =>
      checkCsrf(
        new Request("https://portal.test/api/admin/posts", {
          method: "POST",
          headers: {
            Origin: "https://portal.test",
            "Content-Type": "application/json",
          },
        }),
      ),
    ).not.toThrow();
  });
});
