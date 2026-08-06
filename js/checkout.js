// CannaNova — checkout.html: leveringsformular, reel fødselsdato-baseret
// 18+ kontrol (jf. MASTER-BRIEF-Claude-Code.md afsnit 1), betalingsvalg
// (kun bankoverførsel er reelt aktivt, da der endnu ikke er en betalings-
// gateway-aftale — se afsnit 6), og ordreoversigt.
//
// VIGTIGT: der er ingen backend endnu. "Bekræft ordre" simulerer en
// gennemført ordre i browseren (gemmes i localStorage, kurven tømmes) —
// det er IKKE en rigtig ordre-/betalingsproces. Det kobles til en rigtig
// PHP-backend + betalingsgateway når den del bygges.

(function checkoutPage() {
  const root = document.getElementById("checkoutRoot");
  if (!root) return;

  const FREE_SHIPPING_FROM = 500;
  const SHIPPING_FEE = 49;

  const items = Cart.get();
  if (items.length === 0) {
    window.location.href = "kurv.html";
    return;
  }

  const subtotal = Cart.subtotal();
  const shipping = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;
  const points = Math.floor(subtotal / 100);

  root.innerHTML = `
    <form class="checkout-layout" id="checkoutForm" novalidate>
      <div>
        <div class="checkout-section">
          <h2>Alderskontrol</h2>
          <div class="form-grid">
            <div class="form-field full" id="fieldFodselsdato">
              <label for="fodselsdato">Fødselsdato</label>
              <input type="date" id="fodselsdato" name="fodselsdato" required>
              <p class="form-error">Du skal være 18 år eller derover for at bestille hos CannaNova.</p>
            </div>
          </div>
        </div>

        <div class="checkout-section">
          <h2>Leveringsoplysninger</h2>
          <div class="form-grid">
            <div class="form-field full" id="fieldNavn">
              <label for="navn">Fulde navn</label>
              <input type="text" id="navn" name="navn" autocomplete="name" required>
              <p class="form-error">Udfyld dit fulde navn.</p>
            </div>
            <div class="form-field full" id="fieldEmail">
              <label for="email">E-mail</label>
              <input type="email" id="email" name="email" autocomplete="email" required>
              <p class="form-error">Indtast en gyldig e-mailadresse.</p>
            </div>
            <div class="form-field" id="fieldTelefon">
              <label for="telefon">Telefon (valgfrit)</label>
              <input type="tel" id="telefon" name="telefon" autocomplete="tel">
            </div>
            <div class="form-field" id="fieldPostnr">
              <label for="postnr">Postnummer</label>
              <input type="text" id="postnr" name="postnr" autocomplete="postal-code" inputmode="numeric" required>
              <p class="form-error">Indtast postnummer.</p>
            </div>
            <div class="form-field full" id="fieldAdresse">
              <label for="adresse">Adresse</label>
              <input type="text" id="adresse" name="adresse" autocomplete="street-address" required>
              <p class="form-error">Indtast leveringsadresse.</p>
            </div>
            <div class="form-field full" id="fieldBy">
              <label for="by">By</label>
              <input type="text" id="by" name="by" autocomplete="address-level2" required>
              <p class="form-error">Indtast by.</p>
            </div>
          </div>
        </div>

        <div class="checkout-section">
          <h2>Betaling</h2>
          <div class="payment-options">
            <label class="payment-option is-disabled">
              <input type="radio" name="betaling" value="mobilepay" disabled>
              <span>
                <span class="label">MobilePay Online</span>
                <span class="sub">Kommer snart — betalingsaftale ikke på plads endnu</span>
              </span>
            </label>
            <label class="payment-option is-disabled">
              <input type="radio" name="betaling" value="kort" disabled>
              <span>
                <span class="label">Dankort / Visa</span>
                <span class="sub">Kommer snart — betalingsaftale ikke på plads endnu</span>
              </span>
            </label>
            <label class="payment-option">
              <input type="radio" name="betaling" value="bank" checked>
              <span>
                <span class="label">Bankoverførsel</span>
                <span class="sub">Overførselsoplysninger sendes på e-mail efter bestilling</span>
              </span>
            </label>
          </div>
        </div>
      </div>

      <aside class="checkout-summary">
        <h2>Ordreoversigt</h2>
        ${items.map((i) => `
          <div class="checkout-line">
            <span class="name">${i.navn} (${i.unit}) × ${i.qty}</span>
            <span>${i.price * i.qty} kr</span>
          </div>
        `).join("")}
        <div class="summary-row"><span>Subtotal</span><span>${subtotal} kr</span></div>
        <div class="summary-row"><span>Fragt</span><span>${shipping === 0 ? "Gratis" : shipping + " kr"}</span></div>
        <div class="summary-row total"><span>Total</span><span>${total} kr</span></div>
        <p class="summary-points">Du optjener ${points} point på denne ordre.</p>
        <button type="submit" class="btn-primary" style="display:block; width:100%; text-align:center; margin-top:20px;">Bekræft ordre</button>
      </aside>
    </form>
  `;

  document.getElementById("checkoutForm").addEventListener("submit", onSubmit);

  function onSubmit(e) {
    e.preventDefault();
    clearErrors();

    let valid = true;
    valid = requireField("fodselsdato", "fieldFodselsdato") && valid;
    valid = requireField("navn", "fieldNavn") && valid;
    valid = requireField("email", "fieldEmail") && valid;
    valid = requireField("postnr", "fieldPostnr") && valid;
    valid = requireField("adresse", "fieldAdresse") && valid;
    valid = requireField("by", "fieldBy") && valid;

    const emailInput = document.getElementById("email");
    if (emailInput.value && !/^\S+@\S+\.\S+$/.test(emailInput.value)) {
      showError("fieldEmail");
      valid = false;
    }

    const fodselsdato = document.getElementById("fodselsdato").value;
    if (fodselsdato && calculateAge(fodselsdato) < 18) {
      showError("fieldFodselsdato");
      valid = false;
    }

    if (!valid) {
      const firstError = document.querySelector(".form-field.has-error");
      if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    completeOrder();
  }

  function requireField(id, fieldId) {
    const input = document.getElementById(id);
    if (!input.value.trim()) {
      showError(fieldId);
      return false;
    }
    return true;
  }

  function showError(fieldId) {
    document.getElementById(fieldId).classList.add("has-error");
  }

  function clearErrors() {
    document.querySelectorAll(".form-field.has-error").forEach((f) => f.classList.remove("has-error"));
  }

  function calculateAge(birthDateStr) {
    const today = new Date();
    const birth = new Date(birthDateStr);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  function completeOrder() {
    const orderNumber = "CN" + Math.floor(100000 + Math.random() * 900000);
    const order = {
      orderNumber,
      date: new Date().toISOString(),
      items,
      subtotal,
      shipping,
      total,
      pointsEarned: points,
      customer: {
        navn: document.getElementById("navn").value,
        email: document.getElementById("email").value,
        telefon: document.getElementById("telefon").value,
        adresse: document.getElementById("adresse").value,
        postnr: document.getElementById("postnr").value,
        by: document.getElementById("by").value
      },
      betaling: document.querySelector('input[name="betaling"]:checked').value
    };
    localStorage.setItem("cannanova-last-order", JSON.stringify(order));
    Cart.clear();
    window.location.href = "ordrebekraeftelse.html";
  }
})();
