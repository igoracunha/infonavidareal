import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { extensions } from "./extensions";
import { driveImage, renderDoc, textOf, type DocNode } from "../shared/content";
export default function Editor({
  value,
  onChange,
}: {
  value: DocNode;
  onChange: (v: DocNode) => void;
}) {
  const [mode, setMode] = useState("visual");
  const [mobile, setMobile] = useState(false);
  const [selection, setSelection] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState("");
  const editor = useEditor({
    extensions,
    content: value as any,
    onUpdate: ({ editor }) => onChange(editor.getJSON() as DocNode),
    onSelectionUpdate: ({ editor }) => {
      const n = (editor.state.selection as any).node;
      setSelection(n ? { type: n.type.name, attrs: n.attrs } : null);
    },
  });
  useEffect(() => {
    if (editor && JSON.stringify(editor.getJSON()) !== JSON.stringify(value))
      editor.commands.setContent(value as any, { emitUpdate: false });
  }, [value, editor]);
  if (!editor) return null;
  const command = (name: string, ...args: any[]) => {
    const chain: any = editor.chain().focus();
    if (typeof chain[name] === "function") chain[name](...args).run();
  };
  const button = (label: string, name: string, ...args: any[]) => (
    <button
      type="button"
      key={label}
      title={label}
      onClick={() => command(name, ...args)}
    >
      {label}
    </button>
  );
  const count = textOf(value).trim().split(/\s+/).filter(Boolean).length;
  function attrs(key: string, v: string) {
    if (selection) {
      editor!
        .chain()
        .updateAttributes(selection.type, { [key]: v })
        .run();
      setSelection({ ...selection, attrs: { ...selection.attrs, [key]: v } });
    }
  }
  return (
    <section className="editor-shell">
      <div className="editor-tabs">
        <button
          type="button"
          onClick={() => setMode("visual")}
          aria-pressed={mode === "visual"}
        >
          Visual
        </button>
        <button
          type="button"
          onClick={() => setMode("html")}
          aria-pressed={mode === "html"}
        >
          HTML
        </button>
        <button
          type="button"
          onClick={() => setMode("preview")}
          aria-pressed={mode === "preview"}
        >
          Pré-visualização
        </button>
        <button type="button" onClick={() => setMobile(!mobile)}>
          {mobile ? "Desktop" : "Mobile"}
        </button>
        <small>
          {count} palavras · {Math.max(1, Math.ceil(count / 200))} min
        </small>
      </div>
      {mode === "visual" && (
        <>
          <div className="toolbar" role="toolbar" aria-label="Formatação">
            <select
              aria-label="Estilo do parágrafo"
              onChange={(e) =>
                e.target.value === "p"
                  ? command("setParagraph")
                  : command("toggleHeading", { level: Number(e.target.value) })
              }
            >
              <option value="p">Parágrafo</option>
              {[1, 2, 3, 4, 5, 6].map((v) => (
                <option key={v} value={v}>
                  Título H{v}
                </option>
              ))}
            </select>
            {button("Negrito", "toggleBold")}
            {button("Itálico", "toggleItalic")}
            {button("Sublinhado", "toggleUnderline")}
            {button("Tachado", "toggleStrike")}
            {button("x²", "toggleSuperscript")}
            {button("x₂", "toggleSubscript")}
            <label title="Cor do texto">
              Cor{" "}
              <input
                aria-label="Cor do texto"
                type="color"
                onChange={(e) => command("setColor", e.target.value)}
              />
            </label>
            <label title="Destaque">
              Marca{" "}
              <input
                aria-label="Cor de destaque"
                type="color"
                defaultValue="#a5f3fc"
                onChange={(e) =>
                  command("toggleHighlight", { color: e.target.value })
                }
              />
            </label>
            {["left", "center", "right", "justify"].map((a, i) =>
              button(
                ["Esquerda", "Centro", "Direita", "Justificar"][i],
                "setTextAlign",
                a,
              ),
            )}
            {button("• Lista", "toggleBulletList")}
            {button("1. Lista", "toggleOrderedList")}
            {button("☑ Tarefas", "toggleTaskList")}
            {button(
              "Recuar",
              "sinkListItem",
              editor.isActive("taskItem") ? "taskItem" : "listItem",
            )}
            {button(
              "Reduzir recuo",
              "liftListItem",
              editor.isActive("taskItem") ? "taskItem" : "listItem",
            )}
            {button("Citação", "toggleBlockquote")}
            {button("Divisor", "setHorizontalRule")}
            <button
              type="button"
              onClick={() => {
                const href = prompt("URL do link (https://...)");
                if (href && /^https?:\/\//.test(href))
                  command("setLink", { href });
              }}
            >
              Link
            </button>
            {button("Remover link", "unsetLink")}
            {button("Tabela", "insertTable", {
              rows: 3,
              cols: 3,
              withHeaderRow: true,
            })}
            {button("+ Linha", "addRowAfter")}
            {button("− Linha", "deleteRow")}
            {button("+ Coluna", "addColumnAfter")}
            {button("− Coluna", "deleteColumn")}
            {button("Mesclar células", "mergeCells")}
            {button("Separar células", "splitCell")}
            {button("Excluir tabela", "deleteTable")}
            <select
              aria-label="Linguagem do código"
              defaultValue=""
              onChange={(e) => {
                if (editor.isActive("codeBlock"))
                  command("updateAttributes", "codeBlock", {
                    language: e.target.value,
                  });
                else command("toggleCodeBlock", { language: e.target.value });
              }}
            >
              <option value="" disabled>
                Código…
              </option>
              {[
                "plaintext",
                "javascript",
                "typescript",
                "python",
                "html",
                "css",
                "sql",
                "bash",
                "json",
              ].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            {button("Desfazer", "undo")}
            {button("Refazer", "redo")}
            <button
              type="button"
              onClick={async () => {
                try {
                  command("insertContent", {
                    type: "text",
                    text: await navigator.clipboard.readText(),
                  });
                } catch {
                  alert("Use Ctrl+Shift+V para colar como texto simples.");
                }
              }}
            >
              Colar texto
            </button>
          </div>
          <div className="block-menu">
            <span>Inserir bloco</span>
            {button("✦ Prompt", "insertContent", {
              type: "promptBlock",
              attrs: {
                title: "Novo prompt",
                text: "Escreva seu prompt aqui.",
                description: "",
                instructions: "Copie e adapte ao seu contexto.",
              },
            })}
            {button("① Tutorial", "insertContent", {
              type: "tutorialBlock",
              attrs: {
                title: "Passo a passo",
                steps:
                  '[{"title":"Primeiro passo","description":"Explique o que fazer.","image":"","notes":""}]',
              },
            })}
            {button("ⓘ Aviso", "insertContent", {
              type: "noticeBlock",
              attrs: {
                title: "Dica",
                variant: "tip",
                text: "Uma informação útil.",
              },
            })}
          </div>
          <details className="image-input">
            <summary>Inserir imagem do Google Drive</summary>
            <label>
              Link público
              <input
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImageError("");
                }}
                placeholder="https://drive.google.com/file/d/…/view"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                try {
                  const image = driveImage(imageUrl);
                  const alt =
                    prompt("Texto alternativo (descreva a imagem)") || "";
                  const caption = prompt("Legenda (opcional)") || "";
                  command("setImage", {
                    src: image.display_url,
                    alt,
                    title: caption,
                    caption,
                    original_url: image.original_url,
                    file_id: image.file_id,
                  });
                  setImageUrl("");
                } catch (e) {
                  setImageError((e as Error).message);
                }
              }}
            >
              Adicionar imagem
            </button>
            {imageError && <p role="alert">{imageError}</p>}
            <p>
              O Drive precisa permitir leitura pública. A incorporação pode
              falhar mesmo com o link público.
            </p>
          </details>
          <EditorContent
            editor={editor}
            className={mobile ? "editor-canvas mobile" : "editor-canvas"}
          />
          {selection &&
            ["promptBlock", "noticeBlock", "tutorialBlock", "image"].includes(
              selection.type,
            ) && (
              <aside className="block-properties">
                <h3>Propriedades do bloco selecionado</h3>
                {Object.entries(selection.attrs)
                  .filter(
                    ([k]) =>
                      ![
                        "src",
                        "original_url",
                        "file_id",
                        "height",
                        "steps",
                      ].includes(k),
                  )
                  .map(([k, v]) => (
                    <label key={k}>
                      {(
                        {
                          title: "Título",
                          text: "Texto completo",
                          description: "Descrição",
                          instructions: "Como usar",
                          example: "Exemplo preenchido",
                          variant: "Variante (info, tip, warning, important)",
                          steps:
                            "Etapas em JSON: title, description, image, notes",
                          alt: "Texto alternativo",
                          caption: "Legenda",
                          align: "Alinhamento (left, center, right)",
                          width: "Largura",
                        } as any
                      )[k] || k}
                      <textarea
                        value={String(v ?? "")}
                        onChange={(e) => attrs(k, e.target.value)}
                      />
                    </label>
                  ))}
                {selection.type === "tutorialBlock" && (
                  <TutorialFields
                    value={selection.attrs.steps}
                    onChange={(value) => attrs("steps", value)}
                  />
                )}
                <p>
                  Para mover um bloco, arraste-o pela seleção no editor. Use as
                  setas do teclado para navegar.
                </p>
              </aside>
            )}
        </>
      )}
      {mode === "html" && <pre className="html-view">{renderDoc(value)}</pre>}
      {mode === "preview" && (
        <div
          className={
            mobile ? "prose editor-preview mobile" : "prose editor-preview"
          }
          dangerouslySetInnerHTML={{ __html: renderDoc(value) }}
        />
      )}
    </section>
  );
}

function TutorialFields({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  let steps: Record<string, string>[] = [];
  try {
    const parsed = JSON.parse(value || "[]");
    if (Array.isArray(parsed)) steps = parsed;
  } catch {}
  const edit = (index: number, key: string, value: string) =>
    onChange(
      JSON.stringify(
        steps.map((s, i) => (i === index ? { ...s, [key]: value } : s)),
      ),
    );
  return (
    <section>
      <h4>Etapas do tutorial</h4>
      {steps.map((step, index) => (
        <fieldset key={index}>
          <legend>Etapa {index + 1}</legend>
          {[
            ["title", "Título da etapa"],
            ["description", "Descrição da etapa"],
            ["image", "URL da imagem (opcional)"],
            ["notes", "Observações"],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <textarea
                value={step[key] || ""}
                onChange={(e) => edit(index, key, e.target.value)}
              />
            </label>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange(JSON.stringify(steps.filter((_, i) => i !== index)))
            }
          >
            Remover etapa
          </button>
          {index > 0 && (
            <button
              type="button"
              onClick={() => {
                const reordered = [...steps];
                [reordered[index - 1], reordered[index]] = [
                  reordered[index],
                  reordered[index - 1],
                ];
                onChange(JSON.stringify(reordered));
              }}
            >
              Mover para cima
            </button>
          )}
        </fieldset>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange(
            JSON.stringify([
              ...steps,
              { title: "Nova etapa", description: "", image: "", notes: "" },
            ]),
          )
        }
      >
        + Adicionar etapa
      </button>
    </section>
  );
}
