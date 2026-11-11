'use strict';
// Reward art: fancy-dressed characters (viewBox 0 0 200 240) and card skins.
// Ported verbatim from the approved _samples/code-samples.html drawings.
const charArt = (() => {
const INK='#3b2a2a', O=`stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
const face=(cx,cy,s=1)=>`
 <ellipse cx="${cx-14*s}" cy="${cy+8*s}" rx="${6*s}" ry="${3.5*s}" fill="#ff7f9c" opacity=".6"/>
 <ellipse cx="${cx+14*s}" cy="${cy+8*s}" rx="${6*s}" ry="${3.5*s}" fill="#ff7f9c" opacity=".6"/>
 <ellipse cx="${cx-9*s}" cy="${cy}" rx="${3.6*s}" ry="${4.6*s}" fill="${INK}"/><ellipse cx="${cx+9*s}" cy="${cy}" rx="${3.6*s}" ry="${4.6*s}" fill="${INK}"/>
 <circle cx="${cx-8*s}" cy="${cy-2*s}" r="${1.4*s}" fill="#fff"/><circle cx="${cx+10*s}" cy="${cy-2*s}" r="${1.4*s}" fill="#fff"/>
 <path d="M${cx-4*s} ${cy+7*s} Q${cx} ${cy+11*s} ${cx+4*s} ${cy+7*s}" fill="none" stroke="${INK}" stroke-width="${3*s}" stroke-linecap="round"/>`;
// fluffy outline trick: stroked circles, then the same circles unstroked on top
const fluff=(circles,fill='#fff')=>circles.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${O}/>`).join('')+circles.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r-2}" fill="${fill}"/>`).join('');
const sheepHead=(extraTop='')=>`
 <ellipse cx="66" cy="96" rx="13" ry="7" transform="rotate(25 66 96)" fill="#f6c9c0" ${O}/>
 <ellipse cx="134" cy="96" rx="13" ry="7" transform="rotate(-25 134 96)" fill="#f6c9c0" ${O}/>
 ${fluff([[72,72,20],[100,58,24],[128,72,20],[84,62,18],[116,62,18]])}
 <ellipse cx="100" cy="98" rx="27" ry="27" fill="#fbe3d6" ${O}/>
 ${extraTop}
 ${face(100,100)}`;
const legs=`<rect x="80" y="206" width="12" height="20" rx="5" fill="#5a4646" ${O}/><rect x="108" y="206" width="12" height="20" rx="5" fill="#5a4646" ${O}/>`;

const star=(cx,cy,r,fill)=>{const p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*0.45:r;p.push((cx+Math.cos(a)*rr).toFixed(1)+' '+(cy+Math.sin(a)*rr).toFixed(1));}
  return `<path d="M${p.join(' L')} Z" fill="${fill}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;};

const LIST = [
 ['Princess sheep', `
  ${legs}
  <path d="M74 132 L126 132 L160 212 Q100 226 40 212 Z" fill="#ffb3d1" ${O}/>
  <path d="M46 200 Q56 210 66 202 Q76 212 86 203 Q96 213 106 203 Q116 212 126 202 Q136 210 146 201 Q152 206 156 204" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
  <path d="M60 172 Q100 184 140 172" fill="none" stroke="#ff7fb5" stroke-width="4"/>
  <circle cx="100" cy="176" r="5" fill="#ffd34d" ${O}/>
  ${fluff([[62,140,12],[138,140,12]])}
  <path d="M78 126 L122 126 L126 150 L74 150 Z" fill="#ff8fc0" ${O}/>
  <path d="M88 130 L100 142 L112 130" fill="none" stroke="#fff" stroke-width="3"/>
  <g fill="#fff" ${O.replace('4','2')}><circle cx="86" cy="124" r="3"/><circle cx="93" cy="127" r="3"/><circle cx="100" cy="128" r="3"/><circle cx="107" cy="127" r="3"/><circle cx="114" cy="124" r="3"/></g>
  ${sheepHead(`<path d="M80 52 L86 36 L94 46 L100 30 L106 46 L114 36 L120 52 Z" fill="#ffd34d" ${O}/><circle cx="100" cy="42" r="4" fill="#7fd6ff" ${O.replace('4','2')}/>`)}`],
 ['Gentleman sheep', `
  ${legs}
  <path d="M70 130 L130 130 L136 208 L64 208 Z" fill="#3d3d55" ${O}/>
  <path d="M88 130 L100 170 L112 130 Z" fill="#fff" ${O}/>
  <path d="M100 136 L90 130 L90 142 Z M100 136 L110 130 L110 142 Z" fill="#e8384f" ${O.replace('4','3')}/>
  <circle cx="100" cy="150" r="2.5" fill="${INK}"/><circle cx="100" cy="160" r="2.5" fill="${INK}"/>
  <path d="M100 170 L100 208" ${O}/>
  <path d="M120 152 L130 152" stroke="#fff" stroke-width="4"/>
  ${fluff([[60,150,12],[140,150,12]])}
  ${sheepHead(`<rect x="76" y="40" width="48" height="8" rx="3" fill="#3d3d55" ${O}/><rect x="84" y="10" width="32" height="32" rx="3" fill="#3d3d55" ${O}/><rect x="84" y="32" width="32" height="6" fill="#e8384f"/>`)}
  <circle cx="109" cy="100" r="9" fill="none" stroke="#ffd34d" stroke-width="3"/>
  <path d="M117 104 Q122 118 118 128" fill="none" stroke="#ffd34d" stroke-width="2"/>`],
 ['Queen sheep', `
  ${legs}
  <path d="M100 118 L40 214 Q100 226 160 214 Z" fill="#c0304a" ${O}/>
  <path d="M100 118 L46 206 L58 212 L100 136 L142 212 L154 206 Z" fill="#a0243c"/>
  <path d="M74 128 Q100 144 126 128 L128 142 Q100 156 72 142 Z" fill="#fff" ${O}/>
  <g fill="${INK}"><rect x="82" y="138" width="3" height="5" rx="1"/><rect x="98" y="142" width="3" height="5" rx="1"/><rect x="114" y="138" width="3" height="5" rx="1"/></g>
  <path d="M40 214 Q100 226 160 214 L160 206 Q100 218 40 206 Z" fill="#fff" ${O}/>
  ${fluff([[66,160,12],[134,160,12]])}
  <path d="M146 112 L150 190" stroke="#ffd34d" stroke-width="6" stroke-linecap="round"/><circle cx="145" cy="108" r="8" fill="#7fd6ff" ${O}/>
  ${sheepHead(`<path d="M76 54 L78 30 L90 42 L100 24 L110 42 L122 30 L124 54 Z" fill="#ffd34d" ${O}/><circle cx="100" cy="44" r="5" fill="#e8384f" ${O.replace('4','2')}/><circle cx="84" cy="48" r="3" fill="#9fe6c8"/><circle cx="116" cy="48" r="3" fill="#9fe6c8"/>`)}`],
 ['Cat in a frilly dress', `
  <rect x="80" y="206" width="12" height="20" rx="5" fill="#ffffff" ${O}/><rect x="108" y="206" width="12" height="20" rx="5" fill="#ffffff" ${O}/>
  <path d="M154 196 Q182 170 168 140" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="M154 196 Q182 170 168 140" fill="none" stroke="#f2b45a" stroke-width="6" stroke-linecap="round"/>
  <path d="M72 132 L128 132 L156 208 Q100 222 44 208 Z" fill="#9fd4ff" ${O}/>
  <path d="M48 198 Q60 214 72 200 Q84 216 96 201 Q108 216 120 201 Q132 214 144 199 Q150 206 154 204 L156 208 Q100 222 44 208 Z" fill="#fff" ${O}/>
  <path d="M100 132 L100 196" stroke="#fff" stroke-width="4" stroke-dasharray="2 8" stroke-linecap="round"/>
  <path d="M100 140 L86 132 L86 148 Z M100 140 L114 132 L114 148 Z" fill="#ff8fc0" ${O.replace('4','3')}/>
  <circle cx="62" cy="150" r="11" fill="#f2b45a" ${O}/><circle cx="138" cy="150" r="11" fill="#f2b45a" ${O}/>
  <path d="M66 74 L70 40 L92 62 Z M134 74 L130 40 L108 62 Z" fill="#f2b45a" ${O}/>
  <path d="M72 66 L73 50 L84 61 Z M128 66 L127 50 L116 61 Z" fill="#ffb3d1"/>
  <ellipse cx="100" cy="94" rx="40" ry="34" fill="#f2b45a" ${O}/>
  <path d="M86 64 Q90 74 88 80 M100 62 L100 76 M114 64 Q110 74 112 80" fill="none" stroke="#d9913a" stroke-width="4" stroke-linecap="round"/>
  <path d="M60 72 Q100 30 140 72 L134 80 Q100 52 66 80 Z" fill="#fff" ${O}/>
  <circle cx="132" cy="62" r="8" fill="#ff8fc0" ${O}/><circle cx="68" cy="62" r="8" fill="#ff8fc0" ${O}/>
  ${face(100,98)}
  <path d="M66 100 L50 96 M66 106 L50 108 M134 100 L150 96 M134 106 L150 108" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`],
 ['Bunny ballerina', `
  <rect x="84" y="190" width="10" height="28" rx="4" fill="#fff" ${O}/><rect x="106" y="190" width="10" height="28" rx="4" fill="#fff" ${O}/>
  <ellipse cx="88" cy="222" rx="10" ry="6" fill="#ff8fc0" ${O}/><ellipse cx="112" cy="222" rx="10" ry="6" fill="#ff8fc0" ${O}/>
  <path d="M84 206 L94 214 M116 206 L106 214" stroke="#ff8fc0" stroke-width="3" stroke-linecap="round"/>
  <path d="M42 176 Q100 150 158 176 Q166 188 154 192 Q142 202 128 194 Q116 206 100 196 Q84 206 72 194 Q58 202 46 192 Q34 188 42 176 Z" fill="#ffc2dc" ${O}/>
  <path d="M58 172 Q100 156 142 172 Q146 180 136 182 Q124 190 112 184 Q100 192 88 184 Q76 190 64 182 Q54 180 58 172 Z" fill="#ffe6f1" ${O}/>
  <path d="M80 130 L120 130 L116 172 L84 172 Z" fill="#ff9fc8" ${O}/>
  <path d="M84 148 Q100 156 116 148" fill="none" stroke="#fff" stroke-width="3"/>
  <circle cx="64" cy="140" r="11" fill="#fff" ${O}/><circle cx="136" cy="140" r="11" fill="#fff" ${O}/>
  <ellipse cx="84" cy="42" rx="11" ry="30" transform="rotate(-10 84 42)" fill="#fff" ${O}/><ellipse cx="116" cy="42" rx="11" ry="30" transform="rotate(10 116 42)" fill="#fff" ${O}/>
  <ellipse cx="84" cy="44" rx="5" ry="20" transform="rotate(-10 84 44)" fill="#ffc2dc"/><ellipse cx="116" cy="44" rx="5" ry="20" transform="rotate(10 116 44)" fill="#ffc2dc"/>
  <ellipse cx="100" cy="98" rx="36" ry="32" fill="#fff" ${O}/>
  <g ${O.replace('4','2.5')}><circle cx="74" cy="76" r="6" fill="#ff8fc0"/><circle cx="86" cy="69" r="6" fill="#ffe27a"/><circle cx="100" cy="66" r="6" fill="#7fd6ff"/><circle cx="114" cy="69" r="6" fill="#ff8fc0"/><circle cx="126" cy="76" r="6" fill="#9fe6c8"/></g>
  ${face(100,100)}`],
 ['Frog prince', `
  <path d="M70 128 L36 214 L164 214 L130 128 Z" fill="#8b5cc7" ${O}/>
  <rect x="82" y="196" width="12" height="20" rx="5" fill="#8fd16a" ${O}/><rect x="106" y="196" width="12" height="20" rx="5" fill="#8fd16a" ${O}/>
  <path d="M70 130 L130 130 L136 202 L64 202 Z" fill="#4f7bd9" ${O}/>
  <rect x="66" y="166" width="68" height="9" fill="#ffd34d" ${O.replace('4','3')}/>
  <g fill="#ffd34d" ${O.replace('4','2')}><circle cx="100" cy="146" r="3.5"/><circle cx="100" cy="186" r="3.5"/></g>
  <circle cx="62" cy="146" r="11" fill="#8fd16a" ${O}/><circle cx="138" cy="146" r="11" fill="#8fd16a" ${O}/>
  <path d="M64 130 Q72 120 80 130 Q88 120 96 130 Q104 120 112 130 Q120 120 128 130 Q136 120 138 132 Q100 142 62 132 Q64 122 64 130 Z" fill="#fff" ${O}/>
  <circle cx="76" cy="70" r="16" fill="#8fd16a" ${O}/><circle cx="124" cy="70" r="16" fill="#8fd16a" ${O}/>
  <ellipse cx="100" cy="100" rx="44" ry="30" fill="#8fd16a" ${O}/>
  <circle cx="76" cy="68" r="10" fill="#fff" ${O.replace('4','2.5')}/><circle cx="124" cy="68" r="10" fill="#fff" ${O.replace('4','2.5')}/>
  <circle cx="78" cy="69" r="5" fill="${INK}"/><circle cx="122" cy="69" r="5" fill="${INK}"/><circle cx="79.5" cy="67" r="1.6" fill="#fff"/><circle cx="123.5" cy="67" r="1.6" fill="#fff"/>
  <path d="M88 62 L90 46 L96 54 L100 42 L104 54 L110 46 L112 62 Z" fill="#ffd34d" ${O}/>
  <ellipse cx="74" cy="104" rx="7" ry="4" fill="#ff7f9c" opacity=".6"/><ellipse cx="126" cy="104" rx="7" ry="4" fill="#ff7f9c" opacity=".6"/>
  <path d="M84 104 Q100 116 116 104" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`],
 ['Bear wizard', `
  <path d="M70 128 L130 128 L152 212 L48 212 Z" fill="#7a5cc7" ${O}/>
  ${[[80,160,6],[118,178,7],[92,198,5],[128,150,5]].map(([x,y,r])=>star(x,y,r,'#ffe27a')).join('')}
  <path d="M60 140 Q50 160 62 168 L74 150 Z M140 140 Q150 160 138 168 L126 150 Z" fill="#7a5cc7" ${O}/>
  <circle cx="62" cy="166" r="10" fill="#b07a4f" ${O}/><circle cx="138" cy="166" r="10" fill="#b07a4f" ${O}/>
  <path d="M142 160 L166 116" stroke="#8a4b2a" stroke-width="6" stroke-linecap="round"/>
  ${star(168,110,12,'#ffe27a')}
  <circle cx="66" cy="80" r="13" fill="#b07a4f" ${O}/><circle cx="134" cy="80" r="13" fill="#b07a4f" ${O}/>
  <circle cx="66" cy="80" r="6" fill="#e3b48a"/><circle cx="134" cy="80" r="6" fill="#e3b48a"/>
  <ellipse cx="100" cy="100" rx="36" ry="32" fill="#b07a4f" ${O}/>
  <ellipse cx="100" cy="112" rx="15" ry="11" fill="#f0d2b0" ${O.replace('4','3')}/>
  <ellipse cx="100" cy="106" rx="5" ry="3.5" fill="${INK}"/>
  <ellipse cx="80" cy="108" rx="6" ry="3.5" fill="#ff7f9c" opacity=".6"/><ellipse cx="120" cy="108" rx="6" ry="3.5" fill="#ff7f9c" opacity=".6"/>
  <ellipse cx="88" cy="94" rx="3.6" ry="4.6" fill="${INK}"/><ellipse cx="112" cy="94" rx="3.6" ry="4.6" fill="${INK}"/>
  <circle cx="89" cy="92" r="1.4" fill="#fff"/><circle cx="113" cy="92" r="1.4" fill="#fff"/>
  <path d="M96 114 Q100 118 104 114" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M74 72 Q92 40 104 4 Q114 44 126 72 Z" fill="#7a5cc7" ${O}/>
  <ellipse cx="100" cy="72" rx="42" ry="9" fill="#6a4cb7" ${O}/>
  ${star(98,40,6,'#ffe27a')}${star(112,58,4,'#ffe27a')}`],
];

  // Golden sheep: princess-sheep shape in gold, with sparkles (collection-complete reward)
  const GOLDEN = `
  ${star(36, 60, 9, '#fff3b0')}${star(166, 84, 7, '#fff3b0')}${star(40, 170, 6, '#fff3b0')}${star(168, 186, 8, '#fff3b0')}
  ${legs}
  <path d="M74 132 L126 132 L160 212 Q100 226 40 212 Z" fill="#ffd34d" ${O}/>
  <path d="M46 200 Q56 210 66 202 Q76 212 86 203 Q96 213 106 203 Q116 212 126 202 Q136 210 146 201 Q152 206 156 204" fill="none" stroke="#fff8d0" stroke-width="5" stroke-linecap="round"/>
  <path d="M60 172 Q100 184 140 172" fill="none" stroke="#e6a817" stroke-width="4"/>
  <circle cx="100" cy="176" r="5" fill="#e8384f" ${O}/>
  ${fluff([[62,140,12],[138,140,12]], '#fff8d0')}
  <path d="M78 126 L122 126 L126 150 L74 150 Z" fill="#ffe27a" ${O}/>
  <path d="M88 130 L100 142 L112 130" fill="none" stroke="#fff" stroke-width="3"/>
  ${sheepHead(`<path d="M74 54 L78 26 L90 40 L100 20 L110 40 L122 26 L126 54 Z" fill="#ffd34d" ${O}/><circle cx="100" cy="42" r="5" fill="#e8384f" ${O.replace('4','2')}/><circle cx="84" cy="46" r="3" fill="#7fd6ff"/><circle cx="116" cy="46" r="3" fill="#7fd6ff"/>`)}`;

const SKIN_LIST = [
  ['Classic (current)', { face: '#fff8e7', edge: '#e0bd85', ink: INK, bg: '' }],
  ['Strawberry milk', { face: '#ffe3ee', edge: '#f5a3c0', ink: INK,
    bg: 'radial-gradient(circle, rgba(255,255,255,.95) 2.2px, transparent 2.6px) 0 0/12px 12px' }],
  ['Mint picnic', { face: '#e8fff4', edge: '#9fd8bd', ink: '#2f4a3e',
    bg: 'linear-gradient(90deg, rgba(120,210,170,.22) 50%, transparent 50%) 0 0/14px 14px, linear-gradient(rgba(120,210,170,.22) 50%, transparent 50%) 0 0/14px 14px' }],
  ['Starry night', { face: '#ece8ff', edge: '#8f86d9', ink: '#2c2a55',
    bg: 'radial-gradient(circle at 14% 16%, #ffd34d 2.5px, transparent 3px), radial-gradient(circle at 86% 20%, #fff 2px, transparent 2.5px), radial-gradient(circle at 82% 86%, #ffd34d 2px, transparent 2.5px), radial-gradient(circle at 16% 84%, #fff 2.5px, transparent 3px)' }],
  ['Cookie', { face: '#f7dcae', edge: '#c98b52', ink: '#5a3418',
    bg: 'radial-gradient(circle at 18% 22%, rgba(150,90,40,.35) 2.5px, transparent 3px), radial-gradient(circle at 80% 30%, rgba(150,90,40,.35) 2px, transparent 2.5px), radial-gradient(circle at 70% 82%, rgba(150,90,40,.35) 2.5px, transparent 3px), radial-gradient(circle at 26% 78%, rgba(150,90,40,.35) 2px, transparent 2.5px)' }],
];
  const IDS = ['princess_sheep', 'gentleman_sheep', 'queen_sheep', 'frilly_cat', 'bunny_ballerina', 'frog_prince', 'bear_wizard'];
  const CHARACTERS = {};
  LIST.forEach(([name, body], i) => { CHARACTERS[IDS[i]] = { name, svg: () => `<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">${body}</svg>` }; });
  CHARACTERS.golden_sheep = { name: 'Golden sheep', svg: () => `<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">${GOLDEN}</svg>` };
  const SKIN_IDS = ['skin_classic', 'skin_strawberry', 'skin_mint', 'skin_starry', 'skin_cookie'];
  const SKINS = {};
  SKIN_LIST.forEach(([name, s], i) => { SKINS[SKIN_IDS[i]] = { name: name.replace(' (current)', ''), ...s }; });
  return { CHARACTERS, SKINS };
})();
