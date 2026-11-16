import { z } from "zod";
export type DocNode = {
  type: string;
  text?: string;
  attrs?: Record<string, any>;
  marks?: { type: string; attrs?: Record<string, any> }[];
  content?: DocNode[];
};
export const emptyDoc: DocNode = {
  type: "doc",
  content: [{ type: "paragraph" }],
};
export const escapeHtml = (s: unknown) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function safeUrl(value: unknown) {
  try {
    const u = new URL(String(value));
    return ["https:", "http:"].includes(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
}
export function driveImage(input: string) {
  const u = new URL(input);
  if (u.protocol !== "https:" || u.hostname !== "drive.google.com")
    throw new Error("Use um link HTTPS de drive.google.com.");
  const id =
    u.pathname.match(/^\/file\/d\/([\w-]+)(?:\/|$)/)?.[1] ??
    (["/open", "/uc", "/thumbnail"].includes(u.pathname)
      ? u.searchParams.get("id")
      : null);
  if (!id || !/^[\w-]{10,200}$/.test(id))
    throw new Error("Identificador do arquivo inválido.");
  return {
    provider: "google-drive",
    original_url: input,
    file_id: id,
    display_url: `https://drive.google.com/thumbnail?id=${id}&sz=w1600`,
  };
}
const docSchema: z.ZodType<DocNode> = z.lazy(() =>
  z.object({
    type: z.string().max(40),
    text: z.string().max(200000).optional(),
    attrs: z.record(z.string(), z.unknown()).optional(),
    marks: z
      .array(
        z.object({
          type: z.string(),
          attrs: z.record(z.string(), z.unknown()).optional(),
        }),
      )
      .max(20)
      .optional(),
    content: z.array(docSchema).max(3000).optional(),
  }),
);
export const contentSchema = z
  .object({
    title: z.string().trim().min(1).max(250),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(180),
    subtitle: z.string().max(500).default(""),
    excerpt: z.string().max(1000).default(""),
    content_json: docSchema,
    status: z.enum(["draft", "published", "scheduled"]).default("draft"),
    category_id: z.string().max(100).nullable().default(null),
    cover_image_id: z.string().max(100).nullable().default(null),
    author: z.string().min(1).max(150).default("Equipe InfoNaVidaReal"),
    featured: z.boolean().default(false),
    toc: z.boolean().default(true),
    seo_title: z.string().max(250).default(""),
    seo_description: z.string().max(500).default(""),
    canonical_url: z
      .string()
      .max(2000)
      .refine((v) => !v || !!safeUrl(v))
      .default(""),
    social_image: z
      .string()
      .max(2000)
      .refine((v) => !v || !!safeUrl(v))
      .default(""),
    scheduled_at: z.string().datetime().nullable().default(null),
  })
  .superRefine((v, c) => {
    if (v.content_json.type !== "doc")
      c.addIssue({
        code: "custom",
        message: "Documento TipTap inválido",
        path: ["content_json"],
      });
    if (
      v.status === "scheduled" &&
      (!v.scheduled_at || Date.parse(v.scheduled_at) <= Date.now())
    )
      c.addIssue({
        code: "custom",
        message: "Escolha uma data futura",
        path: ["scheduled_at"],
      });
  });
export const slugify = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export function textOf(n: DocNode): string {
  if (n.type === "promptBlock" || n.type === "noticeBlock")
    return [
      n.attrs?.title,
      n.attrs?.description,
      n.attrs?.text,
      n.attrs?.instructions,
      n.attrs?.example,
    ]
      .filter(Boolean)
      .join("\n");
  if (n.type === "tutorialBlock") {
    try {
      const steps = JSON.parse(n.attrs?.steps || "[]");
      return [
        n.attrs?.title,
        ...(Array.isArray(steps) ? steps : [])
          .filter((s) => s && typeof s === "object")
          .flatMap((s) => [s.title, s.description, s.notes]),
      ]
        .filter(Boolean)
        .join("\n");
    } catch {
      return String(n.attrs?.title || "");
    }
  }
  return (
    n.text ?? (n.content ?? []).map(textOf).join(n.type === "doc" ? "\n" : "")
  );
}
export function headings(doc: DocNode) {
  let i = 0;
  const result: { id: string; text: string; level: number }[] = [];
  function walk(n: DocNode) {
    if (n.type === "heading") {
      const level = Number(n.attrs?.level);
      const id = `secao-${++i}`;
      if (level === 2 || level === 3)
        result.push({ id, text: textOf(n), level });
    }
    (n.content ?? []).forEach(walk);
  }
  walk(doc);
  return result;
}
export function renderDoc(doc: DocNode) {
  let heading = 0;
  let count = 0;
  function render(n: DocNode, depth = 0): string {
    if (depth > 40 || ++count > 10000)
      throw new Error("Documento muito complexo");
    const a = n.attrs ?? {};
    const children = () =>
      (n.content ?? []).map((x) => render(x, depth + 1)).join("");
    const style = /^(left|center|right|justify)$/.test(a.textAlign)
      ? ` style="text-align:${a.textAlign}"`
      : "";
    if (n.type === "text") {
      let out = escapeHtml(n.text);
      for (const m of n.marks ?? []) {
        const tag: Record<string, string> = {
          bold: "strong",
          italic: "em",
          strike: "s",
          underline: "u",
          superscript: "sup",
          subscript: "sub",
          code: "code",
        };
        if (tag[m.type]) out = `<${tag[m.type]}>${out}</${tag[m.type]}>`;
        if (m.type === "link" && safeUrl(m.attrs?.href))
          out = `<a href="${escapeHtml(safeUrl(m.attrs?.href))}" rel="noopener noreferrer">${out}</a>`;
        if (m.type === "highlight") out = `<mark>${out}</mark>`;
        if (
          m.type === "textStyle" &&
          /^#[0-9a-f]{3,8}$/i.test(m.attrs?.color ?? "")
        )
          out = `<span style="color:${m.attrs!.color}">${out}</span>`;
      }
      return out;
    }
    switch (n.type) {
      case "doc":
        return children();
      case "paragraph":
        return `<p${style}>${children() || "<br>"}</p>`;
      case "heading": {
        const level = Math.min(6, Math.max(1, Number(a.level) || 2));
        return `<h${level} id="secao-${++heading}"${style}>${children()}</h${level}>`;
      }
      case "hardBreak":
        return "<br>";
      case "horizontalRule":
        return "<hr>";
      case "bulletList":
        return `<ul>${children()}</ul>`;
      case "orderedList":
        return `<ol start="${Math.max(1, Number(a.start) || 1)}">${children()}</ol>`;
      case "listItem":
        return `<li>${children()}</li>`;
      case "taskList":
        return `<ul class="tasks">${children()}</ul>`;
      case "taskItem":
        return `<li>${a.checked ? "☑" : "☐"} ${children()}</li>`;
      case "blockquote":
        return `<blockquote>${children()}</blockquote>`;
      case "codeBlock":
        return `<div class="code-block"><span>${escapeHtml(String(a.language || "texto").slice(0, 30))}</span><button type="button" data-copy-code>Copiar código</button><pre><code class="language-${escapeHtml(/^[\w-]{1,30}$/.test(a.language) ? a.language : "plaintext")}">${escapeHtml(textOf(n))}</code></pre></div>`;
      case "image": {
        const url = safeUrl(a.src);
        return url
          ? `<figure style="text-align:${["left", "center", "right"].includes(a.align) ? a.align : "center"}"><img src="${escapeHtml(url)}" alt="${escapeHtml(a.alt)}" loading="lazy" width="${Math.min(1600, Math.max(100, Number(a.width) || 960))}" height="${Math.min(2000, Math.max(100, Number(a.height) || 540))}"><figcaption>${escapeHtml(a.caption ?? a.title)}</figcaption></figure>`
          : "";
      }
      case "table":
        return `<div class="table-scroll"><table>${children()}</table></div>`;
      case "tableRow":
        return `<tr>${children()}</tr>`;
      case "tableCell":
      case "tableHeader": {
        const t = n.type === "tableHeader" ? "th" : "td";
        return `<${t} colspan="${Math.min(20, Math.max(1, Number(a.colspan) || 1))}" rowspan="${Math.min(20, Math.max(1, Number(a.rowspan) || 1))}">${children()}</${t}>`;
      }
      case "promptBlock":
        return `<aside class="prompt-block"><span class="eyebrow">PROMPT PRONTO</span><h3>${escapeHtml(a.title || "Seu próximo atalho")}</h3><p>${escapeHtml(a.description)}</p><pre data-prompt-text>${escapeHtml(a.text)}</pre><button type="button" data-copy-prompt>Copiar prompt</button><p>${escapeHtml(a.instructions)}</p>${a.example ? `<details><summary>Exemplo preenchido</summary><pre>${escapeHtml(a.example)}</pre></details>` : ""}</aside>`;
      case "noticeBlock":
        return `<aside class="notice notice-${["info", "tip", "warning", "important"].includes(a.variant) ? a.variant : "info"}"><strong>${escapeHtml(a.title || "Informação")}</strong><p>${escapeHtml(a.text)}</p></aside>`;
      case "tutorialBlock": {
        let steps: unknown;
        try {
          steps = JSON.parse(a.steps || "[]");
        } catch {
          steps = [];
        }
        return `<section class="tutorial"><h3>${escapeHtml(a.title || "Passo a passo")}</h3><ol>${(Array.isArray(
          steps,
        )
          ? steps
          : []
        )
          .slice(0, 100)
          .map(
            (s: any) =>
              `<li><h4>${escapeHtml(s.title)}</h4><p>${escapeHtml(s.description)}</p>${safeUrl(s.image) ? `<img src="${escapeHtml(safeUrl(s.image))}" alt="${escapeHtml(s.title)}" loading="lazy" width="800" height="450">` : ""}<small>${escapeHtml(s.notes)}</small></li>`,
          )
          .join("")}</ol></section>`;
      }
      default:
        return children();
    }
  }
  return render(doc);
}
