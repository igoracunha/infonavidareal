import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
const Editor = React.lazy(() => import("../editor/Editor"));
import { emptyDoc, slugify, driveImage, type DocNode } from "../shared/content";
import "../styles/admin.css";
type Content = Record<string, any> & {
  content_json: DocNode;
  title: string;
  slug: string;
  status: string;
};
async function api(path: string, method = "GET", body?: unknown) {
  const r = await fetch("/api/admin/" + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const result: any = await r
    .json()
    .catch(() => ({
      error: "Sessão expirada. Atualize a página para entrar novamente.",
    }));
  if (!r.ok) throw new Error(result.details?.join("\n") || result.error);
  return result;
}
const blank = (): Content => ({
  title: "",
  slug: "",
  subtitle: "",
  excerpt: "",
  content_json: emptyDoc,
  status: "draft",
  author: "Equipe InfoNaVidaReal",
  category_id: null,
  cover_image_id: null,
  featured: false,
  toc: true,
  seo_title: "",
  seo_description: "",
  canonical_url: "",
  social_image: "",
  scheduled_at: null,
});
function App() {
  const [section, setSection] = useState("dashboard");
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  const [editing, setEditing] = useState<Content | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      setError("");
      setData(
        await api(
          section +
            (section === "posts" || section === "pages"
              ? `?q=${encodeURIComponent(q)}&status=${status}`
              : ""),
        ),
      );
      setCategories(await api("categories"));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [section, q, status]);
  useEffect(() => {
    load();
  }, [load]);
  function navigate(value: string) {
    if (
      editing &&
      !confirm("Sair do editor? Verifique se o conteúdo foi salvo.")
    )
      return;
    setSection(value);
    setEditing(null);
    setData(null);
    setQ("");
    setStatus("");
    setNotice("");
  }
  async function edit(id: string) {
    try {
      const row = await api(section + "/" + id);
      setEditing({
        ...blank(),
        ...row,
        content_json: JSON.parse(row.content_json),
        featured: !!row.featured,
        toc: !!row.toc,
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/" target="_blank" rel="noreferrer">
          InfoNaVidaReal <small>CMS 2.0</small>
        </a>
        <span className="sidebar-label">SEU ESPAÇO EDITORIAL</span>
        <nav>
          {[
            ["dashboard", "◫", "Visão geral"],
            ["posts", "▤", "Artigos"],
            ["pages", "▧", "Páginas"],
            ["categories", "⌗", "Categorias"],
            ["media", "▣", "Imagens"],
            ["settings", "⚙", "Configurações"],
          ].map(([key, icon, label]) => (
            <button
              className={section === key ? "active" : ""}
              key={key}
              onClick={() => navigate(key)}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span>TECNOLOGIA QUE RESOLVE.</span>
          <a href="/" target="_blank" rel="noreferrer">
            Visitar o blog ↗
          </a>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-top">
          <span>
            Workspace{" "}
            <span className="muted">
              /{" "}
              {
                (
                  {
                    dashboard: "Visão geral",
                    posts: "Artigos",
                    pages: "Páginas",
                    categories: "Categorias",
                    media: "Imagens",
                    settings: "Configurações",
                  } as any
                )[section]
              }
            </span>
          </span>
          <span className="status-pill">● Área editorial</span>
        </header>
        {error && (
          <div className="error" role="alert">
            {error}
            <button onClick={() => setError("")}>Fechar</button>
          </div>
        )}
        {notice && (
          <div className="success" role="status">
            {notice}
          </div>
        )}
        {editing ? (
          <ContentEditor
            initial={editing}
            type={section}
            categories={categories}
            onSaved={(v) => {
              setEditing(v);
            }}
            onClose={() => {
              setEditing(null);
              load();
            }}
          />
        ) : (
          <div className="admin-content">
            <div className="page-heading">
              <div>
                <span className="eyebrow">INFONAVIDAREAL · 2.0</span>
                <h1>
                  {
                    (
                      {
                        dashboard: "Boas ideias começam aqui.",
                        posts: "Seu conteúdo, organizado.",
                        pages: "As páginas do seu portal.",
                        categories: "Um lugar para cada ideia.",
                        media: "Imagens que contam histórias.",
                        settings: "Do seu jeito.",
                      } as any
                    )[section]
                  }
                </h1>
                <p className="muted">
                  {section === "dashboard"
                    ? "Transforme conhecimento em soluções para a vida real."
                    : "Gerencie seu portal com clareza e simplicidade."}
                </p>
              </div>
              {["posts", "pages"].includes(section) && (
                <button className="primary" onClick={() => setEditing(blank())}>
                  + {section === "posts" ? "Novo artigo" : "Nova página"}
                </button>
              )}
            </div>
            {!data ? (
              <p>Carregando…</p>
            ) : section === "dashboard" ? (
              <>
                <div className="stats-grid">
                  {[
                    [
                      "Total de artigos",
                      data.posts.reduce((a: number, p: any) => a + p.total, 0),
                    ],
                    [
                      "Publicados",
                      data.posts
                        .filter((p: any) => p.status === "published")
                        .reduce((a: number, p: any) => a + p.total, 0),
                    ],
                    [
                      "Rascunhos",
                      data.posts.find((p: any) => p.status === "draft")
                        ?.total || 0,
                    ],
                    [
                      "Agendados",
                      data.posts.find((p: any) => p.status === "scheduled")
                        ?.total || 0,
                    ],
                  ].map(([name, count]) => (
                    <article className="stat" key={name}>
                      <span>{name}</span>
                      <strong>{count}</strong>
                    </article>
                  ))}
                </div>
                <div className="dashboard-grid">
                  <section className="panel">
                    <div className="panel-heading">
                      <h2>Últimas atualizações</h2>
                      <button onClick={() => navigate("posts")}>
                        Ver artigos ↗
                      </button>
                    </div>
                    {!data.recent.length ? (
                      <div className="empty">
                        <span>✦</span>
                        <h3>Seu primeiro artigo começa com uma ideia.</h3>
                        <p>
                          Crie um conteúdo útil, adicione um prompt e
                          compartilhe conhecimento.
                        </p>
                        <button
                          className="primary"
                          onClick={() => {
                            setSection("posts");
                            setEditing(blank());
                          }}
                        >
                          Criar meu primeiro artigo
                        </button>
                      </div>
                    ) : (
                      data.recent.map((p: any) => (
                        <div className="recent-row" key={p.id}>
                          <div>
                            <strong>{p.title}</strong>
                            <small>
                              {new Date(p.updated_at).toLocaleString("pt-BR")}
                            </small>
                          </div>
                          <span className={"badge " + p.status}>
                            {statusLabel(p.status)}
                          </span>
                        </div>
                      ))
                    )}
                  </section>
                  <aside className="panel editorial-tip">
                    <span className="eyebrow">O PRÓXIMO PASSO</span>
                    <h2>
                      Uma solução.
                      <br />
                      Muitas possibilidades.
                    </h2>
                    <p>
                      Escreva para quem quer resolver um problema real. Mostre
                      como fazer, passo a passo.
                    </p>
                    <hr />
                    <span>
                      {data.categories[0].total} categorias para explorar
                    </span>
                    <button onClick={() => navigate("categories")}>
                      Organizar categorias →
                    </button>
                  </aside>
                </div>
                <p className="muted small">
                  Os números refletem o status editorial salvo. Artigos
                  agendados ficam disponíveis automaticamente quando a data
                  chega.
                </p>
              </>
            ) : ["posts", "pages"].includes(section) ? (
              <section className="panel">
                <div className="filters">
                  <label>
                    Pesquisar
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Buscar pelo título"
                    />
                  </label>
                  <label>
                    Status
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="">Todos</option>
                      <option value="draft">Rascunho</option>
                      <option value="published">Publicado</option>
                      {section === "posts" && (
                        <option value="scheduled">Agendado</option>
                      )}
                    </select>
                  </label>
                </div>
                <div className="table-scroll">
                  <table className="content-table">
                    <thead>
                      <tr>
                        <th>Título</th>
                        <th>Status</th>
                        <th>Atualização</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((p: any) => (
                        <tr key={p.id}>
                          <td>
                            <button
                              className="text-link"
                              onClick={() => edit(p.id)}
                            >
                              {p.title}
                            </button>
                            <small>
                              /{section === "posts" ? "artigo/" : ""}
                              {p.slug}
                            </small>
                          </td>
                          <td>
                            <span className={"badge " + p.status}>
                              {statusLabel(p.status)}
                            </span>
                          </td>
                          <td>
                            {new Date(p.updated_at).toLocaleDateString("pt-BR")}
                          </td>
                          <td>
                            <div className="row-actions">
                              <button onClick={() => edit(p.id)}>Editar</button>
                              <button
                                onClick={async () => {
                                  try {
                                    const row = await api(section + "/" + p.id);
                                    setEditing({
                                      ...blank(),
                                      ...row,
                                      id: undefined,
                                      title: row.title + " (cópia)",
                                      slug:
                                        row.slug +
                                        "-copia-" +
                                        Date.now().toString(36),
                                      status: "draft",
                                      content_json: JSON.parse(
                                        row.content_json,
                                      ),
                                      featured: !!row.featured,
                                      toc: !!row.toc,
                                      scheduled_at: null,
                                    });
                                  } catch (e) {
                                    setError((e as Error).message);
                                  }
                                }}
                              >
                                Duplicar
                              </button>
                              <button
                                className="danger"
                                onClick={async () => {
                                  if (
                                    confirm(
                                      `Excluir “${p.title}” e suas revisões?`,
                                    )
                                  ) {
                                    try {
                                      await api(section + "/" + p.id, "DELETE");
                                      load();
                                    } catch (e) {
                                      setError((e as Error).message);
                                    }
                                  }
                                }}
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!data.length && (
                  <div className="empty">
                    Nenhum conteúdo encontrado. Crie o primeiro.
                  </div>
                )}
                <p className="small muted">
                  Até 100 resultados. Use a busca para localizar conteúdos
                  anteriores.
                </p>
              </section>
            ) : section === "categories" ? (
              <Categories data={data} reload={load} onError={setError} />
            ) : section === "media" ? (
              <Media data={data} reload={load} onError={setError} />
            ) : section === "settings" ? (
              <Settings
                initial={data}
                saved={() => setNotice("Configurações salvas.")}
                onError={setError}
              />
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
function statusLabel(s: string) {
  return (
    (
      {
        published: "Publicado",
        draft: "Rascunho",
        scheduled: "Agendado",
      } as any
    )[s] || s
  );
}
function ContentEditor({
  initial,
  type,
  categories,
  onSaved,
  onClose,
}: {
  initial: Content;
  type: string;
  categories: any[];
  onSaved: (v: Content) => void;
  onClose: () => void;
}) {
  const [v, setV] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("Ainda não salvo nesta sessão");
  const [error, setError] = useState("");
  const [revisions, setRevisions] = useState<any[]>([]);
  const [cover, setCover] = useState("");
  const [coverAlt, setCoverAlt] = useState("");
  const dirty = useRef(false);
  const busy = useRef(false);
  const current = useRef(v);
  current.current = v;
  const update = (key: string, value: any) => {
    dirty.current = true;
    setV((x) => ({ ...x, [key]: value }));
  };
  const save = useCallback(
    async (status?: string) => {
      if (busy.current) return;
      const baseline = current.current;
      const candidate: Content = {
        ...baseline,
        status: status || baseline.status,
      };
      if (!candidate.title || !candidate.slug) return;
      busy.current = true;
      setSaving(true);
      setError("");
      try {
        const result = await api(
          type + (candidate.id ? "/" + candidate.id : ""),
          candidate.id ? "PUT" : "POST",
          candidate,
        );
        const next = {
          ...candidate,
          id: result.id,
          updated_at: result.updated_at,
        };
        dirty.current = current.current !== baseline;
        setV((previous) => ({
          ...previous,
          id: result.id,
          status: candidate.status,
          updated_at: result.updated_at,
        }));
        setMessage("Salvo às " + new Date().toLocaleTimeString("pt-BR"));
        onSaved(next);
      } catch (e) {
        setError((e as Error).message);
        setMessage("Falha ao salvar");
      } finally {
        busy.current = false;
        setSaving(false);
      }
    },
    [type, onSaved],
  );
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const timer = setInterval(() => {
      if (
        dirty.current &&
        current.current.title &&
        current.current.slug &&
        current.current.status === "draft"
      )
        saveRef.current();
    }, 15000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const leave = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, []);
  const warnings = [
    !v.seo_title && "Título SEO ausente",
    !v.seo_description && "Descrição SEO ausente",
    JSON.stringify(v.content_json).includes('"alt":""') &&
      "Imagem sem texto alternativo",
  ].filter(Boolean);
  return (
    <div className="admin-content">
      <div className="editor-heading">
        <div>
          <button
            onClick={() => {
              if (
                !dirty.current ||
                confirm("Sair com alterações ainda não salvas?")
              )
                onClose();
            }}
          >
            ← Voltar
          </button>
          <span className="save-status" role="status">
            {saving ? "Salvando…" : message}
          </span>
        </div>
        <div>
          <button
            disabled={saving || !v.title || !v.slug}
            onClick={() => save()}
          >
            Salvar {v.status === "draft" ? "rascunho" : "alterações"}
          </button>
          <button
            disabled={saving || !v.title || !v.slug}
            className="primary"
            onClick={() => save("published")}
          >
            Publicar agora
          </button>
        </div>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="editing-grid">
        <div>
          <label className="title-field">
            <span>Título</span>
            <input
              value={v.title}
              placeholder="Uma ideia que merece ser compartilhada…"
              onChange={(e) => {
                dirty.current = true;
                setV((x) => ({
                  ...x,
                  title: e.target.value,
                  ...(!x.id && (!x.slug || x.slug === slugify(x.title))
                    ? { slug: slugify(e.target.value) }
                    : {}),
                }));
              }}
            />
          </label>
          <label>
            Subtítulo
            <input
              value={v.subtitle}
              onChange={(e) => update("subtitle", e.target.value)}
            />
          </label>
          <React.Suspense fallback={<p>Carregando editor…</p>}><Editor
            value={v.content_json}
            onChange={(doc) => update("content_json", doc)}
          /></React.Suspense>
        </div>
        <aside className="publish-panel">
          <h2>Publicação</h2>
          <label>
            Slug
            <input
              value={v.slug}
              onChange={(e) => update("slug", slugify(e.target.value))}
            />
          </label>
          <label>
            Status
            <select
              value={v.status}
              onChange={(e) => update("status", e.target.value)}
            >
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
              {type === "posts" && <option value="scheduled">Agendado</option>}
            </select>
          </label>
          {v.status === "scheduled" && (
            <>
              <label>
                Data e hora local
                <input
                  type="datetime-local"
                  value={
                    v.scheduled_at
                      ? new Date(
                          Date.parse(v.scheduled_at) -
                            new Date().getTimezoneOffset() * 60000,
                        )
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    update(
                      "scheduled_at",
                      e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    )
                  }
                />
              </label>
              <button onClick={() => save("scheduled")}>
                Salvar agendamento
              </button>
            </>
          )}
          {type === "posts" && (
            <>
              <label>
                Categoria
                <select
                  value={v.category_id || ""}
                  onChange={(e) =>
                    update("category_id", e.target.value || null)
                  }
                >
                  <option value="">Sem categoria</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {!c.active ? " (desativada)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Autor
                <input
                  value={v.author}
                  onChange={(e) => update("author", e.target.value)}
                />
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={v.featured}
                  onChange={(e) => update("featured", e.target.checked)}
                />
                Artigo em destaque
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={v.toc}
                  onChange={(e) => update("toc", e.target.checked)}
                />
                Sumário automático
              </label>
              <label>
                Resumo
                <textarea
                  value={v.excerpt}
                  onChange={(e) => update("excerpt", e.target.value)}
                />
              </label>
              <details>
                <summary>Imagem de capa</summary>
                <label>
                  Link do Drive
                  <input
                    value={cover}
                    onChange={(e) => setCover(e.target.value)}
                  />
                </label>
                <label>
                  Texto alternativo
                  <input
                    value={coverAlt}
                    onChange={(e) => setCoverAlt(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const media = await api("media", "POST", {
                        url: cover,
                        alt_text: coverAlt,
                      });
                      update("cover_image_id", media.id);
                      setMessage("Capa selecionada; salve o artigo.");
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  Definir capa
                </button>
                {v.cover_image_id && (
                  <button onClick={() => update("cover_image_id", null)}>
                    Remover capa
                  </button>
                )}
              </details>
            </>
          )}
          <details open>
            <summary>SEO e compartilhamento</summary>
            <label>
              Título SEO
              <input
                value={v.seo_title}
                onChange={(e) => update("seo_title", e.target.value)}
              />
            </label>
            <label>
              Meta description
              <textarea
                value={v.seo_description}
                onChange={(e) => update("seo_description", e.target.value)}
              />
            </label>
            <label>
              Canonical URL
              <input
                value={v.canonical_url}
                onChange={(e) => update("canonical_url", e.target.value)}
              />
            </label>
            <label>
              Imagem social (URL HTTPS)
              <input
                value={v.social_image}
                onChange={(e) => update("social_image", e.target.value)}
              />
            </label>
            {warnings.map((w) => (
              <p className="seo-warning" key={String(w)}>
                ⚑ {w}
              </p>
            ))}
          </details>
          {v.id && (
            <details>
              <summary
                onClick={async () => {
                  try {
                    setRevisions(await api(type + "/" + v.id + "/revisions"));
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Histórico de revisões
              </summary>
              {revisions.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    if (
                      confirm(
                        "Restaurar o conteúdo desta revisão? Salve para confirmar.",
                      )
                    )
                      update("content_json", JSON.parse(r.content_json));
                  }}
                >
                  Restaurar {new Date(r.created_at).toLocaleString("pt-BR")}
                </button>
              ))}
            </details>
          )}
          <p className="small muted">
            Rascunhos: salvamento automático a cada 15 s após título e slug.
            Conteúdo publicado: salve para aplicar alterações.
          </p>
        </aside>
      </div>
    </div>
  );
}
function Categories({ data, reload, onError }: any) {
  const [v, setV] = useState<any>({
    name: "",
    slug: "",
    description: "",
    active: true,
    sort_order: 0,
  });
  return (
    <div className="dashboard-grid">
      <section className="panel">
        {data.map((c: any) => (
          <div className="recent-row" key={c.id}>
            <div>
              <strong>{c.name}</strong>
              <small>
                /{c.slug} · ordem {c.sort_order} ·{" "}
                {c.active ? "Ativa" : "Desativada"}
              </small>
            </div>
            <button onClick={() => setV({ ...c, active: !!c.active })}>
              Editar
            </button>
          </div>
        ))}
      </section>
      <form
        className="panel"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api(
              "categories" + (v.id ? "/" + v.id : ""),
              v.id ? "PUT" : "POST",
              v,
            );
            setV({
              name: "",
              slug: "",
              description: "",
              active: true,
              sort_order: 0,
            });
            reload();
          } catch (e) {
            onError((e as Error).message);
          }
        }}
      >
        <h2>{v.id ? "Editar" : "Nova"} categoria</h2>
        {["name", "slug", "description"].map((key) => (
          <label key={key}>
            {
              ({ name: "Nome", slug: "Slug", description: "Descrição" } as any)[
                key
              ]
            }
            <input
              required={key !== "description"}
              value={v[key]}
              onChange={(e) =>
                setV({
                  ...v,
                  [key]:
                    key === "slug" ? slugify(e.target.value) : e.target.value,
                })
              }
            />
          </label>
        ))}
        <label>
          Ordem
          <input
            type="number"
            min="0"
            max="1000"
            value={v.sort_order}
            onChange={(e) => setV({ ...v, sort_order: Number(e.target.value) })}
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={v.active}
            onChange={(e) => setV({ ...v, active: e.target.checked })}
          />
          Ativa
        </label>
        <button className="primary">Salvar categoria</button>
      </form>
    </div>
  );
}
function Media({ data, reload, onError }: any) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState("");
  const [failed, setFailed] = useState(false);
  return (
    <>
      <form
        className="panel"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("media", "POST", { url, alt_text: alt, caption });
            setUrl("");
            setPreview("");
            reload();
          } catch (e) {
            onError((e as Error).message);
          }
        }}
      >
        <h2>Adicionar do Google Drive</h2>
        <p>
          Envie a imagem ao Drive, compartilhe como leitor público e cole o
          link. Nenhum arquivo é enviado ao servidor.
        </p>
        <label>
          Link público
          <input
            required
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setFailed(false);
              try {
                setPreview(driveImage(e.target.value).display_url);
              } catch {
                setPreview("");
              }
            }}
          />
        </label>
        <label>
          Texto alternativo
          <input value={alt} onChange={(e) => setAlt(e.target.value)} />
        </label>
        <label>
          Legenda
          <input value={caption} onChange={(e) => setCaption(e.target.value)} />
        </label>
        {preview && !failed && (
          <img
            className="media-preview"
            src={preview}
            alt={alt}
            onError={() => setFailed(true)}
          />
        )}
        {failed && (
          <p role="alert">
            A imagem não carregou. Verifique o compartilhamento, o tipo de
            arquivo e os limites do Google Drive.
          </p>
        )}
        <button disabled={!preview} className="primary">
          Salvar referência
        </button>
      </form>
      <div className="media-grid">
        {data.map((m: any) => (
          <article className="panel" key={m.id}>
            <img
              src={m.display_url}
              alt={m.alt_text}
              width="320"
              height="180"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextElementSibling?.removeAttribute("hidden");
              }}
            />
            <p hidden>Imagem indisponível. Verifique o Drive.</p>
            <strong>{m.caption || m.alt_text || "Imagem sem descrição"}</strong>
            <small>{m.file_id}</small>
            <a href={m.original_url} target="_blank" rel="noreferrer">
              Abrir no Drive ↗
            </a>
            <a
              href={
                "https://drive.google.com/uc?export=download&id=" +
                encodeURIComponent(m.file_id)
              }
            >
              Baixar arquivo público ↓
            </a>
          </article>
        ))}
      </div>
    </>
  );
}
function Settings({ initial, saved, onError }: any) {
  const [v, setV] = useState(initial);
  return (
    <form
      className="panel settings-form"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await api("settings", "PUT", v);
          saved();
        } catch (e) {
          onError((e as Error).message);
        }
      }}
    >
      <h2>Identidade e informações</h2>
      {[
        ["name", "Nome do site"],
        ["slogan", "Slogan"],
        ["description", "Descrição global SEO"],
        ["logo", "URL do logotipo aprovado"],
        ["favicon", "URL do favicon"],
        ["contact", "Contato"],
        ["social", "Redes sociais (informação editorial)"],
      ].map(([key, label]) => (
        <label key={key}>
          {label}
          <input
            value={v[key] || ""}
            onChange={(e) => setV({ ...v, [key]: e.target.value })}
          />
        </label>
      ))}
      <p className="muted small">
        A URL principal é definida em SITE_URL no Wrangler. Insira o logotipo
        aprovado; o CMS não cria uma marca substituta.
      </p>
      <label className="check">
        <input
          type="checkbox"
          checked={v.darkMode}
          onChange={(e) => setV({ ...v, darkMode: e.target.checked })}
        />
        Oferecer modo escuro
      </label>
      <h2>Publicidade · Google AdSense</h2>
      <label className="check">
        <input
          type="checkbox"
          checked={v.adsEnabled}
          onChange={(e) => setV({ ...v, adsEnabled: e.target.checked })}
        />
        Habilitar anúncios após consentimento
      </label>
      <label>
        Publisher ID
        <input
          placeholder="ca-pub-0000000000000000"
          value={v.publisher}
          onChange={(e) => setV({ ...v, publisher: e.target.value })}
        />
      </label>
      {[
        ["home", "Página inicial"],
        ["listing", "Listagens"],
        ["start", "Início do artigo"],
        ["middle", "Após o conteúdo principal"],
        ["end", "Final do artigo"],
        ["sidebar", "Sidebar"],
      ].map(([key, label]) => (
        <label key={key}>
          ID do bloco · {label}
          <input
            inputMode="numeric"
            value={v.slots[key] || ""}
            onChange={(e) => {
              const slots = { ...v.slots };
              if (e.target.value) slots[key] = e.target.value;
              else delete slots[key];
              setV({ ...v, slots });
            }}
          />
        </label>
      ))}
      <p className="muted small">
        Campos vazios desativam a posição. Antes de ativar, publique políticas
        revisadas e configure uma CMP certificada quando exigida pelo Google. O
        consentimento básico do CMS não substitui essa CMP.
      </p>
      <button className="primary">Salvar configurações</button>
    </form>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
