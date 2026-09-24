// Gera assets/banner.svg em pixel art de verdade (fonte 5x7 desenhada em blocos).
// Uso: node tools/gerar-banner.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const W = 900, H = 260, HORIZON = 176;
const C = {
  sky0: "#07011a", sky1: "#1d0540", sky2: "#5a0f6e", sky3: "#ff2e88",
  pink: "#ff2e88", cyan: "#00f0ff", yellow: "#ffe14d", orange: "#ff9d00",
  cream: "#fff8e7", skin: "#ffcf9e", night: "#12002a", purple: "#5b2a86",
};

// ---------- fonte pixel 5x7 ----------
const FONT = {
  A: [" ### ", "#   #", "#   #", "#####", "#   #", "#   #", "#   #"],
  C: [" ####", "#    ", "#    ", "#    ", "#    ", "#    ", " ####"],
  D: ["#### ", "#   #", "#   #", "#   #", "#   #", "#   #", "#### "],
  E: ["#####", "#    ", "#    ", "#### ", "#    ", "#    ", "#####"],
  F: ["#####", "#    ", "#    ", "#### ", "#    ", "#    ", "#    "],
  H: ["#   #", "#   #", "#   #", "#####", "#   #", "#   #", "#   #"],
  I: ["#####", "  #  ", "  #  ", "  #  ", "  #  ", "  #  ", "#####"],
  K: ["#   #", "#  # ", "# #  ", "##   ", "# #  ", "#  # ", "#   #"],
  L: ["#    ", "#    ", "#    ", "#    ", "#    ", "#    ", "#####"],
  O: [" ### ", "#   #", "#   #", "#   #", "#   #", "#   #", " ### "],
  P: ["#### ", "#   #", "#   #", "#### ", "#    ", "#    ", "#    "],
  R: ["#### ", "#   #", "#   #", "#### ", "# #  ", "#  # ", "#   #"],
  S: [" ####", "#    ", "#    ", " ### ", "    #", "    #", "#### "],
  T: ["#####", "  #  ", "  #  ", "  #  ", "  #  ", "  #  ", "  #  "],
  U: ["#   #", "#   #", "#   #", "#   #", "#   #", "#   #", " ### "],
  V: ["#   #", "#   #", "#   #", "#   #", "#   #", " # # ", "  #  "],
  Y: ["#   #", "#   #", " # # ", "  #  ", "  #  ", "  #  ", "  #  "],
  0: [" ### ", "#   #", "#  ##", "# # #", "##  #", "#   #", " ### "],
  1: ["  #  ", " ##  ", "  #  ", "  #  ", "  #  ", "  #  ", " ### "],
  2: [" ### ", "#   #", "    #", "   # ", "  #  ", " #   ", "#####"],
  4: ["   # ", "  ## ", " # # ", "#  # ", "#####", "   # ", "   # "],
  9: [" ### ", "#   #", "#   #", " ####", "    #", "    #", " ### "],
  "-": ["     ", "     ", "     ", " ### ", "     ", "     ", "     "],
  "/": ["    #", "    #", "   # ", "  #  ", " #   ", "#    ", "#    "],
  ">": ["#    ", "##   ", "###  ", "#### ", "###  ", "##   ", "#    "],
  "<": ["    #", "   ##", "  ###", " ####", "  ###", "   ##", "    #"],
  " ": ["     ", "     ", "     ", "     ", "     ", "     ", "     "],
};

// Junta pixels vizinhos da mesma linha num unico <rect> pra deixar o SVG leve.
function bitmapRects(rows, x0, y0, s, color) {
  let out = "";
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] === " " || row[x] === ".") { x++; continue; }
      const ch = row[x];
      let end = x;
      while (end < row.length && row[end] === ch) end++;
      const fill = typeof color === "string" ? color : color[ch];
      out += `<rect x="${x0 + x * s}" y="${y0 + y * s}" width="${(end - x) * s}" height="${s}" fill="${fill}"/>`;
      x = end;
    }
  });
  return out;
}

function textWidth(str, s, gap = 1) {
  return str.length * (5 + gap) * s - gap * s;
}

function pixelText(str, cx, y, s, color, gap = 1) {
  let x = Math.round(cx - textWidth(str, s, gap) / 2);
  let out = "";
  for (const ch of str) {
    const g = FONT[ch];
    if (!g) throw new Error(`Letra sem glifo: "${ch}"`);
    out += bitmapRects(g, x, y, s, color);
    x += (5 + gap) * s;
  }
  return out;
}

function pixelTextLeft(str, x, y, s, color) {
  return pixelText(str, x + textWidth(str, s) / 2, y, s, color);
}

// ---------- sprites ----------
const HERO_TOP = [
  "...HHHH...",
  "..HHHHHHH.",
  "..SSSSSS..",
  "..SKSSKS..",
  "..SSSSSS..",
  "...SSSS...",
  ".CCCCCCCC.",
  "SCCCCCCCCS",
  "SCCCCCCCCS",
  "S.CCCCCC.S",
];
const LEGS_A = ["..BBBBBB..", "..BB..BB..", "..BB..BB..", ".WWW..WWW."];
const LEGS_B = ["..BBBBBB..", ".BB....BB.", "BB......BB", "WW......WW"];
const HERO_PAL = { H: C.pink, S: C.skin, K: C.night, C: C.cyan, B: C.purple, W: C.cream };

const COIN = [
  "..YYYY..",
  ".YWYYYY.",
  "YWYYOYYY",
  "YYYYOYYY",
  "YYYYOYYY",
  "YYYYOYYY",
  ".YYYYYY.",
  "..YYYY..",
];
const COIN_PAL = { Y: C.yellow, W: C.cream, O: C.orange };

const HEART = [".RR.RR.", "RRRRRRR", "RRRRRRR", ".RRRRR.", "..RRR..", "...R..."];

// ---------- montanhas em degraus (periodo = W, pra rolar sem emenda) ----------
function mountains(step, base, amp, seed, color) {
  const cols = W / step;
  let d = `M0 ${HORIZON}`;
  for (let i = 0; i <= cols * 2; i++) {
    const t = ((i % cols) / cols) * Math.PI * 2;
    const h = base + amp * (0.55 * Math.sin(t * 2 + seed) + 0.3 * Math.sin(t * 5 + seed * 2) + 0.15 * Math.sin(t * 11 + seed));
    const y = Math.round(HORIZON - Math.max(4, h));
    d += ` V${y} H${(i + 1) * step}`;
  }
  d += ` V${HORIZON} Z`;
  return `<path d="${d}" fill="${color}"/>`;
}

// ---------- montagem ----------
const stars = Array.from({ length: 34 }, (_, i) => {
  const x = (i * 263 + 37) % W;
  const y = 8 + ((i * 97) % 120);
  const s = i % 5 === 0 ? 3 : 2;
  const delay = ((i * 0.37) % 3).toFixed(2);
  return `<rect class="star" x="${x}" y="${y}" width="${s}" height="${s}" fill="${C.cream}" style="animation-delay:-${delay}s"/>`;
}).join("");

// Sol pixelado: circulo feito de faixas horizontais de 4px com listras vazadas embaixo.
function sun(cx, cy, r) {
  let out = "";
  for (let y = -r; y < 0; y += 4) {
    const half = Math.round(Math.sqrt(r * r - (y + 2) * (y + 2)) / 4) * 4;
    const rel = (y + r) / r; // 0 no topo, 1 no horizonte
    if (rel > 0.55 && Math.floor((y + r) / 4) % 3 === 0) continue; // listras
    out += `<rect x="${cx - half}" y="${cy + y}" width="${half * 2}" height="4"/>`;
  }
  return `<g fill="url(#sunGrad)">${out}</g>`;
}

const vLines = [];
for (let i = -12; i <= 12; i++) {
  const xb = 450 + i * 90;
  vLines.push(`<line x1="450" y1="${HORIZON}" x2="${xb}" y2="${H}"/>`);
}
const hLines = Array.from({ length: 7 }, (_, i) =>
  `<line class="hl" x1="0" y1="${HORIZON}" x2="${W}" y2="${HORIZON}" style="animation-delay:-${(i * 2.8 / 7).toFixed(2)}s"/>`
).join("");

const title = "DEREK";
const TS = 10;
const titleY = 32;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Derek - Player 1 - Dev full-stack - Press start" shape-rendering="crispEdges">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="${HORIZON}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="${C.sky0}"/><stop offset=".45" stop-color="${C.sky1}"/>
    <stop offset=".8" stop-color="${C.sky2}"/><stop offset="1" stop-color="${C.sky3}"/>
  </linearGradient>
  <linearGradient id="sunGrad" x1="0" y1="126" x2="0" y2="${HORIZON}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="${C.yellow}"/><stop offset=".6" stop-color="${C.orange}"/><stop offset="1" stop-color="${C.pink}"/>
  </linearGradient>
  <linearGradient id="floor" x1="0" y1="${HORIZON}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#2a0645"/><stop offset="1" stop-color="${C.sky0}"/>
  </linearGradient>
  <linearGradient id="titleGrad" x1="0" y1="${titleY}" x2="0" y2="${titleY + 7 * TS}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="${C.cream}"/><stop offset=".55" stop-color="${C.cream}"/><stop offset=".56" stop-color="#ffd3ec"/><stop offset="1" stop-color="${C.pink}"/>
  </linearGradient>
  <linearGradient id="fade" x1="0" y1="${HORIZON}" x2="0" y2="${HORIZON + 26}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#ff2e88" stop-opacity=".55"/><stop offset="1" stop-color="#ff2e88" stop-opacity="0"/>
  </linearGradient>
  <filter id="glow" x="-10%" y="-30%" width="120%" height="160%">
    <feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <clipPath id="floorClip"><rect y="${HORIZON}" width="${W}" height="${H - HORIZON}"/></clipPath>
  <pattern id="scan" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="1" fill="#000" opacity=".22"/></pattern>
  <radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
  <style>
    .star{animation:tw 3s ease-in-out infinite}
    @keyframes tw{50%{opacity:.15}}
    .far{animation:scroll 60s linear infinite}
    .near{animation:scroll 30s linear infinite}
    @keyframes scroll{to{transform:translateX(-${W}px)}}
    .hl{animation:grid 2.8s cubic-bezier(.55,0,1,.45) infinite}
    @keyframes grid{from{transform:translateY(0);opacity:.1}to{transform:translateY(${H - HORIZON}px);opacity:1}}
    .blink{animation:blink 1.1s steps(1) infinite}
    @keyframes blink{50%{opacity:0}}
    .bob{animation:bob .6s steps(2) infinite}
    @keyframes bob{50%{transform:translateY(-4px)}}
    .fa{animation:fa .5s steps(1) infinite}
    .fb{animation:fb .5s steps(1) infinite}
    @keyframes fa{50%{opacity:0}}
    @keyframes fb{0%{opacity:0}50%{opacity:1}}
    .spin{transform-box:fill-box;transform-origin:center;animation:spin 1.2s steps(6) infinite}
    @keyframes spin{50%{transform:scaleX(.15)}}
    .hover{animation:hover 2.4s ease-in-out infinite}
    @keyframes hover{50%{transform:translateY(-8px)}}
    @media (prefers-reduced-motion:reduce){*{animation:none!important}}
  </style>
</defs>

<rect width="${W}" height="${H}" fill="url(#sky)"/>
${stars}
<g class="far">${mountains(12, 16, 13, 1.3, "#3a0c5e")}</g>
${sun(450, HORIZON, 50)}
<g class="near">${mountains(8, 7, 7, 4.1, "#1c0638")}</g>

<rect y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="url(#floor)"/>
<g clip-path="url(#floorClip)" stroke="${C.cyan}" stroke-width="1.2" shape-rendering="geometricPrecision" opacity=".75">
  ${vLines.join("")}
  ${hLines}
</g>
<rect y="${HORIZON}" width="${W}" height="26" fill="url(#fade)"/>
<rect y="${HORIZON - 1}" width="${W}" height="2" fill="${C.pink}"/>

<!-- HUD -->
${pixelTextLeft("SCORE 042000", 18, 10, 2, C.cream)}
${pixelText("HI 999999", 450, 8, 2, C.yellow)}
<g>${[0, 1, 2].map((i) => bitmapRects(HEART, 818 + i * 20, 10, 2, C.pink)).join("")}</g>

<!-- titulo com sombra deslocada e brilho -->
<g filter="url(#glow)">
  <g>${pixelText(title, 450 + 6, titleY + 6, TS, C.pink, 2)}</g>
  <g>${pixelText(title, 450 - 3, titleY - 3, TS, C.cyan, 2)}</g>
  <g>${pixelText(title, 450, titleY, TS, "url(#titleGrad)", 2)}</g>
</g>
${pixelText("PLAYER 1 / DEV FULL-STACK", 450, 114, 2, C.yellow)}

<!-- heroi andando -->
<g transform="translate(92,190)">
  <ellipse cx="20" cy="58" rx="20" ry="3" fill="#000" opacity=".45" shape-rendering="geometricPrecision"/>
  <g class="bob">
    ${bitmapRects(HERO_TOP, 0, 0, 4, HERO_PAL)}
    <g class="fa">${bitmapRects(LEGS_A, 0, 40, 4, HERO_PAL)}</g>
    <g class="fb">${bitmapRects(LEGS_B, 0, 40, 4, HERO_PAL)}</g>
  </g>
</g>

<!-- moedas girando -->
${[[770, 196, 0], [814, 184, 0.4], [728, 184, 0.8]].map(([x, y, d]) =>
  `<g class="hover" style="animation-delay:-${d}s"><g class="spin" style="animation-delay:-${d}s">${bitmapRects(COIN, x, y, 4, COIN_PAL)}</g></g>`).join("")}

<!-- press start -->
<rect x="${450 - textWidth("> PRESS START <", 3) / 2 - 14}" y="214" width="${textWidth("> PRESS START <", 3) + 28}" height="37" fill="${C.night}" opacity=".8"/>
<g class="blink">${pixelText("> PRESS START <", 450, 222, 3, C.cream)}</g>

<rect width="${W}" height="${H}" fill="url(#scan)" pointer-events="none"/>
<rect width="${W}" height="${H}" fill="url(#vig)" pointer-events="none"/>
</svg>
`;

const out = fileURLToPath(new URL("../assets/banner.svg", import.meta.url));
writeFileSync(out, svg);
console.log(`banner.svg gerado (${(svg.length / 1024).toFixed(1)} KB)`);
