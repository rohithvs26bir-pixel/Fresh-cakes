/* Sweet Crumbs – script.js (shared by all pages) */
"use strict";

// Change this to your WhatsApp number: country code + number, digits only.
const WHATSAPP_NUMBER = "910000000000";

const $ = id => document.getElementById(id);
const rupees = n => "₹" + n.toLocaleString("en-IN");

/* ---------- Mobile menu ---------- */
const menuToggle = $("menuToggle");
const navList = $("navList");

function setMenu(open) {
  navList.classList.toggle("open", open);
  menuToggle.setAttribute("aria-expanded", open);
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  menuToggle.textContent = open ? "✕" : "☰";
}
menuToggle.addEventListener("click", () => setMenu(!navList.classList.contains("open")));

/* ---------- Cart (saved in the browser so it follows you between pages) ---------- */
const STORE_KEY = "sweetcrumbs.cart";
let cart = {};   // { "Item name": { price: 650, qty: 2 } }

try {
  const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
  if (saved && typeof saved === "object" && !Array.isArray(saved)) cart = saved;
} catch (e) { /* storage unavailable: the cart lasts for this page only */ }

function saveCart() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(cart)); } catch (e) { /* ignore */ }
  updateCount();
}

function updateCount() {
  const total = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  $("cartCount").textContent = total;
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(message) {
  const t = $("toast");
  t.textContent = message;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

/* ---------- Menu page: Add buttons ---------- */
document.querySelectorAll(".add").forEach(btn => {
  btn.addEventListener("click", () => {
    const name = btn.dataset.name;
    const price = Number(btn.dataset.price);
    if (cart[name]) cart[name].qty += 1;
    else cart[name] = { price, qty: 1 };
    saveCart();
    toast(`${name} added`);
  });
});

/* ---------- Order page ---------- */
const orderList = $("orderList");

function buildWhatsAppLink(names, total) {
  const customer = $("customerName").value.trim();
  const lines = names.map(n => `• ${n} x ${cart[n].qty} = ${rupees(cart[n].price * cart[n].qty)}`);
  const parts = ["Hi Sweet Crumbs, I would like to place an order."];
  if (customer) parts.push(`Name: ${customer}`);
  parts.push("", ...lines, "", `Total: ${rupees(total)}`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(parts.join("\n"))}`;
}

function renderOrder() {
  const names = Object.keys(cart);

  orderList.innerHTML = "";
  names.forEach(name => {
    const { price, qty } = cart[name];
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="name"></span>
      <span class="qty">
        <button type="button" data-action="minus" aria-label="Remove one">−</button>
        <span>${qty}</span>
        <button type="button" data-action="plus" aria-label="Add one">+</button>
      </span>
      <span class="line-price">${rupees(price * qty)}</span>`;
    li.querySelector(".name").textContent = name;
    li.querySelectorAll("button").forEach(b => { b.dataset.name = name; });
    orderList.appendChild(li);
  });

  const total = names.reduce((sum, n) => sum + cart[n].price * cart[n].qty, 0);
  const has = names.length > 0;

  $("orderEmpty").hidden = has;
  $("orderTotal").hidden = !has;
  $("totalValue").textContent = rupees(total);

  const send = $("sendOrder");
  send.classList.toggle("disabled", !has);
  send.setAttribute("aria-disabled", !has);
  send.href = has ? buildWhatsAppLink(names, total) : "order.html";
}

if (orderList) {
  orderList.addEventListener("click", e => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const name = btn.dataset.name;
    if (!cart[name]) return;
    if (btn.dataset.action === "plus") cart[name].qty += 1;
    else if (--cart[name].qty <= 0) delete cart[name];
    saveCart();
    renderOrder();
  });
  $("customerName").addEventListener("input", renderOrder);
  renderOrder();
}

/* ---------- Footer year and cart badge ---------- */
$("year").textContent = new Date().getFullYear();
updateCount();
