'use strict';
/* ===================== art ===================== */
const art = (() => {
  const INK = '#3b2a2a';
  const O = `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
  const wrap = body => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  const face = (cx, cy, s = 1) => `
    <ellipse cx="${cx - 12 * s}" cy="${cy + 5 * s}" rx="${4.5 * s}" ry="${2.6 * s}" fill="#ff7f9c" opacity=".55"/>
    <ellipse cx="${cx + 12 * s}" cy="${cy + 5 * s}" rx="${4.5 * s}" ry="${2.6 * s}" fill="#ff7f9c" opacity=".55"/>
    <circle cx="${cx - 7 * s}" cy="${cy}" r="${3.4 * s}" fill="${INK}"/><circle cx="${cx + 7 * s}" cy="${cy}" r="${3.4 * s}" fill="${INK}"/>
    <circle cx="${cx - 6 * s}" cy="${cy - 1.2 * s}" r="${1.1 * s}" fill="#fff"/><circle cx="${cx + 8 * s}" cy="${cy - 1.2 * s}" r="${1.1 * s}" fill="#fff"/>
    <path d="M${cx - 4 * s} ${cy + 5 * s} Q${cx} ${cy + 9 * s} ${cx + 4 * s} ${cy + 5 * s}" fill="none" stroke="${INK}" stroke-width="${2.6 * s}" stroke-linecap="round"/>`;
  const snack = (name, body) => ({ name, svg: () => wrap(body) });

  const SNACKS = [
    snack('donut', `
      <circle cx="50" cy="52" r="34" fill="#e3a95c" ${O}/>
      <path d="M22 50 Q20 26 50 22 Q80 26 78 50 Q76 60 70 56 Q66 66 60 60 Q54 68 48 62 Q42 68 38 60 Q30 64 28 56 Q22 60 22 50 Z" fill="#8a4b2a" ${O}/>
      <circle cx="50" cy="40" r="8" fill="#fff8e7" ${O}/>
      <rect x="30" y="34" width="8" height="3" rx="1.5" fill="#ff8fc0" transform="rotate(-30 34 35)"/>
      <rect x="62" y="30" width="8" height="3" rx="1.5" fill="#7fd6ff" transform="rotate(25 66 31)"/>
      <rect x="66" y="44" width="8" height="3" rx="1.5" fill="#ffe27a" transform="rotate(-10 70 45)"/>
      <rect x="32" y="46" width="8" height="3" rx="1.5" fill="#9fe6c8" transform="rotate(40 36 47)"/>
      ${face(50, 74, 0.75)}`),
    snack('cupcake', `
      <path d="M26 56 L74 56 L66 90 L34 90 Z" fill="#7fc8f8" ${O}/>
      <path d="M40 58 L42 88 M50 58 L50 88 M60 58 L58 88" stroke="#4f9fd6" stroke-width="3" fill="none"/>
      <path d="M22 58 Q16 44 30 42 Q30 26 50 26 Q70 26 70 42 Q84 44 78 58 Z" fill="#ffb3d1" ${O}/>
      <circle cx="50" cy="20" r="7" fill="#ff4f64" ${O}/>
      ${face(50, 46, 0.8)}`),
    snack('strawberry', `
      <path d="M50 90 C22 78 16 52 24 40 C32 28 68 28 76 40 C84 52 78 78 50 90 Z" fill="#ff4f64" ${O}/>
      <g fill="#ffe08a"><ellipse cx="34" cy="48" rx="2" ry="3"/><ellipse cx="66" cy="48" rx="2" ry="3"/><ellipse cx="38" cy="72" rx="2" ry="3"/><ellipse cx="62" cy="72" rx="2" ry="3"/><ellipse cx="50" cy="80" rx="2" ry="3"/></g>
      <path d="M50 36 L38 24 L44 34 L28 32 L42 40 L50 30 L58 40 L72 32 L56 34 L62 24 Z" fill="#58c25a" ${O}/>
      ${face(50, 58, 0.9)}`),
    snack('cherry', `
      <path d="M34 54 Q38 30 56 16 M66 56 Q62 32 56 16" stroke="#3f8f3f" stroke-width="4" fill="none" stroke-linecap="round"/>
      <ellipse cx="66" cy="20" rx="11" ry="5" fill="#58c25a" transform="rotate(-20 66 20)" ${O}/>
      <circle cx="33" cy="68" r="17" fill="#e8384f" ${O}/>
      <circle cx="67" cy="70" r="17" fill="#e8384f" ${O}/>
      <circle cx="26" cy="62" r="3" fill="#fff" opacity=".7"/><circle cx="60" cy="64" r="3" fill="#fff" opacity=".7"/>
      ${face(33, 70, 0.6)}${face(67, 72, 0.6)}`),
    snack('ice cream', `
      <path d="M30 52 L70 52 L50 94 Z" fill="#efbf72" ${O}/>
      <path d="M38 58 L56 80 M50 54 L62 68 M62 56 L44 80 M48 56 L38 64" stroke="#c48a3e" stroke-width="2.5" fill="none"/>
      <path d="M26 50 Q24 18 50 18 Q76 18 74 50 Q70 60 64 52 Q58 62 52 54 Q46 62 40 54 Q34 60 26 50 Z" fill="#9fe6c8" ${O}/>
      ${face(50, 38, 0.85)}`),
    snack('cookie', `
      <path d="M50 16 Q66 15 76 26 Q88 36 84 52 Q86 70 72 80 Q60 88 46 85 Q28 86 20 72 Q12 58 17 44 Q20 26 36 19 Q43 15 50 16 Z" fill="#d39b55" ${O}/>
      <g fill="#6b3e26"><circle cx="34" cy="34" r="4.5"/><circle cx="66" cy="30" r="4"/><circle cx="72" cy="58" r="4.5"/><circle cx="30" cy="66" r="4"/><circle cx="56" cy="76" r="3.5"/><circle cx="48" cy="28" r="3"/></g>
      ${face(50, 52, 0.9)}`),
    snack('croissant', `
      <ellipse cx="20" cy="64" rx="9" ry="13" transform="rotate(-50 20 64)" fill="#f2b45a" ${O}/>
      <ellipse cx="80" cy="64" rx="9" ry="13" transform="rotate(50 80 64)" fill="#f2b45a" ${O}/>
      <ellipse cx="32" cy="52" rx="11" ry="17" transform="rotate(-30 32 52)" fill="#f2b45a" ${O}/>
      <ellipse cx="68" cy="52" rx="11" ry="17" transform="rotate(30 68 52)" fill="#f2b45a" ${O}/>
      <ellipse cx="50" cy="48" rx="15" ry="21" fill="#f6c46e" ${O}/>
      ${face(50, 48, 0.75)}`),
    snack('lollipop', `
      <rect x="46" y="58" width="8" height="38" rx="3" fill="#fff" ${O}/>
      <circle cx="50" cy="38" r="28" fill="#fff" ${O}/>
      ${['#ff5fa2', '#ffd34d', '#7fd6ff', '#ff5fa2', '#9fe6c8', '#ffd34d'].map((c, k) =>
        `<path d="M50 38 Q68 28 73 50" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round" transform="rotate(${k * 60} 50 38)"/>`).join('')}
      <circle cx="50" cy="38" r="28" fill="none" ${O}/>
      <circle cx="50" cy="39" r="12" fill="#fff"/>
      <circle cx="33" cy="24" r="3.5" fill="#fff" opacity=".9"/>
      ${face(50, 38, 0.7)}`),
    snack('candy', `
      <path d="M32 50 L10 30 Q4 50 10 70 Z" fill="#ffd34d" ${O}/>
      <path d="M68 50 L90 30 Q96 50 90 70 Z" fill="#ffd34d" ${O}/>
      <rect x="26" y="30" width="48" height="40" rx="20" fill="#7fd6ff" ${O}/>
      <path d="M36 36 Q32 42 34 48" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>
      ${face(52, 48, 0.85)}`),
    snack('pudding', `
      <ellipse cx="50" cy="84" rx="40" ry="9" fill="#fff" ${O}/>
      <path d="M26 82 L34 40 Q50 32 66 40 L74 82 Q50 90 26 82 Z" fill="#ffd65c" ${O}/>
      <path d="M34 40 Q50 32 66 40 L65 50 Q60 57 56 51 Q52 59 47 51 Q42 57 38 51 L35 49 Z" fill="#9a5426" ${O}/>
      <circle cx="50" cy="30" r="6" fill="#ff4f64" ${O}/>
      ${face(50, 66, 0.9)}`),
    snack('watermelon', `
      <path d="M10 36 L90 36 A40 40 0 0 1 10 36 Z" fill="#4caf50" ${O}/>
      <path d="M18 36 L82 36 A32 32 0 0 1 18 36 Z" fill="#ff5c6c"/>
      <path d="M10 36 L90 36" ${O}/>
      <g fill="${INK}"><ellipse cx="28" cy="44" rx="2" ry="3.2"/><ellipse cx="72" cy="44" rx="2" ry="3.2"/><ellipse cx="38" cy="60" rx="2" ry="3.2"/><ellipse cx="62" cy="60" rx="2" ry="3.2"/></g>
      ${face(50, 46, 0.75)}`),
    snack('cake', `
      <path d="M12 58 L88 46 L88 80 L12 88 Z" fill="#ffe7a8" ${O}/>
      <path d="M12 72 L88 62" stroke="#ff9fc8" stroke-width="6"/>
      <path d="M12 58 L88 46 L88 80 L12 88 Z" fill="none" ${O}/>
      <path d="M12 58 L62 30 L88 46 Z" fill="#ff9fc8" ${O}/>
      <path d="M22 57 Q25 63 28 56 Q32 62 36 54 M60 50 Q63 56 66 49 Q70 55 74 47" fill="none" stroke="#ff9fc8" stroke-width="4" stroke-linecap="round"/>
      <path d="M64 42 C56 34 56 24 64 24 C72 24 72 34 64 42 Z" fill="#ff4f64" ${O}/>
      <path d="M58 24 L64 18 L70 24" fill="none" stroke="#3f8f3f" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${face(52, 76, 0.6)}`),
    snack('macaron', `
      <path d="M16 46 Q16 20 50 20 Q84 20 84 46 Z" fill="#ffe27a" ${O}/>
      <rect x="18" y="46" width="64" height="11" rx="5" fill="#fff7e6" ${O}/>
      <path d="M16 57 L84 57 Q84 82 50 82 Q16 82 16 57 Z" fill="#ffe27a" ${O}/>
      ${face(50, 34, 0.8)}`),
    snack('pretzel', `
      <path d="M50 82 C16 82 10 44 30 32 C46 22 60 42 50 60 C40 42 54 22 70 32 C90 44 84 82 50 82 Z" fill="none" stroke="${INK}" stroke-width="18" stroke-linejoin="round"/>
      <path d="M50 82 C16 82 10 44 30 32 C46 22 60 42 50 60 C40 42 54 22 70 32 C90 44 84 82 50 82 Z" fill="none" stroke="#c9793a" stroke-width="10" stroke-linejoin="round"/>
      <g fill="#fff"><rect x="24" y="44" width="3" height="3"/><rect x="72" y="46" width="3" height="3"/><rect x="40" y="76" width="3" height="3"/><rect x="60" y="76" width="3" height="3"/><rect x="36" y="30" width="3" height="3"/></g>
      ${face(50, 70, 0.6)}`),
  ];
  return { SNACKS, LEVEL1_TYPES: [0, 10, 4] };
})();
