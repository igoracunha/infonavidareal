import "../styles/public.css";
import hljs from "highlight.js/lib/common";
import "highlight.js/styles/github-dark.css";
document
  .querySelector("[data-local-login]")
  ?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const token = (document.querySelector("[name=token]") as HTMLInputElement)
      .value;
    const r = await fetch("/api/local-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (r.ok) location.href = "/admin";
    else toast("Token local inválido.");
  });
export async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}
function toast(message: string) {
  const t = document.querySelector(".toast");
  if (t) {
    t.textContent = message;
    t.classList.add("visible");
    setTimeout(() => t.classList.remove("visible"), 3000);
  }
}
document.addEventListener("click", async (event) => {
  const target = (event.target as Element).closest("button");
  if (!target) return;
  try {
    if (target.hasAttribute("data-copy-prompt")) {
      await copyText(
        target.closest(".prompt-block")?.querySelector("[data-prompt-text]")
          ?.textContent || "",
      );
      toast("Prompt copiado!");
    }
    if (target.hasAttribute("data-copy-code")) {
      await copyText(
        target.closest(".code-block")?.querySelector("code")?.textContent || "",
      );
      toast("Código copiado!");
    }
    if (target.hasAttribute("data-share")) {
      if (navigator.share)
        await navigator.share({ title: document.title, url: location.href });
      else {
        await copyText(location.href);
        toast("Link copiado!");
      }
    }
    if (target.hasAttribute("data-theme")) {
      document.documentElement.classList.toggle("dark");
      localStorage.setItem(
        "info-theme",
        document.documentElement.classList.contains("dark") ? "dark" : "light",
      );
    }
    if (target.hasAttribute("data-cookie-settings"))
      document
        .querySelector<HTMLElement>("[data-consent]")
        ?.removeAttribute("hidden");
    if (target.hasAttribute("data-accept-ads")) {
      localStorage.setItem("info-ads-consent", "accepted");
      loadAds();
      document.querySelector("[data-consent]")?.setAttribute("hidden", "");
    }
    if (target.hasAttribute("data-reject-ads")) {
      localStorage.setItem("info-ads-consent", "rejected");
      location.reload();
    }
  } catch {
    toast("Não foi possível copiar. Selecione o texto e copie manualmente.");
  }
});
export function imageFailure(image: HTMLImageElement) {
  const replacement = document.createElement("div");
  replacement.className = "image-failure";
  replacement.setAttribute("role", "img");
  replacement.setAttribute("aria-label", image.alt || "Imagem indisponível");
  replacement.textContent =
    "Imagem indisponível. Verifique o compartilhamento público no Google Drive.";
  image.replaceWith(replacement);
}
document.querySelectorAll("img").forEach((image) => {
  image.addEventListener("error", () => imageFailure(image));
  if (image.complete && !image.naturalWidth) imageFailure(image);
});
document
  .querySelectorAll<HTMLElement>("pre code")
  .forEach((code) => hljs.highlightElement(code));
try {
  if (localStorage.getItem("info-theme") === "dark")
    document.documentElement.classList.add("dark");
  if (localStorage.getItem("info-ads-consent") === "accepted") loadAds();
  else if (!localStorage.getItem("info-ads-consent"))
    document.querySelector("[data-consent]")?.removeAttribute("hidden");
} catch {}
function loadAds() {
  const slots = document.querySelectorAll<HTMLElement>("[data-ad-client]");
  if (!slots.length || document.querySelector("[data-ad-script]")) return;
  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.dataset.adScript = "";
  script.src =
    "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
    slots[0].dataset.adClient;
  document.head.appendChild(script);
  slots.forEach((slot) => {
    const ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "block";
    ins.dataset.adClient = slot.dataset.adClient;
    ins.dataset.adSlot = slot.dataset.adSlot;
    ins.dataset.adFormat = "auto";
    ins.dataset.fullWidthResponsive = "true";
    slot.replaceChildren(ins);
    ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
  });
}
