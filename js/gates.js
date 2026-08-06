// CannaNova — 18+ alderskontrol og cookie-samtykke, kører på alle sider.
// "Nej" til alderskontrollen sender besøgende væk fra sitet, ikke bare en
// lukket dialog de kan omgå. Dette er branche-signal/adfærdsspærre, ikke
// en juridisk alderskontrol — den reelle validering (fødselsdato) sker ved
// checkout, jf. MASTER-BRIEF-Claude-Code.md afsnit 1.

(function ageGateAndCookies() {
  const AGE_KEY = "cannanova-age-verified";
  const COOKIE_KEY = "cannanova-cookie-consent";

  if (localStorage.getItem(AGE_KEY) === "true") {
    showCookieBanner();
    return;
  }

  document.body.insertAdjacentHTML("beforeend", `
    <div class="age-gate is-visible" id="ageGate" role="dialog" aria-modal="true" aria-labelledby="ageGateTitle">
      <div class="age-gate-card">
        <p class="logo">Canna<em>Nova</em></p>
        <h2 id="ageGateTitle">Er du 18 år eller derover?</h2>
        <p>CannaNova sælger aldersbegrænsede produkter. Du skal bekræfte din alder for at besøge sitet.</p>
        <div class="age-gate-actions">
          <button class="btn-primary" id="ageYes" type="button">Ja, jeg er 18+</button>
          <button class="btn-ghost" id="ageNo" type="button">Nej, jeg er ikke 18+</button>
        </div>
      </div>
    </div>
  `);

  document.getElementById("ageYes").addEventListener("click", () => {
    localStorage.setItem(AGE_KEY, "true");
    const gate = document.getElementById("ageGate");
    if (gate) gate.remove();
    showCookieBanner();
  });

  document.getElementById("ageNo").addEventListener("click", () => {
    window.location.href = "https://www.google.dk";
  });

  function showCookieBanner() {
    if (localStorage.getItem(COOKIE_KEY)) return;
    document.body.insertAdjacentHTML("beforeend", `
      <div class="cookie-banner is-visible" id="cookieBanner">
        <div class="wrap">
          <p>Vi bruger cookies til at få sitet til at fungere og forstå brugen af det. Læs mere i vores <a href="privatlivspolitik.html">privatlivspolitik</a>.</p>
          <div class="cookie-banner-actions">
            <button class="btn-ghost" id="cookieSettingsBtn" type="button">Cookieindstillinger</button>
            <button class="btn-primary" id="cookieAccept" type="button">Accepter alle</button>
          </div>
        </div>
      </div>
    `);

    document.getElementById("cookieAccept").addEventListener("click", () => {
      saveConsent({ nodvendige: true, statistik: true, marketing: true });
      closeBanner();
    });
    document.getElementById("cookieSettingsBtn").addEventListener("click", showCookieSettings);
  }

  function showCookieSettings() {
    if (!document.getElementById("cookieSettingsModal")) {
      document.body.insertAdjacentHTML("beforeend", `
        <div class="modal-overlay" id="cookieSettingsModal" role="dialog" aria-modal="true" aria-labelledby="cookieSettingsTitle">
          <div class="modal-card">
            <h2 id="cookieSettingsTitle">Cookieindstillinger</h2>
            <p>Vælg hvilke typer cookies vi må bruge. Du kan ændre dit valg når som helst i footeren.</p>

            <div class="cookie-category">
              <div>
                <p class="name">Nødvendige</p>
                <p class="desc">Kræves for at sitet fungerer — fx kurv og alderskontrol. Kan ikke fravælges.</p>
              </div>
              <input type="checkbox" checked disabled>
            </div>
            <div class="cookie-category">
              <div>
                <p class="name">Statistik</p>
                <p class="desc">Hjælper os forstå hvordan sitet bliver brugt, så vi kan forbedre det.</p>
              </div>
              <input type="checkbox" id="cookieStatistik" checked>
            </div>
            <div class="cookie-category">
              <div>
                <p class="name">Markedsføring</p>
                <p class="desc">Bruges til at måle effekten af indhold og kampagner.</p>
              </div>
              <input type="checkbox" id="cookieMarketing">
            </div>

            <div class="modal-actions">
              <button class="btn-ghost" id="cookieSaveSelection" type="button">Gem valg</button>
              <button class="btn-primary" id="cookieAcceptAllInModal" type="button">Accepter alle</button>
            </div>
          </div>
        </div>
      `);
      document.getElementById("cookieSaveSelection").addEventListener("click", () => {
        saveConsent({
          nodvendige: true,
          statistik: document.getElementById("cookieStatistik").checked,
          marketing: document.getElementById("cookieMarketing").checked
        });
        closeBanner();
        document.getElementById("cookieSettingsModal").classList.remove("is-visible");
      });
      document.getElementById("cookieAcceptAllInModal").addEventListener("click", () => {
        saveConsent({ nodvendige: true, statistik: true, marketing: true });
        closeBanner();
        document.getElementById("cookieSettingsModal").classList.remove("is-visible");
      });
    }
    document.getElementById("cookieSettingsModal").classList.add("is-visible");
  }

  function saveConsent(consent) {
    localStorage.setItem(COOKIE_KEY, JSON.stringify(consent));
  }

  function closeBanner() {
    const banner = document.getElementById("cookieBanner");
    if (banner) banner.remove();
  }
})();

