// CannaNova — kurv.html: render kurvindhold, mængde-styring og opsummering.
// Fragtpris (49 kr) er et PLACEHOLDER indtil der er en rigtig fragtaftale
// (Shipmondo/GLS/PostNord m.fl., jf. MASTER-BRIEF-Claude-Code.md afsnit 7).

(function renderCartPage() {
  const root = document.getElementById("cartRoot");
  if (!root) return;

  const FREE_SHIPPING_FROM = 500;
  const SHIPPING_FEE = 49;

  render();

  function render() {
    const items = Cart.get();

    if (items.length === 0) {
      root.innerHTML = `
        <div class="cart-empty">
          <p>Din kurv er tom.</p>
          <a href="produkter.html" class="btn-primary">Se sortimentet</a>
        </div>
      `;
      return;
    }

    const subtotal = Cart.subtotal();
    const shipping = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
    const total = subtotal + shipping;
    const points = Math.floor(subtotal / 100);

    const lines = items.map((item) => {
      const img = CannaNova.IMG[item.kategori] || "";
      const lineTotal = item.price * item.qty;
      return `
        <div class="cart-line" data-id="${item.produkt_id}" data-unit="${item.unit}">
          <div class="cart-thumb"><img src="${img}" alt=""></div>
          <div class="cart-line-info">
            <h3>${item.navn}</h3>
            <p>${item.unit} · ${item.price} kr/stk.</p>
          </div>
          <div class="cart-line-actions">
            <div class="qty-stepper">
              <button type="button" class="qty-minus" aria-label="Fjern én">−</button>
              <span>${item.qty}</span>
              <button type="button" class="qty-plus" aria-label="Tilføj én">+</button>
            </div>
            <div class="cart-line-total">
              <p class="price">${lineTotal} kr</p>
              <button type="button" class="remove">Fjern</button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    const shippingLabel = shipping === 0 ? "Gratis" : `${shipping} kr`;
    const remaining = FREE_SHIPPING_FROM - subtotal;

    root.innerHTML = `
      <div class="cart-layout">
        <div class="cart-lines">${lines}</div>
        <aside class="cart-summary">
          <h2>Ordreoversigt</h2>
          <div class="summary-row"><span>Subtotal</span><span>${subtotal} kr</span></div>
          <div class="summary-row"><span>Fragt</span><span>${shippingLabel}</span></div>
          ${remaining > 0 ? `<p class="summary-note">Køb for ${remaining} kr mere og få fri fragt.</p>` : ""}
          <div class="summary-row total"><span>Total</span><span>${total} kr</span></div>
          <p class="summary-points">Du optjener ${points} point på denne ordre.</p>
          <a href="checkout.html" class="btn-primary">Gå til checkout</a>
        </aside>
      </div>
    `;

    root.querySelectorAll(".cart-line").forEach((line) => {
      const id = line.dataset.id;
      const unit = line.dataset.unit;
      const item = Cart.get().find((i) => i.produkt_id === id && i.unit === unit);
      if (!item) return;

      line.querySelector(".qty-plus").addEventListener("click", () => {
        Cart.updateQty(id, unit, item.qty + 1);
        render();
      });
      line.querySelector(".qty-minus").addEventListener("click", () => {
        Cart.updateQty(id, unit, item.qty - 1);
        render();
      });
      line.querySelector(".remove").addEventListener("click", () => {
        Cart.removeItem(id, unit);
        render();
      });
    });
  }
})();
