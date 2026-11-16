import { z } from "zod";
import {
  contentSchema,
  driveImage,
  renderDoc,
  safeUrl,
} from "../src/shared/content";
import type { Env } from "./auth";
export const visible =
  "(status='published' OR (status='scheduled' AND scheduled_at <= ?))";
export const now = () => new Date().toISOString();
const json = (value: unknown, status = 200) =>
  Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
export const siteSchema = z.object({
  name: z.string().min(1).max(100),
  slogan: z.string().max(200),
  description: z.string().max(500),
  logo: z
    .string()
    .max(2000)
    .refine((v) => !v || !!safeUrl(v)),
  favicon: z
    .string()
    .max(2000)
    .refine((v) => !v || !!safeUrl(v)),
  contact: z.string().max(300),
  social: z.string().max(2000),
  darkMode: z.boolean(),
  adsEnabled: z.boolean(),
  publisher: z.string().regex(/^(|ca-pub-\d{16})$/),
  slots: z.partialRecord(
    z.enum(["home", "listing", "start", "middle", "end", "sidebar"]),
    z.string().regex(/^\d{1,20}$/),
  ),
});
export async function api(request: Request, env: Env) {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const resource = parts[2],
    id = parts[3];
  const method = request.method;
  const db = env.DB;
  const all = async (sql: string, ...values: unknown[]) =>
    (
      await db
        .prepare(sql)
        .bind(...values)
        .all()
    ).results;
  if (Number(request.headers.get("content-length") || 0) > 700000)
    return json({ error: "Conteúdo excede 700 KB." }, 413);
  let body: any;
  if (!["GET", "HEAD", "DELETE"].includes(method)) {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 700000)
      return json({ error: "Conteúdo excede 700 KB." }, 413);
    try {
      body = JSON.parse(raw);
    } catch {
      return json({ error: "JSON inválido." }, 400);
    }
  }
  if (resource === "dashboard" && method === "GET")
    return json({
      posts: await all(
        "SELECT status,count(*) AS total FROM posts GROUP BY status",
      ),
      categories: await all("SELECT count(*) AS total FROM categories"),
      recent: await all(
        "SELECT id,title,status,updated_at FROM posts ORDER BY updated_at DESC LIMIT 6",
      ),
    });
  if (resource === "settings") {
    if (method === "GET")
      return json(
        JSON.parse(
          (await db
            .prepare("SELECT value FROM settings WHERE key='site'")
            .first<{ value: string }>())!.value,
        ),
      );
    if (method === "PUT") {
      const data = siteSchema.parse(body);
      await db
        .prepare(
          "INSERT INTO settings(key,value) VALUES('site',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        )
        .bind(JSON.stringify(data))
        .run();
      return json(data);
    }
  }
  if (resource === "categories") {
    if (method === "GET")
      return json(
        await all("SELECT * FROM categories ORDER BY sort_order,name"),
      );
    if (method === "POST" || method === "PUT") {
      const v = z
        .object({
          name: z.string().min(1).max(100),
          slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
          description: z.string().max(1000).default(""),
          active: z.boolean().default(true),
          sort_order: z.number().int().min(0).max(1000).default(0),
        })
        .parse(body);
      const cid = id || crypto.randomUUID();
      await db
        .prepare(
          "INSERT INTO categories(id,name,slug,description,active,sort_order) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,slug=excluded.slug,description=excluded.description,active=excluded.active,sort_order=excluded.sort_order",
        )
        .bind(cid, v.name, v.slug, v.description, +v.active, v.sort_order)
        .run();
      return json({ id: cid });
    }
  }
  if (resource === "media") {
    if (method === "GET")
      return json(
        await all("SELECT * FROM media ORDER BY created_at DESC LIMIT 100"),
      );
    if (method === "POST") {
      const v = z
        .object({
          url: z.string().max(2000),
          alt_text: z.string().max(500).default(""),
          caption: z.string().max(1000).default(""),
        })
        .parse(body);
      let m;
      try {
        m = driveImage(v.url);
      } catch {
        return json({ error: "Link do Google Drive inválido." }, 400);
      }
      const mid = crypto.randomUUID();
      await db
        .prepare(
          "INSERT INTO media(id,provider,original_url,file_id,display_url,alt_text,caption,created_at) VALUES(?,?,?,?,?,?,?,?)",
        )
        .bind(
          mid,
          m.provider,
          m.original_url,
          m.file_id,
          m.display_url,
          v.alt_text,
          v.caption,
          now(),
        )
        .run();
      return json({ id: mid, ...m, ...v });
    }
  }
  if (resource === "posts" || resource === "pages") {
    const table = resource;
    const kind = table === "posts" ? "post" : "page";
    if (method === "GET") {
      if (id) {
        if (parts[4] === "revisions")
          return json(
            await all(
              "SELECT * FROM revisions WHERE content_type=? AND content_id=? ORDER BY created_at DESC LIMIT 50",
              kind,
              id,
            ),
          );
        const row = await db
          .prepare(`SELECT * FROM ${table} WHERE id=?`)
          .bind(id)
          .first();
        return row
          ? json(row)
          : json({ error: "Conteúdo não encontrado" }, 404);
      }
      const q = url.searchParams.get("q") || "";
      const status = url.searchParams.get("status") || "";
      return json(
        await all(
          `SELECT id,title,slug,status,updated_at${table === "posts" ? ",scheduled_at,featured" : ""} FROM ${table} WHERE title LIKE ? AND (?='' OR status=?) ORDER BY updated_at DESC LIMIT 100`,
          "%" + q + "%",
          status,
          status,
        ),
      );
    }
    if (method === "DELETE" && id) {
      const existing = await db
        .prepare(`SELECT id FROM ${table} WHERE id=?`)
        .bind(id)
        .first();
      if (!existing) return json({ error: "Conteúdo não encontrado" }, 404);
      await db.batch([
        db
          .prepare(
            "DELETE FROM revisions WHERE content_type=? AND content_id=?",
          )
          .bind(kind, id),
        db.prepare(`DELETE FROM ${table} WHERE id=?`).bind(id),
      ]);
      return json({ deleted: true });
    }
    if (method === "POST" || method === "PUT") {
      const v = contentSchema.parse(body);
      if (table === "pages" && v.status === "scheduled")
        return json({ error: "Páginas não suportam agendamento." }, 400);
      const pid = id || crypto.randomUUID();
      const old = id
        ? await db
            .prepare(`SELECT * FROM ${table} WHERE id=?`)
            .bind(id)
            .first<any>()
        : null;
      if (method === "PUT" && !old)
        return json({ error: "Conteúdo não encontrado" }, 404);
      const html = renderDoc(v.content_json);
      const time = now();
      const statements: D1PreparedStatement[] = [];
      if (old) {
        statements.push(
          db
            .prepare("INSERT INTO revisions VALUES(?,?,?,?,?)")
            .bind(crypto.randomUUID(), kind, pid, old.content_json, time),
        );
        if (old.slug !== v.slug) {
          const prefix = table === "posts" ? "/artigo/" : "/";
          statements.push(
            db
              .prepare(
                "INSERT INTO redirects VALUES(?,?,?,?) ON CONFLICT(old_path) DO UPDATE SET new_path=excluded.new_path,created_at=excluded.created_at",
              )
              .bind(
                crypto.randomUUID(),
                prefix + old.slug,
                prefix + v.slug,
                time,
              ),
          );
        }
      }
      if (table === "posts") {
        statements.push(
          db
            .prepare(
              `INSERT INTO posts(id,title,subtitle,slug,excerpt,content_json,content_html,status,category_id,cover_image_id,author,featured,toc,seo_title,seo_description,canonical_url,social_image,published_at,scheduled_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,subtitle=excluded.subtitle,slug=excluded.slug,excerpt=excluded.excerpt,content_json=excluded.content_json,content_html=excluded.content_html,status=excluded.status,category_id=excluded.category_id,cover_image_id=excluded.cover_image_id,author=excluded.author,featured=excluded.featured,toc=excluded.toc,seo_title=excluded.seo_title,seo_description=excluded.seo_description,canonical_url=excluded.canonical_url,social_image=excluded.social_image,published_at=excluded.published_at,scheduled_at=excluded.scheduled_at,updated_at=excluded.updated_at`,
            )
            .bind(
              pid,
              v.title,
              v.subtitle,
              v.slug,
              v.excerpt,
              JSON.stringify(v.content_json),
              html,
              v.status,
              v.category_id,
              v.cover_image_id,
              v.author,
              +v.featured,
              +v.toc,
              v.seo_title,
              v.seo_description,
              v.canonical_url,
              v.social_image,
              v.status === "published"
                ? old?.published_at || time
                : (old?.published_at ?? null),
              v.scheduled_at,
              old?.created_at || time,
              time,
            ),
        );
      } else {
        statements.push(
          db
            .prepare(
              "INSERT INTO pages VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,slug=excluded.slug,content_json=excluded.content_json,content_html=excluded.content_html,status=excluded.status,seo_title=excluded.seo_title,seo_description=excluded.seo_description,updated_at=excluded.updated_at",
            )
            .bind(
              pid,
              v.title,
              v.slug,
              JSON.stringify(v.content_json),
              html,
              v.status,
              v.seo_title,
              v.seo_description,
              old?.created_at || time,
              time,
            ),
        );
      }
      const limit = Math.min(50, Math.max(1, Number(env.REVISION_LIMIT) || 20));
      statements.push(
        db
          .prepare(
            "DELETE FROM revisions WHERE content_type=? AND content_id=? AND id NOT IN (SELECT id FROM revisions WHERE content_type=? AND content_id=? ORDER BY created_at DESC LIMIT ?)",
          )
          .bind(kind, pid, kind, pid, limit),
      );
      await db.batch(statements);
      return json({ id: pid, updated_at: time }, old ? 200 : 201);
    }
  }
  return json({ error: "Rota não encontrada" }, 404);
}
