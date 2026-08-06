// CannaNova — ordrebekraeftelse.html: viser den senest gennemførte ordre
// (gemt i localStorage af js/checkout.js). Ren front-end-simulation —
// ingen e-mail sendes, da der ikke er en backend endnu.

(function orderConfirmation() {
  const root = document.getElementById("confirmationRoot");
  if (!root) return;

  const raw = localStorage.getItem("cannanova-last-order");
  if (!raw) {
    root.innerHTML = `
      <div class="confirmation">
        <div class="confirmation-header">
          <p class="eyebrow">Ordre</p>
          <h1>Ingen nylig ordre fundet.</h1>
          <p>Vi kan ikke finde en ordre at vise. Har du allerede lukket vinduet, eller ryddet browserdata?</p>
        </div>
        <a href="produkter.html" class="btn-primary" style="display:block; width:100%; text-align:center;">Se sortimentet</a>
      </div>
    `;
    return;
  }

  const order = JSON.parse(raw);

  root.innerHTML = `
    <div class="confirmation">
      <div class="confirmation-header">
        <p class="eyebrow">Tak for din ordre</p>
        <h1>Ordre ${order.orderNumber} er modtaget.</h1>
        <p>En kvitteringsmail sendes til ${order.customer.email} (kræver at e-mail-afsendelse er koblet til en backend — ikke aktivt i denne demo endnu).</p>
      </div>

      <div class="order-box">
        <h2>Varer</h2>
        ${order.items.map((i) => `
          <div class="checkout-line">
            <span class="name">${i.navn} (${i.unit}) × ${i.qty}</span>
            <span>${i.price * i.qty} kr</span>
          </div>
        `).join("")}
        <div class="summary-row"><span>Subtotal</span><span>${order.subtotal} kr</span></div>
        <div class="summary-row"><span>Fragt</span><span>${order.shipping === 0 ? "Gratis" : order.shipping + " kr"}</span></div>
        <div class="summary-row total"><span>Total</span><span>${order.total} kr</span></div>
        <p class="summary-points">Du har optjent ${order.pointsEarned} point på denne ordre.</p>
      </div>

      <div class="order-box">
        <h2>Leveres til</h2>
        <p class="order-meta">
          <strong>${order.customer.navn}</strong><br>
          ${order.customer.adresse}<br>
          ${order.customer.postnr} ${order.customer.by}<br>
          ${order.customer.email}${order.customer.telefon ? " · " + order.customer.telefon : ""}
        </p>
      </div>

      <div class="order-box">
        <h2>Betaling</h2>
        <p class="order-meta">${paymentLabel(order.betaling)}</p>
      </div>

      <a href="produkter.html" class="btn-primary" style="display:block; width:100%; text-align:center; margin-top:26px;">Fortsæt med at handle</a>
    </div>
  `;

  function paymentLabel(value) {
    if (value === "mobilepay") return "MobilePay Online";
    if (value === "kort") return "Dankort / Visa";
    return "Bankoverførsel — overførselsoplysninger sendes på e-mail";
  }
})();
