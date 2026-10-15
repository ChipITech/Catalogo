/* ChipIT — catálogo. Datos y contacto se configuran en js/config.js */
"use strict";

const DAY = 86400000;
const $ = s => document.querySelector(s);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = matchMedia("(hover:hover)").matches;

const state = { products: [], cat: "all", brand: "all", q: "", sort: "rec", favs: new Set() };

/* ---------- utilidades ---------- */
const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const norm = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const money = n => "$ " + n.toLocaleString("es-CO");
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const waLink = text => `https://wa.me/${CONFIG.WHATSAPP}?text=${encodeURIComponent(text)}`;
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } }
};

/* ---------- datos ---------- */
function clean(r) {
  const stock = r.stock === null || r.stock === undefined || r.stock === "" ? null : Number(r.stock);
  return {
    id: Number(r.id),
    name: String(r.name ?? "").trim(),
    cat: String(r.cat ?? "").trim(),
    brand: String(r.brand ?? "").trim(),
    spec: String(r.spec ?? "").trim(),
    price: Number(r.price) || 0,
    stock: Number.isNaN(stock) ? null : stock,
    used: norm(r.condicion) === "seminuevo",
    date: r.fecha ? new Date(r.fecha) : null,
    image: String(r.image ?? "").trim()
  };
}

async function fetchJson(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("HTTP " + resp.status);
  return resp.json();
}

async function loadProducts() {
  let rows = null;
  if (CONFIG.SHEET_API_URL && CONFIG.SHEET_API_URL.trim()) {
    try { rows = await fetchJson(CONFIG.SHEET_API_URL); }
    catch (e) { console.error("No se pudo leer Google Sheets, usando copia local:", e); }
  }
  if (!Array.isArray(rows) || !rows.length) {
    try { rows = await fetchJson("data/products.json"); }
    catch (e) { console.error("No se pudo cargar data/products.json", e); rows = []; }
  }
  return rows.map(clean).filter(p => p.name && p.id);
}

/* ---------- reglas de producto ---------- */
const isOut = p => p.stock !== null && p.stock <= 0;
const isLow = p => p.stock !== null && p.stock > 0 && p.stock <= CONFIG.LOW_STOCK;
const isNew = p => p.date && !isNaN(p.date) && (Date.now() - p.date) / DAY <= CONFIG.NEW_DAYS && Date.now() >= p.date;

/* ---------- imágenes ---------- */
function driveImageUrl(raw) {
  if (!raw) return "";
  const url = raw.trim();
  const bareId = /^[a-zA-Z0-9_-]{20,}$/.test(url);
  if (!/drive\.google\.com/.test(url) && !bareId) return url;
  const id = (url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/) || [, bareId ? url : ""])[1];
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w1000` : url;
}

/* Ilustración de respaldo mientras un producto no tiene foto */
function artSvg(cat) {
  const B = "var(--blue)", N = "var(--navy)", C = "var(--cream)", S = "var(--sky)", K = "var(--ink)";
  switch (norm(cat)) {
    case "cargadores":
      return `<svg viewBox="0 0 200 200"><rect x="74" y="26" width="10" height="26" rx="3" fill="${K}"/><rect x="116" y="26" width="10" height="26" rx="3" fill="${K}"/><rect x="52" y="48" width="96" height="112" rx="22" fill="${B}"/><rect x="60" y="56" width="80" height="96" rx="16" fill="none" stroke="${S}" stroke-width="3" opacity=".6"/><rect x="82" y="128" width="36" height="12" rx="6" fill="${N}"/><circle cx="100" cy="92" r="16" fill="${C}"/><path d="m104 80-10 16h8l-6 14 14-18h-8z" fill="${B}"/></svg>`;
    case "cables":
      return `<svg viewBox="0 0 200 200"><path d="M46 150C46 70 150 150 150 66" fill="none" stroke="${N}" stroke-width="8" stroke-linecap="round"/><rect x="34" y="144" width="24" height="34" rx="7" fill="${K}"/><rect x="40" y="170" width="12" height="14" rx="3" fill="${S}"/><rect x="138" y="22" width="24" height="34" rx="7" fill="${K}"/><rect x="144" y="16" width="12" height="12" rx="3" fill="${S}"/></svg>`;
    case "teclados": {
      let keys = "";
      for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++)
        keys += `<rect x="${34 + c * 14.5}" y="${80 + r * 18}" width="11" height="13" rx="3" fill="${r === 2 && c > 1 && c < 7 ? S : C}"/>`;
      return `<svg viewBox="0 0 200 200"><rect x="22" y="64" width="156" height="78" rx="12" fill="${N}"/>${keys}</svg>`;
    }
    case "monitores":
      return `<svg viewBox="0 0 200 200"><rect x="30" y="38" width="140" height="98" rx="10" fill="${K}"/><rect x="38" y="46" width="124" height="82" rx="5" fill="${B}"/><path d="M38 100c30-30 60 6 124-24v52H38z" fill="${S}" opacity=".5"/><rect x="90" y="136" width="20" height="22" fill="${K}"/><rect x="64" y="156" width="72" height="9" rx="4.5" fill="${K}"/></svg>`;
    default:
      return `<svg viewBox="0 0 200 200"><rect x="44" y="44" width="112" height="112" rx="22" fill="${B}"/><rect x="62" y="62" width="76" height="76" rx="12" fill="none" stroke="${C}" stroke-width="5"/><circle cx="100" cy="100" r="14" fill="${C}"/></svg>`;
  }
}

function artHtml(p) {
  const src = driveImageUrl(p.image);
  return src ? `<img class="prod-img" src="${esc(src)}" alt="${esc(p.name)}" loading="lazy" data-cat="${esc(p.cat)}">` : artSvg(p.cat);
}

/* Si una foto no carga (por ejemplo Drive privado) se vuelve a la ilustración */
document.addEventListener("error", e => {
  const img = e.target;
  if (img.tagName === "IMG" && img.classList.contains("prod-img")) img.outerHTML = artSvg(img.dataset.cat);
}, true);

/* ---------- tarjetas ---------- */
function cardHtml(p, i) {
  const fav = state.favs.has(p.id);
  const out = isOut(p);
  const cta = out
    ? `<span class="pill-btn" aria-disabled="true">Sin stock</span>`
    : `<a class="pill-btn pill-blue" href="${waLink(`Hola ChipIT. Quiero cotizar: ${p.name}. ¿Sigue disponible?`)}" target="_blank" rel="noopener">Cotizar</a>`;
  return `<article class="card${out ? " out" : ""}" style="--i:${Math.min(i, 10)}">
  <div class="media">
    <div class="tags">${p.brand ? `<span class="tag brand">${esc(p.brand)}</span>` : ""}${out ? '<span class="tag out">Agotado</span>' : ""}${isNew(p) && !out ? '<span class="tag new">Nuevo</span>' : ""}</div>
    ${isLow(p) ? '<span class="tag low">Quedan pocas unidades</span>' : ""}
    <button class="heart" type="button" data-fav="${p.id}" aria-pressed="${fav}" aria-label="Marcar ${esc(p.name)} como favorito"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button>
    <div class="art" data-view="${p.id}">${artHtml(p)}</div>
    <button class="quick" type="button" data-view="${p.id}">Vista rápida</button>
  </div>
  <div class="info">
    <div class="c">${esc(p.cat)}</div>
    <h3>${esc(p.name)}</h3>
    <p class="spec">${esc(p.spec.split("\n")[0])}</p>
    <div class="buy"><div class="price">${money(p.price)}</div>${cta}</div>
  </div>
</article>`;
}

/* ---------- filtros ---------- */
function applyFilters(items) {
  let a = items.filter(p =>
    (state.cat === "all" || p.cat === state.cat) &&
    (state.brand === "all" || p.brand === state.brand) &&
    (!state.q || norm([p.name, p.brand, p.spec, p.cat].join(" ")).includes(state.q)));
  if (state.sort === "low") a.sort((x, y) => x.price - y.price);
  else if (state.sort === "high") a.sort((x, y) => y.price - x.price);
  else if (state.sort === "az") a.sort((x, y) => x.name.localeCompare(y.name, "es"));
  return a.map((p, i) => ({ p, i })).sort((x, y) => isOut(x.p) - isOut(y.p) || x.i - y.i).map(x => x.p);
}

function renderChips() {
  const cats = [...new Set(state.products.map(p => p.cat).filter(Boolean))];
  $("#chips").innerHTML = ["all", ...cats].map(c =>
    `<button class="chip" type="button" data-cat="${esc(c)}" aria-pressed="${c === state.cat}">${c === "all" ? "Todo" : esc(c)}</button>`).join("");
}

/* Las marcas disponibles dependen de la categoría elegida */
function renderBrands() {
  const inCat = state.products.filter(p => state.cat === "all" || p.cat === state.cat);
  const brands = [...new Set(inCat.map(p => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
  if (state.brand !== "all" && !brands.includes(state.brand)) state.brand = "all";
  $("#brand").innerHTML = `<option value="all">Todas las marcas</option>` +
    brands.map(b => `<option value="${esc(b)}"${b === state.brand ? " selected" : ""}>${esc(b)}</option>`).join("");
}

function renderGrid(gridId, countId, items, emptyHtml) {
  $(countId).textContent = plural(items.length, "producto");
  $(gridId).innerHTML = items.length ? items.map(cardHtml).join("") : emptyHtml;
}

function render() {
  const main = applyFilters(state.products.filter(p => !p.used));
  const used = applyFilters(state.products.filter(p => p.used));
  const filtering = state.cat !== "all" || state.brand !== "all" || state.q;

  renderGrid("#grid", "#count", main,
    `<div class="empty"><b>Sin resultados</b>Prueba con otra palabra o quita el filtro de categoría.</div>`);
  renderGrid("#gridUsed", "#countUsed", used, "");

  const hasUsed = state.products.some(p => p.used);
  $("#seminuevos").hidden = !hasUsed || (filtering && !used.length);
  document.querySelector('.links a[href="#seminuevos"]').hidden = !hasUsed;
}

/* ---------- vista rápida ---------- */
function openView(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  const out = isOut(p);
  $("#dm").innerHTML = `<button class="x" type="button" data-close aria-label="Cerrar">×</button>
  <div class="media"><div class="art" style="width:70%;height:70%;margin-top:0">${artHtml(p)}</div></div>
  <div class="m-body">
    <div style="color:var(--steel);font-weight:600">${esc(p.cat)}${p.brand ? " · " + esc(p.brand) : ""}</div>
    <h3 id="dn">${esc(p.name)}</h3>
    <p>${esc(p.spec)}</p>
    ${isLow(p) ? '<span class="tag low" style="align-self:flex-start">Quedan pocas unidades</span>' : ""}
    <div class="price">${money(p.price)}</div>
    ${out
      ? '<span class="pill-btn" style="background:var(--sand);color:var(--muted);align-self:flex-start">Agotado por ahora</span>'
      : `<a class="pill-btn pill-blue" href="${waLink(`Hola ChipIT. Estoy interesado en ${p.name}. ¿Me confirman disponibilidad?`)}" target="_blank" rel="noopener">Consultar por WhatsApp</a>`}
  </div>`;
  $("#dlg").showModal();
}

/* ---------- favoritos ---------- */
function bump(el) { el.classList.remove("bump", "pop"); void el.offsetWidth; el.classList.add(el.classList.contains("heart") ? "pop" : "bump"); }
function toggleFav(id) {
  state.favs.has(id) ? state.favs.delete(id) : state.favs.add(id);
  store.set("chipit-favs", [...state.favs]);
  document.querySelectorAll(`[data-fav="${id}"]`).forEach(b => { b.setAttribute("aria-pressed", state.favs.has(id)); bump(b); });
  updateFavCount(true);
}
function updateFavCount(animate) {
  $("#favN").textContent = state.favs.size;
  if (animate) bump($("#favBox"));
}

/* ---------- eventos ---------- */
document.addEventListener("click", e => {
  const t = e.target;
  const chip = t.closest("[data-cat]");
  if (chip) { state.cat = chip.dataset.cat; renderChips(); renderBrands(); render(); return; }
  const fav = t.closest("[data-fav]");
  if (fav) { toggleFav(Number(fav.dataset.fav)); return; }
  const view = t.closest("[data-view]");
  if (view) { openView(Number(view.dataset.view)); return; }
  if (t === $("#dlg") || t.closest("[data-close]")) $("#dlg").close();
});

$("#q").addEventListener("input", e => { state.q = norm(e.target.value); render(); });
$("#brand").addEventListener("change", e => { state.brand = e.target.value; render(); });
$("#sort").addEventListener("change", e => { state.sort = e.target.value; render(); });

$("#share").addEventListener("click", async () => {
  const btn = $("#share"), label = btn.innerHTML;
  try {
    if (navigator.share) await navigator.share({ title: "Catálogo ChipIT", text: "Mira el catálogo de ChipIT.", url: location.href });
    else { await navigator.clipboard.writeText(location.href); btn.textContent = "✓ Enlace copiado"; }
  } catch { /* cancelado o sin permiso */ }
  setTimeout(() => { btn.innerHTML = label; }, 1800);
});

/* ---------- movimiento: scroll, inclinación y parallax del hero ---------- */
function setupMotion() {
  const header = $("header"), toTop = $("#toTop");
  addEventListener("scroll", () => {
    header.classList.toggle("scrolled", scrollY > 10);
    toTop.classList.toggle("on", scrollY > 700);
  }, { passive: true });
  toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

  if (reduceMotion || !canHover) return;

  document.addEventListener("pointermove", e => {
    const m = e.target.closest && e.target.closest(".card .media");
    if (!m) return;
    const r = m.getBoundingClientRect(), a = m.querySelector(".art");
    a.style.setProperty("--ry", ((e.clientX - r.left) / r.width - .5) * 18);
    a.style.setProperty("--rx", -((e.clientY - r.top) / r.height - .5) * 18);
    a.style.setProperty("--sc", 1.08);
  });
  document.addEventListener("pointerout", e => {
    const m = e.target.closest && e.target.closest(".card .media");
    if (!m || m.contains(e.relatedTarget)) return;
    const a = m.querySelector(".art");
    a.style.setProperty("--ry", 0); a.style.setProperty("--rx", 0); a.style.setProperty("--sc", 1);
  });

  const hero = $("#hero");
  hero.addEventListener("pointermove", e => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty("--mx", ((e.clientX - r.left) / r.width - .5) * 2);
    hero.style.setProperty("--my", ((e.clientY - r.top) / r.height - .5) * 2);
  });
}

/* ---------- arranque ---------- */
(async function init() {
  $("#heroWa").href = waLink("Hola ChipIT, quiero conocer el catálogo.");
  $("#footWa").href = `https://wa.me/${CONFIG.WHATSAPP}`;
  $("#footWa").textContent = "WhatsApp " + CONFIG.WHATSAPP_LABEL;
  $("#mlBtn").href = $("#footMl").href = CONFIG.MERCADOLIBRE_URL;

  ["Cargadores", "Cables", "Teclados", "Monitores"].forEach((c, i) => { $("#h" + (i + 1)).innerHTML = artSvg(c); });

  (store.get("chipit-favs") || []).forEach(id => state.favs.add(Number(id)));
  updateFavCount(false);
  setupMotion();

  state.products = await loadProducts();
  const ids = new Set(state.products.map(p => p.id));
  state.favs.forEach(id => ids.has(id) || state.favs.delete(id));
  updateFavCount(false);
  renderChips();
  renderBrands();
  render();
})();
