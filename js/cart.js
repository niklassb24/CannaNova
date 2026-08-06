// CannaNova — delt kurv-tilstand (localStorage). Bruges af produkt.html
// ("Læg i kurv"), kurv.html, checkout.html og nav-badgen på alle sider.

const Cart = (function () {
  const KEY = "cannanova-cart";

  function get() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function save(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    updateBadge();
  }

  function addItem(item) {
    const items = get();
    const existing = items.find((i) => i.produkt_id === item.produkt_id && i.unit === item.unit);
    if (existing) {
      existing.qty += item.qty;
    } else {
      items.push(item);
    }
    save(items);
  }

  function updateQty(produktId, unit, qty) {
    let items = get();
    if (qty <= 0) {
      items = items.filter((i) => !(i.produkt_id === produktId && i.unit === unit));
    } else {
      const existing = items.find((i) => i.produkt_id === produktId && i.unit === unit);
      if (existing) existing.qty = qty;
    }
    save(items);
  }

  function removeItem(produktId, unit) {
    updateQty(produktId, unit, 0);
  }

  function clear() {
    save([]);
  }

  function count() {
    return get().reduce((sum, i) => sum + i.qty, 0);
  }

  function subtotal() {
    return get().reduce((sum, i) => sum + i.qty * i.price, 0);
  }

  function updateBadge() {
    document.querySelectorAll(".nav-cart").forEach((el) => {
      el.textContent = "Kurv · " + count();
    });
  }

  return { get, save, addItem, updateQty, removeItem, clear, count, subtotal, updateBadge };
})();

document.addEventListener("DOMContentLoaded", Cart.updateBadge);
