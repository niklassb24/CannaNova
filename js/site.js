// CannaNova — delt site-adfærd: tema-skift (lys/mørk), mobilmenu, og
// produktkort-rendering. Kort-skabelonen (stage-product med glow+refleksion
// i mørkt / skygge i lyst) genbruges af forsiden, kataloget og produktsiden.

const CannaNova = (function () {
  const CAT_CLASS = { topskud: "cat-topskud", hash: "cat-hash", olie: "cat-olie", tilbehor: "cat-tilbehor" };
  const CAT_LABEL = { topskud: "Topskud", hash: "Hash", olie: "Olie", tilbehor: "Tilbehør" };
  const IMG = {
    topskud: "images/topskud.svg",
    hash: "images/hash.svg",
    olie: "images/olie.svg",
    tilbehor: "images/tilbehor.svg"
  };

  function stockStatus(p) {
    if (p.lagerantal <= 0) return "udsolgt";
    if (p.lagerantal <= p.mindstebeholdning) return "lav";
    return "paa-lager";
  }

  function lowestPrice(priser) {
    return Math.min(...Object.values(priser));
  }

  function stageProductMarkup(kategori, extraClass) {
    const img = IMG[kategori];
    const catClass = CAT_CLASS[kategori] || "";
    return `
      <div class="stage-product ${catClass} ${extraClass || ""}">
        <div class="glow"></div>
        <img class="art" src="${img}" alt="">
        <img class="reflection" src="${img}" alt="">
        <div class="shadow"></div>
      </div>
    `;
  }

  function renderCard(p) {
    const status = stockStatus(p);
    const price = lowestPrice(p.priser);
    const unit = Object.keys(p.priser)[0];
    const multiSize = Object.keys(p.priser).length > 1;

    const flag =
      status === "udsolgt" ? '<p class="stock-flag">Udsolgt</p>' :
      status === "lav" ? '<p class="stock-flag">Lav beholdning</p>' : "";

    const dataLine = p.thc_pct !== undefined
      ? `<span>THC ${p.thc_pct.toFixed(2).replace(".", ",")}%</span><span>CBD ${p.cbd_pct.toFixed(1).replace(".", ",")}%</span><span>Batch ${p.batch_nr}</span>`
      : `<span>${CAT_LABEL[p.kategori] || ""}</span>`;

    const cardClasses = "card" + (status === "udsolgt" ? " is-out" : "");
    const linkLabel = status === "udsolgt" ? "Udsolgt" : "Se →";

    return `
      <article class="${cardClasses}">
        ${stageProductMarkup(p.kategori)}
        ${flag}
        <h3>${p.navn}</h3>
        <p class="card-data">${dataLine}</p>
        <div class="card-foot">
          <p class="card-price">${multiSize ? "fra " : ""}${price} kr <span>/ ${unit}</span></p>
          <a href="produkt.html?id=${encodeURIComponent(p.produkt_id)}" class="card-link">${linkLabel}</a>
        </div>
      </article>
    `;
  }

  return { CAT_CLASS, CAT_LABEL, IMG, stockStatus, lowestPrice, stageProductMarkup, renderCard };
})();

(function themeToggle() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = current;
    localStorage.setItem("cannanova-theme", current);
  });
})();

(function mobileNav() {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("siteNav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
})();

(function renderFeaturedProducts() {
  const mount = document.getElementById("stageProducts");
  if (!mount) return;

  const FEATURED_IDS = [
    "top-mellow-haze", "top-nordisk-frost", "top-solkyst",
    "hash-nordisk-presse", "hash-rav-nr-3", "olie-cbd-10",
    "tilbehor-grinder", "tilbehor-opbevaring"
  ];

  fetch("data/products.json")
    .then((res) => res.json())
    .then((products) => {
      const byId = new Map(products.map((p) => [p.produkt_id, p]));
      const items = FEATURED_IDS.map((id) => byId.get(id)).filter(Boolean);
      mount.innerHTML = items.map(CannaNova.renderCard).join("");
    })
    .catch(() => { mount.innerHTML = "<p>Produkterne kunne ikke indlæses lige nu.</p>"; });
})();

(function renderCatalog() {
  // Genbruges af produkter.html (alle produkter + filterknapper) OG de
  // fire kategori-sider (topskud/hash/olie/tilbehor.html — låst kategori
  // via data-category på mount-elementet, ingen filterknapper). Begge
  // understøtter et valgfrit søgefelt (#productSearch) der filtrerer
  // det der allerede vises.
  const mount = document.getElementById("catalogGrid");
  if (!mount) return;

  const fixedCategory = mount.dataset.category || null;
  const searchInput = document.getElementById("productSearch");
  let allProducts = [];
  let activeCategory = fixedCategory || "alle";

  fetch("data/products.json")
    .then((res) => res.json())
    .then((products) => {
      allProducts = products;
      render();
    })
    .catch(() => { mount.innerHTML = "<p>Produkterne kunne ikke indlæses lige nu.</p>"; });

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      activeCategory = btn.dataset.filter;
      render();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", render);
  }

  function render() {
    let items = activeCategory === "alle" ? allProducts : allProducts.filter((p) => p.kategori === activeCategory);
    const term = searchInput ? searchInput.value.trim().toLowerCase() : "";
    if (term) {
      items = items.filter((p) => p.navn.toLowerCase().includes(term));
    }
    mount.innerHTML = items.length
      ? items.map(CannaNova.renderCard).join("")
      : `<p style="color:var(--text-dim);">${term ? `Ingen produkter matcher "${term}".` : "Ingen produkter i denne kategori lige nu."}</p>`;
  }
})();

(function headerSearch() {
  // Søgefunktion i menulinjen — findes på alle sider via #searchToggle.
  const toggle = document.getElementById("searchToggle");
  if (!toggle) return;

  let allProducts = null;
  let overlay, input, results;

  toggle.addEventListener("click", async () => {
    if (!overlay) buildModal();
    overlay.classList.add("is-visible");
    input.focus();
    if (!allProducts) {
      try {
        const res = await fetch("data/products.json");
        allProducts = await res.json();
      } catch (e) {
        allProducts = [];
      }
    }
  });

  function buildModal() {
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modal-overlay" id="searchModal" role="dialog" aria-modal="true" aria-labelledby="searchModalTitle">
        <div class="modal-card">
          <h2 id="searchModalTitle">Søg i sortimentet</h2>
          <input type="search" id="searchInput" class="search-input" placeholder="Søg efter produktnavn …">
          <div class="search-results" id="searchResults"></div>
          <div class="modal-actions"><button class="btn-ghost" id="searchClose" type="button">Luk</button></div>
        </div>
      </div>
    `);
    overlay = document.getElementById("searchModal");
    input = document.getElementById("searchInput");
    results = document.getElementById("searchResults");

    input.addEventListener("input", renderResults);
    document.getElementById("searchClose").addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
  }

  function closeModal() {
    overlay.classList.remove("is-visible");
  }

  function renderResults() {
    const term = input.value.trim().toLowerCase();
    if (!term) { results.innerHTML = ""; return; }
    const matches = (allProducts || []).filter((p) => p.navn.toLowerCase().includes(term)).slice(0, 8);
    results.innerHTML = matches.length
      ? matches.map((p) => `
          <a href="produkt.html?id=${encodeURIComponent(p.produkt_id)}" class="search-result">
            <img src="${CannaNova.IMG[p.kategori]}" alt="">
            <span class="name">${p.navn}</span>
            <span class="price">${CannaNova.lowestPrice(p.priser)} kr</span>
          </a>
        `).join("")
      : `<p class="search-empty">Ingen produkter matcher "${term}".</p>`;
  }
})();
