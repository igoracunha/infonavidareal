// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderDoc } from "../src/shared/content";
import { copyText, imageFailure } from "../src/public/main";

describe("Interações públicas no DOM", () => {
  it("copia o prompt completo preservando quebras e indentação", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    const text = "Primeira linha\n  Segunda linha\nTerceira linha";
    document.body.innerHTML =
      renderDoc({
        type: "doc",
        content: [{ type: "promptBlock", attrs: { title: "Teste", text } }],
      }) + '<div class="toast" role="status"></div>';
    document.querySelector<HTMLButtonElement>("[data-copy-prompt]")!.click();
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith(text));
    await vi.waitFor(() =>
      expect(document.querySelector(".toast")!.textContent).toBe(
        "Prompt copiado!",
      ),
    );
    await copyText("  código\n    indentado");
    expect(writeText).toHaveBeenLastCalledWith("  código\n    indentado");
  });
  it("substitui imagem indisponível por explicação acessível", () => {
    document.body.innerHTML =
      '<figure><img src="https://drive.google.com/thumbnail?id=invalid" alt="Passo inicial"></figure>';
    imageFailure(document.querySelector("img")!);
    expect(document.querySelector("img")).toBeNull();
    const fallback = document.querySelector("[role=img]")!;
    expect(fallback.getAttribute("aria-label")).toBe("Passo inicial");
    expect(fallback.textContent).toContain("compartilhamento público");
  });
});
