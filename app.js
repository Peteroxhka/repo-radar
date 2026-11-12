import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, DATABASE_SCHEMA } from "./config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { db: { schema: DATABASE_SCHEMA } });
const $ = (id) => document.getElementById(id);
const CATEGORY_NAMES = {
  all: "Все", programming: "Программирование", tools: "Инструменты", ai: "ИИ",
  data: "Данные", web: "Веб", learning: "Обучение", games: "Игры"
};
let state = { category: "all", language: "" };
let allRows = [];

const formatStars = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
const formatDate = (iso) => new Date(iso).toLocaleDateString("ru-RU");

function renderCategories() {
  $("categories").replaceChildren(...Object.entries(CATEGORY_NAMES).map(([key, label]) => {
    const btn = document.createElement("button");
    btn.className = "chip" + (state.category === key ? " active" : "");
    btn.textContent = label;
    btn.addEventListener("click", () => { state.category = key; renderCategories(); render(); });
    return btn;
  }));
}

function fillLanguages() {
  const langs = [...new Set(allRows.map((r) => r.language).filter(Boolean))].sort();
  for (const lang of langs) {
    const opt = document.createElement("option");
    opt.value = lang; opt.textContent = lang;
    $("language").append(opt);
  }
}

function card(row) {
  const el = document.createElement("article"); el.className = "card";
  const title = document.createElement("a"); title.href = row.html_url; title.target = "_blank"; title.rel = "noopener noreferrer";
  title.className = "card-title"; title.textContent = row.full_name;
  const desc = document.createElement("p"); desc.className = "card-desc"; desc.textContent = row.description || "Без описания";
  const meta = document.createElement("div"); meta.className = "card-meta";
  meta.innerHTML = "";
  const parts = [
    row.language && `<span class="tag">${escapeHtml(row.language)}</span>`,
    `<span>★ ${formatStars(row.stars)}</span>`,
    row.license_spdx && `<span>${escapeHtml(row.license_spdx)}</span>`,
    row.pushed_at && `<span>обновлён ${formatDate(row.pushed_at)}</span>`,
  ].filter(Boolean);
  meta.innerHTML = parts.join("");
  el.append(title, desc, meta);
  return el;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function render() {
  const rows = allRows.filter((r) =>
    (state.category === "all" || r.category === state.category) &&
    (!state.language || r.language === state.language)
  );
  if (!rows.length) { $("grid").innerHTML = '<div class="empty">Ничего не найдено по этим фильтрам.</div>'; return; }
  $("grid").replaceChildren(...rows.map(card));
}

async function load() {
  const { data, error } = await supabase.from("repos")
    .select("id,full_name,description,html_url,language,stars,license_spdx,category,pushed_at")
    .order("stars", { ascending: false }).limit(500);
  if (error) { $("status").textContent = error.message; $("status").classList.add("error"); $("grid").innerHTML = '<div class="empty">Не удалось загрузить ленту.</div>'; return; }
  allRows = data;
  if (!allRows.length) $("status").textContent = "Лента пока пустая: первый сбор ещё не запускался.";
  fillLanguages();
  renderCategories();
  render();
}

$("language").addEventListener("change", (e) => { state.language = e.target.value; render(); });
load();
