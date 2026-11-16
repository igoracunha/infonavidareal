import {
  escapeHtml as e,
  headings,
  renderDoc,
  safeUrl,
  textOf,
} from "../src/shared/content";
import { now, visible } from "./api";
import type { Env } from "./auth";
export async function publicSite(request: Request, env: Env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const base = env.SITE_URL.replace(/\/$/, "");
  const db = env.DB;
  const all = async (sql: string, ...v: unknown[]) =>
    (
      await db
        .prepare(sql)
        .bind(...v)
        .all<any>()
    ).results;
  const site = JSON.parse(
    (await db
      .prepare("SELECT value FROM settings WHERE key='site'")
      .first<{ value: string }>())!.value,
  );
  const categories = await all(
    "SELECT * FROM categories WHERE active=1 ORDER BY sort_order,name",
  );
  const pages = await all(
    "SELECT slug,updated_at FROM pages WHERE status='published'",
  );
  if (path === "/robots.txt")
    return new Response(
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\nSitemap: ${base}/sitemap.xml`,
      { headers: { "Content-Type": "text/plain" } },
    );
  if (path === "/sitemap.xml") {
    const published = await all(
      `SELECT slug,updated_at FROM posts WHERE ${visible} ORDER BY COALESCE(published_at,scheduled_at) DESC LIMIT 1000`,
      now(),
    );
    const urls = [
      { slug: "", updated_at: null },
      ...published.map((p) => ({ ...p, slug: "artigo/" + p.slug })),
      ...pages,
      ...categories.map((c) => ({
        slug: "categoria/" + c.slug,
        updated_at: null,
      })),
    ];
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((p) => `<url><loc>${e(base + "/" + p.slug)}</loc>${p.updated_at ? `<lastmod>${e(p.updated_at)}</lastmod>` : ""}</url>`).join("")}</urlset>`,
      { headers: { "Content-Type": "application/xml" } },
    );
  }
  if (path === "/rss.xml") {
    const posts = await all(
      `SELECT * FROM posts WHERE ${visible} ORDER BY COALESCE(published_at,scheduled_at) DESC LIMIT 20`,
      now(),
    );
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${e(site.name)}</title><link>${e(base)}</link><description>${e(site.description)}</description>${posts.map((p) => `<item><title>${e(p.title)}</title><link>${e(base + "/artigo/" + p.slug)}</link><guid>${e(base + "/artigo/" + p.slug)}</guid><description>${e(p.excerpt)}</description><pubDate>${e(new Date(p.published_at || p.scheduled_at).toUTCString())}</pubDate></item>`).join("")}</channel></rss>`,
      { headers: { "Content-Type": "application/rss+xml" } },
    );
  }
  function ad(position: string) {
    const slot = site.slots?.[position];
    return site.adsEnabled &&
      /^ca-pub-\d{16}$/.test(site.publisher) &&
      /^\d+$/.test(slot)
      ? `<aside class="ad-slot" aria-label="Publicidade" data-ad-client="${site.publisher}" data-ad-slot="${slot}"><small>Publicidade · exibida somente com consentimento</small></aside>`
      : "";
  }
  function card(p: any) {
    return `<article class="article-card"><a href="/artigo/${e(p.slug)}"><span class="card-category">${e(p.category_name || "Tecnologia no dia a dia")}</span><h3>${e(p.title)}</h3><p>${e(p.excerpt)}</p><span class="read-link">Ler artigo <span aria-hidden="true">↗</span></span></a></article>`;
  }
  let body = "",
    title = site.name,
    description = site.description,
    status = 200,
    canonical = base + path,
    social = "",
    structured: unknown = null;
  if (path.startsWith("/artigo/")) {
    const slug = path.slice(8);
    const p = await db
      .prepare(
        `SELECT p.*,c.name AS category_name,c.slug AS category_slug,m.display_url AS cover,m.alt_text AS cover_alt FROM posts p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN media m ON m.id=p.cover_image_id WHERE p.slug=? AND (p.status='published' OR (p.status='scheduled' AND p.scheduled_at<=?))`,
      )
      .bind(slug, now())
      .first<any>();
    if (p) {
      title = p.seo_title || p.title;
      description = p.seo_description || p.excerpt;
      canonical = safeUrl(p.canonical_url) || canonical;
      social = safeUrl(p.social_image) || safeUrl(p.cover);
      const doc = JSON.parse(p.content_json);
      const toc = headings(doc);
      const related = await all(
        `SELECT * FROM posts WHERE ${visible} AND id<>? AND category_id=? LIMIT 3`,
        now(),
        p.id,
        p.category_id,
      );
      const date = p.published_at || p.scheduled_at;
      structured = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: p.title,
        description,
        datePublished: date,
        dateModified: p.updated_at,
        author: { "@type": "Person", name: p.author },
        mainEntityOfPage: canonical,
        ...(social ? { image: [social] } : {}),
      };
      const content = renderDoc(doc);
      body = `<div class="reading-layout"><article class="article"><nav class="breadcrumb"><a href="/">Início</a> / <a href="${p.category_slug ? "/categoria/" + e(p.category_slug) : "/artigos"}">${e(p.category_name || "Artigos")}</a></nav><span class="eyebrow">${e(p.category_name)}</span><h1>${e(p.title)}</h1>${p.subtitle ? `<p class="subtitle">${e(p.subtitle)}</p>` : ""}<div class="article-meta">Por ${e(p.author)} · <time datetime="${e(date)}">${new Date(date).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</time> · ${Math.max(1, Math.ceil(textOf(doc).split(/\s+/).length / 200))} min de leitura<br><small>Atualizado em ${new Date(p.updated_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</small></div>${p.cover ? `<figure><img src="${e(p.cover)}" alt="${e(p.cover_alt)}" width="1200" height="675"></figure>` : ""}${ad("start")}${p.toc && toc.length ? `<nav class="toc" aria-label="Neste artigo"><strong>Neste artigo</strong>${toc.map((h) => `<a class="level-${h.level}" href="#${h.id}">${e(h.text)}</a>`).join("")}</nav>` : ""}<div class="prose">${content}</div>${ad("middle")}${ad("end")}<button data-share type="button">Compartilhar artigo</button></article><aside class="reading-sidebar"><span class="eyebrow">APRENDA. TESTE. RESOLVA.</span><h3>Uma ideia útil pode mudar seu dia.</h3><p>Tecnologia com contexto e sem complicação.</p><a href="/artigos">Explore os artigos →</a>${ad("sidebar")}</aside></div>${related.length ? `<section class="section"><h2>Continue explorando</h2><div class="card-grid">${related.map(card).join("")}</div></section>` : ""}`;
    }
  } else if (
    path === "/" ||
    path === "/artigos" ||
    path === "/busca" ||
    path.startsWith("/categoria/")
  ) {
    const category = path.startsWith("/categoria/")
      ? categories.find((c) => c.slug === path.slice(11))
      : null;
    if (path.startsWith("/categoria/") && !category) {
      status = 404;
    } else {
      const q = (url.searchParams.get("q") || "").slice(0, 200);
      const page = Math.min(
        10000,
        Math.max(1, Number(url.searchParams.get("pagina")) || 1),
      );
      const rows = await all(
        `SELECT p.*,c.name AS category_name FROM posts p LEFT JOIN categories c ON c.id=p.category_id WHERE (p.status='published' OR (p.status='scheduled' AND p.scheduled_at<=?)) AND (?='' OR p.title LIKE ? OR p.excerpt LIKE ?) AND (?='' OR p.category_id=?) ORDER BY COALESCE(p.published_at,p.scheduled_at) DESC LIMIT 13 OFFSET ?`,
        now(),
        q,
        "%" + q + "%",
        "%" + q + "%",
        category?.id || "",
        category?.id || "",
        (page - 1) * 12,
      );
      const featured =
        path === "/"
          ? await all(
              `SELECT * FROM posts WHERE ${visible} AND featured=1 ORDER BY updated_at DESC LIMIT 3`,
              now(),
            )
          : [];
      title = category
        ? category.name
        : path === "/busca"
          ? "Buscar artigos"
          : path === "/artigos"
            ? "Todos os artigos"
            : site.name;
      body = `${path === "/" ? `<section class="hero"><div><span class="eyebrow">INTELIGÊNCIA ARTIFICIAL. VIDA REAL.</span><h1>Menos complicação.<br>Mais <span>possibilidades.</span></h1><p>${e(site.description)}</p><a class="button" href="/artigos">Encontre sua próxima solução ↗</a><div class="hero-note"><span>✦</span> Tecnologia que cabe na sua rotina.</div></div><aside class="hero-panel"><span class="panel-label">SEU PONTO DE PARTIDA</span><h2>O que você quer<br>resolver hoje?</h2><a href="/categoria/prompts-prontos">01 <span>Escrever um prompt melhor</span> ↗</a><a href="/categoria/tutoriais">02 <span>Aprender na prática</span> ↗</a><a href="/categoria/ferramentas-digitais">03 <span>Descobrir uma ferramenta</span> ↗</a></aside></section><nav class="category-strip" aria-label="Categorias">${categories.map((c) => `<a href="/categoria/${e(c.slug)}">${e(c.name)}</a>`).join("")}</nav>${ad("home")}` : ""}<section class="section"><div class="section-heading"><div><span class="eyebrow">CONHECIMENTO QUE VIRA AÇÃO</span><h2>${e(category?.name || (q ? "Resultados para “" + q + "”" : path === "/" ? "Novas ideias para o seu dia" : "Explore os artigos"))}</h2></div><form action="/busca" class="search"><label class="sr-only" for="search">Buscar artigos</label><input id="search" name="q" placeholder="O que você quer aprender?" value="${e(q)}"><button>Buscar ↗</button></form></div>${featured.length ? `<h3>Em destaque</h3><div class="card-grid featured">${featured.map(card).join("")}</div>` : ""}<div class="card-grid">${rows.slice(0, 12).map(card).join("")}</div>${!rows.length ? '<div class="empty"><span>✦</span><h3>Novas soluções estão a caminho.</h3><p>Os artigos publicados pela equipe vão aparecer aqui. Explore as categorias ou tente outra busca.</p></div>' : ""}<nav class="pagination" aria-label="Paginação">${page > 1 ? `<a href="?pagina=${page - 1}&q=${encodeURIComponent(q)}">← Anterior</a>` : ""}${rows.length > 12 ? `<a href="?pagina=${page + 1}&q=${encodeURIComponent(q)}">Próxima →</a>` : ""}</nav>${ad("listing")}</section>${path === "/" ? `<section class="prompt-promo"><span class="eyebrow">DA IDEIA À PRÁTICA</span><h2>Uma boa pergunta.<br>Um mundo de possibilidades.</h2><p>Encontre prompts para adaptar, copiar e usar no seu dia a dia.</p><a class="button" href="/categoria/prompts-prontos">Explorar prompts prontos ↗</a></section>` : ""}`;
    }
  } else {
    const p = await db
      .prepare("SELECT * FROM pages WHERE slug=? AND status='published'")
      .bind(path.slice(1))
      .first<any>();
    if (p) {
      title = p.seo_title || p.title;
      description = p.seo_description || description;
      body = `<article class="article institutional"><span class="eyebrow">INFONAVIDAREAL</span><h1>${e(p.title)}</h1><div class="prose">${renderDoc(JSON.parse(p.content_json))}</div></article>`;
    }
  }
  if (!body) {
    const redirect = await db
      .prepare("SELECT new_path FROM redirects WHERE old_path=?")
      .bind(path)
      .first<{ new_path: string }>();
    if (redirect && redirect.new_path !== path) {
      const target = redirect.new_path;
      const exists = target.startsWith("/artigo/")
        ? await db
            .prepare(`SELECT id FROM posts WHERE slug=? AND ${visible}`)
            .bind(target.slice(8), now())
            .first()
        : await db
            .prepare("SELECT id FROM pages WHERE slug=? AND status='published'")
            .bind(target.slice(1))
            .first();
      if (exists)
        return new Response(null, {
          status: 301,
          headers: { Location: base + target },
        });
    }
    status = 404;
    title = "Página não encontrada";
    body =
      '<section class="empty section"><span class="eyebrow">404 · UM NOVO CAMINHO</span><h1>Essa página não está por aqui.</h1><p>Uma nova descoberta começa na página inicial.</p><a class="button" href="/">Voltar ao início ↗</a></section>';
  }
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(title)}</title><meta name="description" content="${e(description)}"><link rel="canonical" href="${e(canonical)}">${status === 404 ? '<meta name="robots" content="noindex">' : ""}<meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:url" content="${e(canonical)}"><meta property="og:type" content="${structured ? "article" : "website"}"><meta name="twitter:card" content="${social ? "summary_large_image" : "summary"}">${social ? `<meta property="og:image" content="${e(social)}"><meta name="twitter:image" content="${e(social)}">` : ""}${safeUrl(site.favicon) ? `<link rel="icon" href="${e(site.favicon)}">` : ""}<link rel="stylesheet" href="/assets/public.css"><link rel="alternate" type="application/rss+xml" href="/rss.xml" title="RSS">${structured ? `<script type="application/ld+json">${JSON.stringify(structured).replace(/</g, "\\u003c")}</script>` : ""}</head><body><a class="skip" href="#main">Pular para conteúdo</a><header class="site-header"><a class="brand" href="/">${safeUrl(site.logo) ? `<img src="${e(site.logo)}" alt="${e(site.name)}" width="210" height="52">` : `<strong>${e(site.name)}<small>2.0</small></strong>`}</a><nav aria-label="Principal"><a href="/artigos">Artigos</a><a href="/categoria/prompts-prontos">Prompts</a><a href="/categoria/tutoriais">Tutoriais</a><a href="/sobre">Sobre</a>${site.darkMode ? '<button class="theme" aria-label="Alternar tema" data-theme>◐</button>' : ""}</nav></header><main id="main">${body}</main><footer><div><a class="brand" href="/">${e(site.name)}</a><p>${e(site.slogan)}</p></div><nav aria-label="Institucional">${pages.map((p) => `<a href="/${e(p.slug)}">${e(p.slug.replaceAll("-", " "))}</a>`).join("")}<a href="/rss.xml">RSS</a><button data-cookie-settings>Preferências de cookies</button></nav><small>© ${new Date().getFullYear()} ${e(site.name)} · Tecnologia para a vida real.</small></footer>${site.adsEnabled ? '<section class="cookie-banner" data-consent hidden aria-label="Preferências de publicidade"><p>Podemos carregar anúncios do Google, que utilizam cookies e dados de navegação. Sua escolha é opcional e pode ser alterada no rodapé.</p><button data-accept-ads>Aceitar publicidade</button><button data-reject-ads>Recusar</button><a href="/cookies">Saiba mais</a></section>' : ""}<div class="toast" role="status" aria-live="polite"></div><script type="module" src="/assets/public.js"></script></body></html>`;
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
