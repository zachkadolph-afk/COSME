// Builds print/cosme-starter-cards.pdf: 4 double-sided letter sheets, 9 cards per sheet.
// Page order is front, back, front, back... Print double-sided, flip on the long edge.
// Run: npx tsx scripts/make-print-sheets.ts
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { STARTER_CARDS } from "../src/lib/starter-cards";
import { COMMUNITY_TOTAL, TYPE_INFO, makeSpots, weaknessesOf, type CardType } from "../src/lib/game";

const require = createRequire(import.meta.url);
const font = (p: string) => readFileSync(resolve("node_modules/@fontsource", p)).toString("base64");
const img = (p: string) => "data:image/jpeg;base64," + readFileSync(resolve(p)).toString("base64");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fmt = (n: number) => n.toLocaleString("en-US");

const icon = (t: CardType, size: number, stroke = "#0A0A0F", width = 2.4) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"><path d="${TYPE_INFO[t].icon}"/></svg>`;

const rings = `<g fill="none" stroke-width="15"><ellipse rx="285" ry="70" stroke="#3B82F6"/><ellipse rx="252" ry="60" stroke="#8B5CF6"/><ellipse rx="220" ry="50" stroke="#FFD23F"/><ellipse rx="190" ry="40" stroke="#FF8A3D"/></g>`;
const logo = (w: number) => `
<svg width="${w}" height="${w * 0.8}" viewBox="20 90 580 330">
  <defs><clipPath id="front" clipPathUnits="userSpaceOnUse"><rect x="-400" y="0" width="800" height="400"/></clipPath>
  <radialGradient id="pl" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#FFC266"/><stop offset=".55" stop-color="#FF7A1A"/><stop offset="1" stop-color="#B8410A"/></radialGradient></defs>
  <g transform="translate(310 250) rotate(-18)">${rings}</g>
  <circle cx="310" cy="250" r="140" fill="url(#pl)" stroke="#0A0A0F" stroke-width="6"/>
  <polygon points="345,110 255,262 305,262 268,392 372,226 318,226 368,110" fill="#FFD23F" stroke="#0A0A0F" stroke-width="9" stroke-linejoin="round"/>
  <g transform="translate(310 250) rotate(-18)" clip-path="url(#front)">${rings}</g>
</svg>`;

function front(c: (typeof STARTER_CARDS)[number]) {
  const total = c.total ?? COMMUNITY_TOTAL;
  const s = makeSpots(`cosme-starter-${c.number}-${c.name}`, total); // same numbers as the website
  const weak = c.weaknesses ?? weaknessesOf(c.type);
  const color = TYPE_INFO[c.type].color;
  const rarity = c.rarity ?? "common";
  const border = rarity === "shiny" ? "linear-gradient(150deg,#FFD23F,#FF8A3D 35%,#8B5CF6 70%,#3B82F6)" : rarity === "rare" ? `linear-gradient(150deg,#E5E7EB,${color} 45%,#E5E7EB)` : color;
  const spot = (i: number, cls: string) => `<span class="spot ${cls}">${fmt(s[i])}</span>`;
  return `
  <div class="card" style="background:${border}">
    <div class="inner">
      ${spot(0, "tl")}${spot(1, "t")}${spot(2, "tr")}${spot(3, "r")}${spot(4, "br")}${spot(5, "b")}${spot(6, "bl")}${spot(7, "l")}
      <div class="frame" style="border-color:${color}">
        <div class="head">
          <span class="name">${esc(c.name)}</span>
          <span class="hp"><span style="color:${color}">${fmt(total)}</span><span class="badge" style="background:${color}">${icon(c.type, 10)}</span></span>
        </div>
        <img class="art" src="${img(c.art!.replace("/cards/", "print/art/"))}">
        <div class="move">
          <b>${esc(c.move)}</b>
          <span class="desc">${esc(c.description)}</span>
          <span class="weak">Weak to ${weak.map((w) => `<span class="mini" style="background:${TYPE_INFO[w as CardType].color}">${icon(w as CardType, 7)}</span>${w}`).join(" ")}</span>
        </div>
        <div class="foot"><span>${rarity === "common" ? c.type.toUpperCase() : rarity.toUpperCase() + " · " + c.type.toUpperCase()}</span><span>#${String(c.number).padStart(3, "0")}</span></div>
      </div>
    </div>
  </div>`;
}

// The back must look the same upside down, or players could tell which edge is which
// before they flip. So it uses a perfectly symmetric planet (no bolt, rings fully in front)
// and COSME printed both ways up.
const symmetricPlanet = (w: number) => `
<svg width="${w}" height="${w * 0.6}" viewBox="0 100 620 300">
  <circle cx="310" cy="250" r="120" fill="#FF7A1A" stroke="#0A0A0F" stroke-width="6"/>
  <circle cx="310" cy="250" r="78" fill="none" stroke="#FFB061" stroke-width="10" opacity=".55"/>
  <g transform="translate(310 250) rotate(-18)">${rings}</g>
</svg>`;

function back() {
  return `
  <div class="card back">
    <div class="backin">
      <div class="word flip">COSME</div>
      <div class="emblem"><div class="logo">${symmetricPlanet(170)}</div></div>
      <div class="word">COSME</div>
    </div>
  </div>`;
}

const marks = () => {
  const xs = [0.5, 3.0, 5.5, 8.0], ys = [0.25, 3.75, 7.25, 10.75];
  return [
    ...xs.map((x) => `<i class="mk v" style="left:${x}in;top:0"></i><i class="mk v" style="left:${x}in;bottom:0"></i>`),
    ...ys.map((y) => `<i class="mk h" style="top:${y}in;left:0"></i><i class="mk h" style="top:${y}in;right:0"></i>`),
  ].join("");
};

const pages: string[] = [];
for (let sheet = 0; sheet < 4; sheet++) {
  const nine = STARTER_CARDS.slice(sheet * 9, sheet * 9 + 9);
  pages.push(`<section class="page"><div class="grid">${nine.map(front).join("")}</div>${marks()}<div class="label">COSME starter set · sheet ${sheet + 1} of 4 · fronts</div></section>`);
  // Flip on the long edge mirrors left and right, so each row's backs go in reverse order.
  const backs: string[] = [];
  for (let r = 0; r < 3; r++) for (let col = 2; col >= 0; col--) backs.push(nine[r * 3 + col] ? back() : `<div class="card empty"></div>`);
  pages.push(`<section class="page"><div class="grid">${backs.join("")}</div>${marks()}<div class="label">sheet ${sheet + 1} of 4 · backs</div></section>`);
}

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Bungee;src:url(data:font/woff2;base64,${font("bungee/files/bungee-latin-400-normal.woff2")}) format("woff2")}
@font-face{font-family:Inter;font-weight:400;src:url(data:font/woff2;base64,${font("inter/files/inter-latin-400-normal.woff2")}) format("woff2")}
@font-face{font-family:Inter;font-weight:600;src:url(data:font/woff2;base64,${font("inter/files/inter-latin-600-normal.woff2")}) format("woff2")}
@font-face{font-family:Inter;font-weight:800;src:url(data:font/woff2;base64,${font("inter/files/inter-latin-800-normal.woff2")}) format("woff2")}
@page{size:8.5in 11in;margin:0}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font-family:Inter,sans-serif}
.page{position:relative;width:8.5in;height:11in;page-break-after:always;overflow:hidden;background:#fff}
.grid{position:absolute;left:.5in;top:.25in;display:grid;grid-template-columns:repeat(3,2.5in);grid-template-rows:repeat(3,3.5in)}
.card{width:2.5in;height:3.5in;padding:.05in;border-radius:.13in}
.inner{position:relative;height:100%;border-radius:.09in;background:#120F1C;padding:.17in}
.spot{position:absolute;font-family:Bungee;font-size:7.5pt;color:#EEEAF8;line-height:1}
.tl{top:.05in;left:.07in}.tr{top:.05in;right:.07in}.t{top:.05in;left:0;right:0;text-align:center}
.bl{bottom:.05in;left:.07in;transform:rotate(180deg)}.br{bottom:.05in;right:.07in;transform:rotate(180deg)}.b{bottom:.05in;left:0;right:0;text-align:center;transform:rotate(180deg)}
.r{right:-.03in;top:50%;transform:translateY(-50%) rotate(90deg)}.l{left:-.03in;top:50%;transform:translateY(-50%) rotate(-90deg)}
.frame{height:100%;border:2px solid;border-radius:5px;background:#1A1626;padding:5px;display:flex;flex-direction:column;gap:4px;color:#F5F3FF}
.head{display:flex;justify-content:space-between;align-items:center;gap:4px}
.name{font-weight:800;font-size:9.5pt;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hp{display:flex;align-items:center;gap:3px;font-family:Bungee;font-size:10pt;flex:0 0 auto}
.badge,.mini,.ringdot{display:inline-flex;align-items:center;justify-content:center;border-radius:50%}
.badge{width:16px;height:16px}
.mini{width:10px;height:10px;margin:0 2px 0 3px;vertical-align:-1px}
.art{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:4px;display:block}
.move{background:#F5F3FF;color:#120F1C;border-radius:4px;padding:4px 6px;display:flex;flex-direction:column;gap:2px;font-size:6.5pt;line-height:1.25}
.move b{font-size:8.5pt}
.weak{font-weight:600}
.foot{margin-top:auto;display:flex;justify-content:space-between;font-size:6pt;font-weight:800;color:#B9B4C9;letter-spacing:.5px}
.back{background:#FF8A3D}
.backin{height:100%;border-radius:.09in;background:radial-gradient(circle at 50% 50%,#2A1450,#0A0A0F 72%);display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:.16in 0}
.word{font-family:Bungee;font-size:20pt;color:#FF8A3D;letter-spacing:1px}
.flip{transform:rotate(180deg)}
.emblem{position:relative;width:1.95in;height:1.95in}
.logo{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.ringdot{position:absolute;width:16px;height:16px;transform:translate(-50%,-50%)}
.empty{background:none}
.mk{position:absolute;background:#9CA3AF}
.mk.v{width:.5pt;height:.18in}.mk.h{height:.5pt;width:.3in}
.label{position:absolute;bottom:.05in;left:0;right:0;text-align:center;font-size:6pt;color:#9CA3AF}
</style></head><body>${pages.join("")}</body></html>`;

writeFileSync("print/cosme-starter-cards.html", html);

(async () => {
  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: "print/cosme-starter-cards.pdf", width: "8.5in", height: "11in", printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  await browser.close();
  console.log("Wrote print/cosme-starter-cards.pdf");
})();
