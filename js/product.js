// CannaNova — produkt.html: læser ?id= fra URL'en, henter produktet fra
// data/products.json og bygger siden. Genbruger stageProductMarkup/CAT_LABEL
// fra js/site.js (CannaNova-objektet).

(function () {
  const mount = document.getElementById("productDetail");
  if (!mount) return;

  const id = new URLSearchParams(window.location.search).get("id");

  fetch("data/products.json")
    .then((res) => res.json())
    .then((products) => {
      const product = products.find((p) => p.produkt_id === id);
      if (!product) {
        mount.innerHTML = `<p style="padding-block:60px; color:var(--text-dim);">Produktet blev ikke fundet. <a href="produkter.html" style="color:var(--accent);">Se hele sortimentet →</a></p>`;
        document.getElementById("breadcrumbCurrent").textContent = "Ikke fundet";
        return;
      }
      render(product);
    })
    .catch(() => {
      mount.innerHTML = `<p style="padding-block:60px; color:var(--text-dim);">Produktet kunne ikke indlæses lige nu.</p>`;
    });

  function description(p) {
    if (p.kategori === "topskud") {
      return `Håndplukket topskud fra ${p.leverandor}, med oprindelse i ${p.oprindelse}. Lufttørret og trimmet i mindre partier, dokumenteret batch for batch.`;
    }
    if (p.kategori === "hash") {
      return `Presset hash fra ${p.leverandor}, med oprindelse i ${p.oprindelse}.`;
    }
    if (p.kategori === "olie") {
      return p.note ? `${p.note}.` : "Kosmetisk CBD-olie.";
    }
    return "Standardtilbehør til opbevaring og håndtering.";
  }

  function render(p) {
    document.title = `${p.navn} — CannaNova`;
    document.getElementById("breadcrumbCurrent").textContent = p.navn;

    const status = CannaNova.stockStatus(p);
    const sizes = Object.entries(p.priser);
    const hasMultipleSizes = sizes.length > 1;

    const specimenRows = p.thc_pct !== undefined
      ? `<dt>CBD</dt><dd>${p.cbd_pct.toFixed(1).replace(".", ",")}%</dd>
         <dt>THC</dt><dd>${p.thc_pct.toFixed(2).replace(".", ",")}%</dd>
         <dt>Oprindelse</dt><dd>${p.oprindelse}</dd>
         <dt>Batch</dt><dd>${p.batch_nr}</dd>`
      : `<dt>Kategori</dt><dd>${CannaNova.CAT_LABEL[p.kategori] || ""}</dd>`;

    const sizeButtons = sizes.map(([unit, price], i) => `
      <button class="size-btn ${i === 0 ? "is-active" : ""}" data-unit="${unit}" data-price="${price}" type="button">
        ${unit}<span>${price} kr</span>
      </button>
    `).join("");

    const isOut = status === "udsolgt";
    const stockLabel = isOut ? "Udsolgt" : status === "lav" ? "Lav beholdning" : "På lager";
    const stockClass = isOut ? "out" : status === "lav" ? "low" : "ok";

    mount.innerHTML = `
      <div class="product-detail">
        <div class="product-visual">
          ${CannaNova.stageProductMarkup(p.kategori)}
        </div>
        <div class="product-info">
          <p class="eyebrow cat-label">${CannaNova.CAT_LABEL[p.kategori] || ""}</p>
          <h1>${p.navn}</h1>
          <p class="desc">${description(p)}</p>

          <div class="specimen-block">
            <dl>${specimenRows}</dl>
            ${p.lab_rapport_url ? `<a class="lab-link" href="${p.lab_rapport_url}" target="_blank" rel="noopener">Se fuld lab-rapport →</a>` : ""}
          </div>

          ${hasMultipleSizes ? `
            <div class="size-select">
              <h2>Vælg størrelse</h2>
              <div class="size-options" id="sizeOptions">${sizeButtons}</div>
            </div>
          ` : ""}

          <div class="buy-row">
            <p class="buy-price" id="buyPrice">${sizes[0][1]} kr <span>/ ${sizes[0][0]}</span></p>
            <a href="#" class="btn-primary ${isOut ? "is-disabled" : ""}" id="addToCart">${isOut ? "Udsolgt" : "Læg i kurv"}</a>
          </div>
          <p class="stock-note ${stockClass}">${stockLabel}${!isOut ? ` — ${p.lagerantal} stk. tilbage` : ""}</p>

          <p class="legal-note">18+. Sælges som samleobjekt/duftvare — ikke til humant forbrug, rygning eller indtagelse.${p.thc_pct !== undefined ? " Delta-9-THC under 0,2%." : ""}</p>
        </div>
      </div>
    `;

    let selectedUnit = sizes[0][0];
    let selectedPrice = sizes[0][1];

    if (hasMultipleSizes) {
      document.querySelectorAll(".size-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          document.querySelectorAll(".size-btn").forEach((b) => b.classList.remove("is-active"));
          btn.classList.add("is-active");
          selectedUnit = btn.dataset.unit;
          selectedPrice = Number(btn.dataset.price);
          document.getElementById("buyPrice").innerHTML = `${selectedPrice} kr <span>/ ${selectedUnit}</span>`;
        });
      });
    }

    if (!isOut) {
      const addBtn = document.getElementById("addToCart");
      addBtn.addEventListener("click", (e) => {
        e.preventDefault();
        Cart.addItem({
          produkt_id: p.produkt_id,
          navn: p.navn,
          kategori: p.kategori,
          unit: selectedUnit,
          price: selectedPrice,
          qty: 1
        });
        const original = addBtn.textContent;
        addBtn.textContent = "Tilføjet ✓";
        setTimeout(() => { addBtn.textContent = original; }, 1400);
      });
    }
  }
})();
