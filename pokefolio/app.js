"use strict";
/* ==========================================================================
   PokeFolio — Portfolio Pokémon (vanilla HTML/CSS/JS port)
   Ported from the Claude Design prototype `Portfolio Pokemon.dc.html`.
   All data lives in localStorage — no backend, no accounts.
   ========================================================================== */

/* ============================== Constants =============================== */
const LS = 'pkm_portfolio_v1';
const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const SERIE_COLORI = ['#ef4444', '#2563eb', '#16a34a', '#f59e0b', '#7c3aed', '#0891b2', '#db2777'];
const RANGES = [['7G', 7], ['1M', 30], ['3M', 90], ['6M', 180], ['Tutto', 0]];
const CATEGORIE = ['ETB', 'UPC', 'Singola', 'Gradata', 'Box', 'Bundle', 'Mini Tin', 'Collezione speciale'];
const MESI_LUNGHI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const GIORNI_SETT = ['lu', 'ma', 'me', 'gi', 've', 'sa', 'do'];
const LINGUE = ['Italiano', 'Inglese', 'Giapponese', 'Altro'];
const ORDINI = [
  ['Valore: dal più alto', 'valore-desc'], ['Valore: dal più basso', 'valore-asc'],
  ['Variazione %: dalla più alta', 'var-desc'], ['Variazione %: dalla più bassa', 'var-asc'],
  ['Rendimento: dal più alto', 'roi-desc'], ['Rendimento: dal più basso', 'roi-asc'],
  ['Nome A–Z', 'nome-asc'], ['Nome Z–A', 'nome-desc']
];
const CAT_COLORI = { 'ETB': '#ef4444', 'UPC': '#e11d48', 'Singola': '#2563eb', 'Gradata': '#f59e0b', 'Box': '#16a34a', 'Bundle': '#7c3aed', 'Mini Tin': '#0891b2', 'Collezione speciale': '#db2777' };

const POS = '#16a34a', NEG = '#dc2626', ACCENT = '#ef4444', CHART_H = 230;

/* ============================ Pure helpers =============================== */
function venditeDi(p) {
  if (p.vendite && p.vendite.length) return p.vendite;
  if (p.venduto && parseEuro(p.prezzoVend)) {
    const q = Math.max(1, p.qty || 1);
    return [{ id: 'old', qty: q, prezzo: parseEuro(p.prezzoVend), data: p.dataVend || '', costoU: (parseEuro(p.costo) || 0) / q }];
  }
  return [];
}
function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3); }
function r2(n) { return Math.round(n * 100) / 100; }
function nf(n, d) {
  const neg = n < 0;
  const fixed = Math.abs(Number(n) || 0).toFixed(d);
  const parts = fixed.split('.');
  const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (neg ? '-' : '') + int + (parts[1] ? ',' + parts[1] : '');
}
function eur(n) { return nf(n || 0, 2) + ' €'; }
function eurC(n) { return (n > 0 ? '+' : n < 0 ? '−' : '') + nf(Math.abs(n || 0), 2) + ' €'; }
function pct(n) { if (n === null || n === undefined || !isFinite(n)) return '—'; return (n > 0 ? '+' : n < 0 ? '−' : '') + nf(Math.abs(n), 1) + '%'; }
function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function dmy(s) { if (!s) return '—'; const p = s.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
function iniz(nome) { return (nome || '?').split(/[\s—-]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join(''); }
function fotoStyle(foto) {
  return { width: '100%', height: '100%', backgroundImage: 'url("' + String(foto || '').replace(/"/g, '%22') + '")', backgroundSize: 'cover', backgroundPosition: 'center' };
}
function parseEuro(x) {
  if (x === null || x === undefined) return null;
  let t = String(x).replace(/[€\s ]/g, '');
  if (!t) return null;
  if (t.indexOf(',') !== -1) t = t.replace(/\./g, '').replace(',', '.');
  else if ((t.match(/\./g) || []).length > 1) t = t.replace(/\./g, '');
  const v = parseFloat(t);
  return isFinite(v) && v > 0 ? r2(v) : null;
}
function pseudo(a, b) { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); }

function parseValori(txt) {
  const raw = String(txt || '').trim();
  if (!raw) return { nums: [], scartati: 0, extra: 0, euroMode: false };
  if (raw.indexOf('€') !== -1) {
    const re = /(\d[\d.  ]*?)(?:,(\d{1,2}))?\s*€/g;
    const trovati = [];
    let m;
    while ((m = re.exec(raw)) !== null) {
      const v = parseFloat(m[1].replace(/[. \s]/g, '') + '.' + (m[2] || '0'));
      if (isFinite(v)) trovati.push(v);
    }
    if (trovati.length) return { nums: trovati.slice(0, 10), scartati: 0, extra: Math.max(0, trovati.length - 10), euroMode: true };
  }
  let tok = raw.split(/[\s;\t\n]+/).filter(Boolean);
  if (tok.length === 1) tok = tok[0].split(',').filter(Boolean);
  const nums = []; let scartati = 0;
  tok.forEach(t => {
    const c = t.replace(/[€\s]/g, '').replace(/[,;]+$/, '').replace(',', '.');
    const v = parseFloat(c);
    if (isFinite(v) && /^-?\d*\.?\d+$/.test(c)) nums.push(v); else scartati++;
  });
  return { nums, scartati, extra: 0, euroMode: false };
}

function catDaTesto(nome, tipologia) {
  const t = (tipologia || '').toLowerCase(), n = (nome || '').toLowerCase();
  if (/grad|psa|bgs|cgc/.test(t + ' ' + n)) return 'Gradata';
  if (/bundle/.test(t) || /bundle/.test(n)) return 'Bundle';
  if (/\bupc\b|ultra premium/.test(n)) return 'UPC';
  if (/primi compagni|compagni/.test(n)) return 'Collezione speciale';
  if (/\betb\b|elite trainer/.test(n)) return 'ETB';
  if (/mini\s*tin|\btin\b/.test(n)) return 'Mini Tin';
  if (/\bbox\b|display|booster box/.test(n)) return 'Box';
  if (/collezione|collection|premium|tohoku/.test(n)) return 'Collezione speciale';
  if (/serie|bustin|pack/.test(n)) return 'Bundle';
  return 'Singola';
}
function linguaDaTesto(nome) {
  const n = ' ' + (nome || '').toUpperCase() + ' ';
  if (/\b(ITA|IT|ITALIANO)\b/.test(n)) return 'Italiano';
  if (/\b(ENG|EN|INGLESE|UK|US)\b/.test(n)) return 'Inglese';
  if (/\b(JAP|JPN|JP|GIAPPONESE)\b/.test(n)) return 'Giapponese';
  return 'Altro';
}
function parseIncolla(text) {
  const righe = String(text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const out = [];
  righe.forEach(linea => {
    if (/^(prodotto|product)\b/i.test(linea)) return;
    const campi = linea.split(/\t|\s{2,}|\s*;\s*/).map(c => c.trim()).filter(Boolean);
    const nome = (campi[0] || '').replace(/\s+/g, ' ').trim();
    if (!nome || nome.length < 2) return;
    const mData = linea.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
    const campiPrezzo = campi.filter(c => /€/.test(c) && /\d/.test(c));
    let prezzo = campiPrezzo.length ? parseEuro(campiPrezzo[campiPrezzo.length - 1]) : null;
    if (prezzo === null) {
      const m = linea.match(/€[  ]?([\d.,]+)|([\d.,]+)[  ]?€/);
      if (m) prezzo = parseEuro(m[1] || m[2]);
    }
    const tipologia = campi.find(c => /sealed|graded|opened|bundle|slab/i.test(c)) || '';
    let qty = 1;
    const cands = campi.filter(c => /^\d{1,4}$/.test(c) && !/€/.test(c));
    if (cands.length) qty = Math.max(1, parseInt(cands[cands.length - 1], 10));
    else {
      const m = linea.replace(/€\s*[\d.,]+/g, '').match(/\b(\d{1,3})\b(?![\/\-.])/);
      if (m) qty = Math.max(1, parseInt(m[1], 10));
    }
    const anno = mData ? (mData[3].length === 2 ? '20' + mData[3] : mData[3]) : '';
    out.push({
      nome, qty,
      lingua: linguaDaTesto(nome),
      categoria: catDaTesto(nome, tipologia),
      prezzo,
      costo: prezzo ? r2(prezzo * qty) : null,
      dataAcq: mData ? anno + '-' + mData[2].padStart(2, '0') + '-' + mData[1].padStart(2, '0') : ''
    });
  });
  return out;
}
function mkRil(pid, data, valori) {
  const v = valori.slice();
  return { id: uid(), pid, data, valori: v, min: r2(Math.min.apply(null, v)), avg: r2(v.reduce((a, b) => a + b, 0) / v.length) };
}

function demo() {
  const specs = [
    { nome: 'Bustina 151 — Scarlatto e Violetto', lingua: 'Italiano', categoria: 'Bundle', qty: 14, base: 8.4, drift: 0.055, vol: 0.07, costo: 98, mesiAcq: 8 },
    { nome: 'Elite Trainer Box 151', lingua: 'Inglese', categoria: 'ETB', qty: 3, base: 74, drift: 0.03, vol: 0.06, costo: 179.7, mesiAcq: 10 },
    { nome: 'Box VMAX Climax', lingua: 'Giapponese', categoria: 'Box', qty: 2, base: 198, drift: 0.022, vol: 0.09, costo: 430, mesiAcq: 14 },
    { nome: 'Charizard ex SIR 199/165', lingua: 'Inglese', categoria: 'Gradata', qty: 1, base: 352, drift: -0.014, vol: 0.05, costo: 389, mesiAcq: 5 }
  ];
  const prodotti = [], ril = [];
  specs.forEach((s, pi) => {
    const id = 'demo' + (pi + 1);
    const da = new Date(); da.setDate(12); da.setMonth(da.getMonth() - s.mesiAcq);
    prodotti.push({ id, nome: s.nome, lingua: s.lingua, categoria: s.categoria, qty: s.qty, foto: '', costo: s.costo, dataAcq: iso(da) });
    let base = s.base;
    for (let m = 6; m >= 0; m--) {
      const d = new Date(); d.setDate(4); d.setMonth(d.getMonth() - m);
      base = base * (1 + s.drift + (pseudo(pi + 1, m + 1) - 0.5) * s.vol);
      const valori = [];
      for (let k = 0; k < 10; k++) valori.push(r2(base * (0.9 + pseudo(pi * 13 + k, m + 2) * 0.19)));
      ril.push(mkRil(id, iso(d), valori));
    }
  });
  return { prodotti, ril };
}

/* ============================ String/DOM utils ============================ */
function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function styleStr(o) {
  if (!o) return '';
  return Object.keys(o).map(k => {
    const v = o[k];
    if (v === null || v === undefined || v === '') return '';
    const kebab = k.replace(/([A-Z])/g, '-$1').toLowerCase();
    return kebab + ':' + v;
  }).filter(Boolean).join(';');
}
function styleAttr(o) { return esc(styleStr(o)); }

/* ============================== Global state =============================== */
let state = {
  tab: 'collezione', d: { prodotti: [], ril: [] }, q: '', sort: 'valore-desc', lingua: 'Tutte',
  drop: null, calMese: null, fotoStato: null, editP: null, nuovoRil: null, incolla: '', incollaAperto: false,
  catFiltro: 'Tutte', statoFiltro: 'In collezione', open: null, range: 'Tutto', periodo: 'Mensile', tip: null,
  nascoste: {}, espanse: {}, edit: null, chiedi: null, vendi: null,
  msg: null, msgOk: true, forza: false, nomiAperto: false, tortaSel: {}, tortaHov: {},
  f: { nome: '', lingua: 'Italiano', categoria: 'ETB', qty: 1, foto: '', data: iso(new Date()), valori: '', costo: '', costoUnit: '', dataAcq: '' }
};

/* ========================== Handler registry (event delegation) ========================== */
let HANDLERS = new Map();
let hid = 0;
function H(fn) { const id = ++hid; HANDLERS.set(id, fn); return id; }

/* ================================ Persistence ================================ */
function persist(d) { try { localStorage.setItem(LS, JSON.stringify(d)); } catch (e) {} }
function setD(d) { persist(d); state.d = d; render(); }
function setState(patch) {
  const p = typeof patch === 'function' ? patch(state) : patch;
  if (p) Object.assign(state, p);
  render();
}

/* ================================ Style helpers ================================ */
function pill(v) {
  const up = v > 0, flat = !v;
  return {
    display: 'inline-block', fontSize: '12px', fontWeight: 700, borderRadius: '999px', padding: '4px 9px',
    background: flat ? '#eef0f4' : up ? '#dcfce7' : '#fee2e2',
    color: flat ? '#5d6672' : up ? POS : NEG
  };
}
function big(v) { return { fontSize: '21px', fontWeight: 800, letterSpacing: '-0.03em', color: v > 0 ? POS : v < 0 ? NEG : '#40474f' }; }
function segnoS(v) { return { textAlign: 'right', fontWeight: 700, color: v > 0 ? POS : v < 0 ? NEG : '#5d6672' }; }
function tabS(on) { return on ? { background: ACCENT, color: '#fff', boxShadow: 'none' } : { background: 'transparent', boxShadow: 'none' }; }
function chipS(on) { return on ? { background: ACCENT, color: '#fff', boxShadow: 'none', padding: '6px 13px', fontSize: '12px' } : { background: 'transparent', boxShadow: 'none', padding: '6px 13px', fontSize: '12px' }; }

function sincCosto(obj, campo, valore) {
  const o = Object.assign({}, obj, { [campo]: valore });
  const qty = Math.max(1, parseInt(o.qty, 10) || 1);
  if (campo === 'costo') { const n = parseEuro(valore); o.costoUnit = n ? nf(n / qty, 2) : ''; }
  else if (campo === 'costoUnit') { const n = parseEuro(valore); o.costo = n ? nf(n * qty, 2) : ''; }
  else {
    const u = parseEuro(o.costoUnit), t = parseEuro(o.costo);
    if (u) o.costo = nf(u * qty, 2);
    else if (t) o.costoUnit = nf(t / qty, 2);
  }
  return o;
}

/* ================================ Derived data ================================ */
function rilOf(pid) { return state.d.ril.filter(r => r.pid === pid).sort((a, b) => a.data < b.data ? -1 : 1); }
function rilAt(pid, data) { const rs = rilOf(pid).filter(r => r.data <= data); return rs.length ? rs[rs.length - 1] : null; }
function inColl() { return state.d.prodotti.filter(p => !p.venduto); }
function valoreAt(data) { return inColl().reduce((s, p) => { const r = rilAt(p.id, data); return s + (r ? r.avg * p.qty : 0); }, 0); }
function divarioAt(data) { return inColl().reduce((s, p) => { const r = rilAt(p.id, data); return s + (r ? (r.avg - r.min) * p.qty : 0); }, 0); }

function bucket() {
  const all = state.d.ril.map(r => r.data).sort();
  if (!all.length) return { ends: [], labels: [] };
  const first = all[0], p = state.periodo, ends = [], labels = [];
  const now = new Date();
  if (p === 'Settimanale') {
    const e = new Date(now); e.setDate(e.getDate() + (7 - ((e.getDay() + 6) % 7 + 1)));
    for (let i = 0; i < 12; i++) { const d = new Date(e); d.setDate(d.getDate() - i * 7); ends.unshift(iso(d)); labels.unshift(String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0')); }
  } else if (p === 'Mensile') {
    for (let i = 0; i < 12; i++) { const d = new Date(now.getFullYear(), now.getMonth() - i + 1, 0); ends.unshift(iso(d)); labels.unshift(MESI[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2)); }
  } else {
    for (let i = 0; i < 5; i++) { const d = new Date(now.getFullYear() - i, 11, 31); ends.unshift(iso(d)); labels.unshift(String(d.getFullYear())); }
  }
  const keep = [], kl = [], oggi = iso(now);
  ends.forEach((e, i) => {
    if (e < first) return;
    const lim = e > oggi ? oggi : e;
    const dentro = all.filter(dt => dt <= lim);
    if (!dentro.length) return;
    const reale = dentro[dentro.length - 1];
    if (keep.length && keep[keep.length - 1] === reale) { kl[kl.length - 1] = labels[i]; return; }
    keep.push(reale); kl.push(labels[i]);
  });
  return { ends: keep, labels: kl };
}

/* ================================ Dropdown / calendar widgets ================================ */
function offClickCheck(e) {
  if (!e.target.closest || !e.target.closest('[data-drop]')) {
    if (state.drop || state.nomiAperto) setState({ drop: null, nomiAperto: false });
  }
}

function makeDrop(id, valore, opzioni, onSel) {
  const aperto = state.drop === id;
  return {
    valore, aperto,
    chevronStyle: { transform: aperto ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .15s', flex: 'none', color: '#5d6672' },
    triggerStyle: {
      width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
      border: '1px solid ' + (aperto ? '#ef4444' : '#e2e5ea'), background: '#fff', borderRadius: '12px',
      padding: '10px 12px', fontSize: '14px', fontWeight: 500, color: '#16181c', textAlign: 'left'
    },
    apriH: H(() => setState(st => ({ drop: st.drop === id ? null : id }))),
    opzioni: opzioni.map(o => ({
      label: o, attivo: o === valore,
      style: {
        display: 'flex', alignItems: 'center', gap: '8px', width: '100%', border: 0, cursor: 'pointer',
        background: o === valore ? '#fee2e2' : 'transparent', color: o === valore ? '#dc2626' : '#16181c',
        borderRadius: '10px', padding: '9px 11px', fontSize: '14px', fontWeight: o === valore ? 700 : 500, textAlign: 'left'
      },
      selH: H(() => { onSel(o); setState({ drop: null }); })
    }))
  };
}

function makeCal(id, valore, onSel) {
  const aperto = state.drop === id;
  const oggi = iso(new Date());
  const base = (aperto && state.calMese) || (valore ? valore.slice(0, 7) : oggi.slice(0, 7));
  const Y = parseInt(base.slice(0, 4), 10), M = parseInt(base.slice(5, 7), 10);
  const primo = new Date(Y, M - 1, 1);
  const off = (primo.getDay() + 6) % 7;
  const nGiorni = new Date(Y, M, 0).getDate();
  const celle = Math.ceil((off + nGiorni) / 7) * 7;
  const giorni = [];
  for (let i = 0; i < celle; i++) {
    const d = new Date(Y, M - 1, 1 - off + i);
    const s = iso(d), fuori = d.getMonth() !== M - 1, sel = s === valore, isOggi = s === oggi;
    giorni.push({
      label: String(d.getDate()),
      style: {
        border: isOggi && !sel ? '1px solid #ef4444' : '1px solid transparent', cursor: 'pointer',
        background: sel ? '#ef4444' : 'transparent', color: sel ? '#fff' : fuori ? '#c9cfd9' : '#16181c',
        borderRadius: '10px', padding: '7px 0', fontSize: '13px', fontWeight: sel ? 700 : 600,
        fontVariantNumeric: 'tabular-nums', textAlign: 'center'
      },
      selH: H(() => { onSel(s); setState({ drop: null, calMese: null }); })
    });
  }
  const vaiA = delta => setState(st => {
    const b = (st.calMese || base), yy = parseInt(b.slice(0, 4), 10), mm = parseInt(b.slice(5, 7), 10) + delta;
    const d = new Date(yy, mm - 1, 1);
    return { calMese: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') };
  });
  return {
    valore: valore ? dmy(valore) : 'Seleziona una data', aperto,
    triggerStyle: {
      width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
      border: '1px solid ' + (aperto ? '#ef4444' : '#e2e5ea'), background: '#fff', borderRadius: '12px',
      padding: '10px 12px', fontSize: '14px', fontWeight: 500, color: valore ? '#16181c' : '#6b7280',
      textAlign: 'left', fontVariantNumeric: 'tabular-nums'
    },
    chevronStyle: { transform: aperto ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .15s', flex: 'none', color: '#5d6672' },
    apriH: H(() => setState(st => ({ drop: st.drop === id ? null : id, calMese: valore ? valore.slice(0, 7) : oggi.slice(0, 7) }))),
    meseLabel: MESI_LUNGHI[M - 1] + ' ' + Y,
    settimane: GIORNI_SETT, giorni,
    prevH: H(() => vaiA(-1)), nextH: H(() => vaiA(1)),
    oggiH: H(() => { onSel(oggi); setState({ drop: null, calMese: null }); }),
    cancellaH: H(() => { onSel(''); setState({ drop: null, calMese: null }); })
  };
}

function renderDropdownPanel(drop) {
  if (!drop.aperto) return '';
  return `<div style="position:absolute;top:calc(100% + 6px);left:0;right:0;z-index:50;background:#fff;border-radius:14px;box-shadow:0 12px 34px rgba(20,24,32,0.16);padding:6px;display:flex;flex-direction:column;gap:2px;max-height:280px;overflow-y:auto">
    ${drop.opzioni.map(o => `<button type="button" class="pk-opt" style="${styleAttr(o.style)}" data-h="${o.selH}">${esc(o.label)}</button>`).join('')}
  </div>`;
}
function renderDropField(drop) {
  return `<button type="button" style="${styleAttr(drop.triggerStyle)}" data-h="${drop.apriH}">
    <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(drop.valore)}</span>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${styleAttr(drop.chevronStyle)}"><path d="M6 9l6 6 6-6"></path></svg>
  </button>${renderDropdownPanel(drop)}`;
}

function renderCalendarPanel(cal, footer) {
  let footerHtml = '';
  if (footer === 'oggi') {
    footerHtml = `<div style="display:flex;justify-content:flex-end;border-top:1px solid #e6e9ee;padding-top:8px">
      <button type="button" class="pk-btn" style="box-shadow:none;color:#ef4444;background:transparent;padding:6px 10px" data-h="${cal.oggiH}">Oggi</button>
    </div>`;
  } else if (footer === 'both') {
    footerHtml = `<div style="display:flex;justify-content:space-between;border-top:1px solid #e6e9ee;padding-top:8px">
      <button type="button" class="pk-btn" style="box-shadow:none;color:#5d6672;background:transparent;padding:6px 10px" data-h="${cal.cancellaH}">Cancella</button>
      <button type="button" class="pk-btn" style="box-shadow:none;color:#ef4444;background:transparent;padding:6px 10px" data-h="${cal.oggiH}">Oggi</button>
    </div>`;
  }
  return `<div style="position:absolute;top:calc(100% + 6px);left:0;z-index:70;width:266px;background:#fff;border-radius:16px;box-shadow:0 12px 34px rgba(20,24,32,0.18);padding:12px;display:flex;flex-direction:column;gap:8px">
    <div style="display:flex;align-items:center;gap:6px">
      <div style="flex:1;font-size:14px;font-weight:700;text-transform:capitalize">${esc(cal.meseLabel)}</div>
      <button type="button" class="pk-btn" style="padding:5px 9px;box-shadow:none;background:#f4f5f8" data-h="${cal.prevH}">←</button>
      <button type="button" class="pk-btn" style="padding:5px 9px;box-shadow:none;background:#f4f5f8" data-h="${cal.nextH}">→</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">
      ${cal.settimane.map(w => `<div style="text-align:center;font-size:10px;font-weight:700;text-transform:uppercase;color:#5d6672;padding-bottom:2px">${esc(w)}</div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">
      ${cal.giorni.map(g => `<button type="button" class="pk-daybtn" style="${styleAttr(g.style)}" data-h="${g.selH}">${esc(g.label)}</button>`).join('')}
    </div>
    ${footerHtml}
  </div>`;
}
function renderCalField(cal, footer) {
  return `<button type="button" style="${styleAttr(cal.triggerStyle)}" data-h="${cal.apriH}">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5d6672" stroke-width="2" stroke-linecap="round" style="flex:none"><rect x="3" y="5" width="18" height="16" rx="3"></rect><path d="M8 3v4M16 3v4M3 11h18"></path></svg>
    <span style="flex:1">${esc(cal.valore)}</span>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${styleAttr(cal.chevronStyle)}"><path d="M6 9l6 6 6-6"></path></svg>
  </button>${cal.aperto ? renderCalendarPanel(cal, footer) : ''}`;
}

/* ================================ Charts (inline SVG) ================================ */
function chart(id, labels, serie, opts) {
  opts = opts || {};
  const H_ = CHART_H, W = 860, padL = 14, padR = 74, padT = 14, padB = 28;
  const nascoste = state.nascoste;
  const vis = serie.filter(s => !nascoste[id + '|' + s.nome]);
  const flat = [];
  vis.forEach(s => s.valori.forEach(v => { if (v !== null && isFinite(v)) flat.push(v); }));
  const n = labels.length;
  if (!flat.length || n < 1) {
    return `<div style="padding:30px 8px;text-align:center;font-size:13px;font-weight:600;color:#6b7280">Nessun rilevamento da mostrare.</div>`;
  }
  let lo = Math.min.apply(null, flat), hi = Math.max.apply(null, flat);
  if (hi === lo) { hi = lo + Math.max(1, Math.abs(lo) * 0.1); lo = lo - Math.max(1, Math.abs(lo) * 0.1); }
  const span = hi - lo; lo = Math.max(0, lo - span * 0.12); hi += span * 0.12;
  const x = i => n === 1 ? padL + (W - padL - padR) / 2 : padL + i * (W - padL - padR) / (n - 1);
  const y = v => H_ - padB - (v - lo) / (hi - lo) * (H_ - padT - padB);
  let svgKids = '';
  for (let g = 0; g <= 5; g++) {
    const v = lo + (hi - lo) * g / 5, yy = y(v);
    svgKids += `<line x1="${padL}" x2="${W - padR}" y1="${yy}" y2="${yy}" stroke="#eaedf2" stroke-width="1"></line>`;
    svgKids += `<text x="${W - padR + 8}" y="${yy + 4}" fill="#6b7280" font-size="11" font-weight="600">€${esc(nf(v, 2))}</text>`;
  }
  const step = Math.ceil(n / 7);
  labels.forEach((l, i) => {
    if (i % step === 0 || i === n - 1) svgKids += `<text x="${x(i)}" y="${H_ - 7}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}" fill="#6b7280" font-size="11" font-weight="600">${esc(l)}</text>`;
  });
  vis.forEach((s, si) => {
    const pts = [];
    s.valori.forEach((v, i) => { if (v !== null && isFinite(v)) pts.push([x(i), y(v)]); });
    if (pts.length > 1 && vis.length === 1 && opts.area) {
      const poly = pts.map(p => p[0] + ',' + p[1]).join(' ') + ' ' + pts[pts.length - 1][0] + ',' + (H_ - padB) + ' ' + pts[0][0] + ',' + (H_ - padB);
      svgKids += `<polyline points="${poly}" fill="${s.colore}" fill-opacity="0.08" stroke="none"></polyline>`;
    }
    if (pts.length > 1) {
      const poly = pts.map(p => p[0] + ',' + p[1]).join(' ');
      svgKids += `<polyline points="${poly}" fill="none" stroke="${s.colore}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"${s.tratteggio ? ` stroke-dasharray="${s.tratteggio}"` : ''}></polyline>`;
    }
    pts.forEach((p, i) => {
      const r = pts.length === 1 ? 5 : (i === pts.length - 1 ? 3.6 : 2.6);
      svgKids += `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${pts.length === 1 ? s.colore : '#fff'}" stroke="${s.colore}" stroke-width="1.9"></circle>`;
    });
    if (pts.length === 1) {
      const vv = s.valori.find(v => v !== null && isFinite(v));
      svgKids += `<text x="${pts[0][0] + 11}" y="${pts[0][1] + 4}" fill="${s.colore}" font-size="12" font-weight="700">${esc(eur(vv))}</text>`;
    }
  });
  const tip = state.tip;
  labels.forEach((l, i) => {
    const w = (W - padL - padR) / Math.max(1, (n - 1));
    const enterH = H(() => setState({ tip: { id, i } }));
    const leaveH = H(() => setState({ tip: null }));
    svgKids += `<rect x="${x(i) - w / 2}" y="0" width="${w}" height="${H_}" fill="transparent" data-henter="${enterH}" data-hleave="${leaveH}" data-htouch="${enterH}"></rect>`;
  });
  if (tip && tip.id === id && tip.i < n) {
    svgKids += `<line x1="${x(tip.i)}" x2="${x(tip.i)}" y1="${padT - 8}" y2="${H_ - padB}" stroke="#c9cfd9" stroke-width="1"></line>`;
  }
  let html = `<div style="position:relative"><svg viewBox="0 0 ${W} ${H_}" style="width:100%;height:auto;display:block">${svgKids}</svg>`;
  if (tip && tip.id === id && tip.i < n) {
    const left = (x(tip.i) / W) * 100;
    const transform = left > 58 ? 'translateX(-104%)' : 'translateX(10px)';
    let rows = `<div style="color:#5d6672;margin-bottom:5px;font-size:11px;font-weight:700">${esc(opts.tipLabel ? opts.tipLabel[tip.i] : labels[tip.i])}</div>`;
    vis.forEach(s => {
      const vv = s.valori[tip.i];
      rows += `<div style="display:flex;gap:10px;justify-content:space-between"><span style="color:${s.colore};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px">${esc(s.nome)}</span><span style="font-weight:700">${vv === null || vv === undefined ? '—' : esc(eur(vv))}</span></div>`;
    });
    html += `<div style="position:absolute;top:0;left:${left}%;transform:${transform};background:#fff;box-shadow:0 8px 26px rgba(20,24,32,0.16);border-radius:14px;padding:9px 11px;font-size:12px;font-weight:600;pointer-events:none;min-width:140px;z-index:5;font-variant-numeric:tabular-nums">${rows}</div>`;
  }
  if (opts.legenda) {
    html += `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">`;
    serie.forEach(s => {
      const off = !!nascoste[id + '|' + s.nome];
      const toggleH = H(() => setState(st => ({ nascoste: Object.assign({}, st.nascoste, { [id + '|' + s.nome]: !off }) })));
      html += `<button type="button" class="pk-legend" data-h="${toggleH}" style="display:inline-flex;align-items:center;gap:7px;cursor:pointer;border:0;background:${off ? '#f1f3f7' : '#fff'};box-shadow:${off ? 'none' : '0 1px 2px rgba(20,24,32,0.08)'};border-radius:999px;padding:5px 11px;font:inherit;font-size:12px;font-weight:600;color:${off ? '#6b7280' : '#40474f'}">
        <span style="width:9px;height:9px;border-radius:999px;background:${off ? '#c9cfd9' : s.colore}"></span><span>${esc(s.nome)}</span></button>`;
    });
    html += `</div>`;
  }
  html += `</div>`;
  return html;
}

function sparkline(valori, colore) {
  const W = 260, H_ = 62, pad = 6;
  const pts = valori.filter(v => isFinite(v));
  if (!pts.length) return `<div style="height:${H_}px;display:grid;place-items:center;font-size:11px;font-weight:600;color:#6b7280">Nessun rilevamento</div>`;
  let lo = Math.min.apply(null, pts), hi = Math.max.apply(null, pts);
  if (hi === lo) { hi = lo + 1; lo -= 1; }
  const x = i => pts.length === 1 ? W / 2 : pad + i * (W - pad * 2) / (pts.length - 1);
  const y = v => H_ - pad - (v - lo) / (hi - lo) * (H_ - pad * 2);
  const coords = pts.map((v, i) => [x(i), y(v)]);
  let kids = '';
  if (coords.length > 1) {
    const poly = coords.map(p => p[0] + ',' + p[1]).join(' ') + ' ' + x(pts.length - 1) + ',' + H_ + ' ' + pad + ',' + H_;
    kids += `<polyline points="${poly}" fill="${colore}" fill-opacity="0.09" stroke="none"></polyline>`;
    kids += `<polyline points="${coords.map(p => p[0] + ',' + p[1]).join(' ')}" fill="none" stroke="${colore}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></polyline>`;
  } else {
    kids += `<line x1="${pad}" x2="${W - pad}" y1="${coords[0][1]}" y2="${coords[0][1]}" stroke="${colore}" stroke-opacity="0.3" stroke-width="1.5" stroke-dasharray="4 4"></line>`;
  }
  coords.forEach((p, i) => {
    const r = coords.length === 1 ? 5 : (i === coords.length - 1 ? 3.6 : 2.6);
    kids += `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${coords.length === 1 ? colore : '#fff'}" stroke="${colore}" stroke-width="1.8"></circle>`;
  });
  return `<svg viewBox="0 0 ${W} ${H_}" preserveAspectRatio="none" style="width:100%;height:${H_}px;display:block">${kids}</svg>`;
}

function donut(id, items, totLabel, totValore, fmt) {
  const tot = items.reduce((a, i) => a + i.valore, 0);
  if (!tot) return `<div style="padding:26px 8px;text-align:center;font-size:13px;font-weight:600;color:#6b7280">Nessun dato da ripartire.</div>`;
  const fette = items.filter(i => i.valore > 0);
  const sel = (state.tortaSel || {})[id] || null;
  const hov = (state.tortaHov || {})[id] || null;
  const attiva = hov || sel;
  const setHov = (label) => setState(st => { const m = Object.assign({}, st.tortaHov || {}); if (label === null) delete m[id]; else m[id] = label; return { tortaHov: m }; });
  const setSel = (label) => setState(st => { const cur = (st.tortaSel || {})[id] || null; const m = Object.assign({}, st.tortaSel || {}); const val = cur === label ? null : label; if (val === null) delete m[id]; else m[id] = val; return { tortaSel: m }; });
  const R = 82, r = 52, C = 100;
  let ang = -Math.PI / 2;
  let archi = '';
  fette.forEach(i => {
    const on = attiva === i.label, spento = attiva && !on;
    const Ro = on ? R + 7 : R;
    const a0 = ang, a1 = ang + (i.valore / tot) * Math.PI * 2; ang = a1;
    const big_ = a1 - a0 > Math.PI ? 1 : 0;
    const p = (rad, a) => [C + rad * Math.cos(a), C + rad * Math.sin(a)];
    const [x0, y0] = p(Ro, a0), [x1, y1] = p(Ro, a1), [x2, y2] = p(r, a1), [x3, y3] = p(r, a0);
    const singolo = i.valore === tot;
    const d = singolo
      ? 'M ' + (C - Ro) + ' ' + C + ' A ' + Ro + ' ' + Ro + ' 0 1 1 ' + (C + Ro) + ' ' + C + ' A ' + Ro + ' ' + Ro + ' 0 1 1 ' + (C - Ro) + ' ' + C + ' M ' + (C - r) + ' ' + C + ' A ' + r + ' ' + r + ' 0 1 0 ' + (C + r) + ' ' + C + ' A ' + r + ' ' + r + ' 0 1 0 ' + (C - r) + ' ' + C + ' Z'
      : 'M ' + x0 + ' ' + y0 + ' A ' + Ro + ' ' + Ro + ' 0 ' + big_ + ' 1 ' + x1 + ' ' + y1 + ' L ' + x2 + ' ' + y2 + ' A ' + r + ' ' + r + ' 0 ' + big_ + ' 0 ' + x3 + ' ' + y3 + ' Z';
    const enterH = H(() => setHov(i.label)), leaveH = H(() => setHov(null)), clickH = H(() => setSel(i.label));
    archi += `<path d="${d}" fill="${i.colore}" stroke="#fff" stroke-width="2" fill-rule="evenodd" opacity="${spento ? 0.32 : 1}" style="cursor:pointer;transition:opacity .15s ease" data-henter="${enterH}" data-hleave="${leaveH}" data-h="${clickH}"></path>`;
  });
  const f = attiva ? fette.find(i => i.label === attiva) : null;
  const centro1raw = f ? f.label : totLabel;
  const centro1 = (centro1raw || '').length > 16 ? centro1raw.slice(0, 15) + '…' : centro1raw;
  const centro2 = f ? fmt(f.valore) : totValore;
  const centro3 = f ? nf(f.valore / tot * 100, 1) + '%' : '';
  const svgLeaveH = H(() => setHov(null));
  const svg = `<svg viewBox="0 0 200 200" style="width:190px;height:190px;flex:none" data-hleave="${svgLeaveH}">
    ${archi}
    <text x="${C}" y="${C - 8}" text-anchor="middle" font-size="8" font-weight="700" letter-spacing="0.4" fill="#8a929e">${esc(centro1)}</text>
    <text x="${C}" y="${centro3 ? C + 7 : C + 9}" text-anchor="middle" font-size="12.5" font-weight="800" fill="#16181c">${esc(centro2)}</text>
    ${centro3 ? `<text x="${C}" y="${C + 21}" text-anchor="middle" font-size="9" font-weight="700" fill="#5d6672">${esc(centro3)}</text>` : ''}
  </svg>`;
  let legenda = `<div style="display:flex;flex-direction:column;gap:2px;flex:1 1 190px;min-width:0">`;
  fette.forEach(i => {
    const on = attiva === i.label, spento = attiva && !on;
    const enterH = H(() => setHov(i.label)), leaveH = H(() => setHov(null)), clickH = H(() => setSel(i.label));
    legenda += `<button type="button" data-henter="${enterH}" data-hleave="${leaveH}" data-h="${clickH}" style="display:flex;align-items:center;gap:9px;font-size:13px;font-weight:600;font-family:inherit;padding:6px 8px;border:none;border-radius:9px;cursor:pointer;text-align:left;width:100%;background:${on ? '#f4f5f8' : 'transparent'};color:${sel === i.label ? '#16181c' : '#40474f'};opacity:${spento ? 0.5 : 1};transition:opacity .15s ease, background .15s ease">
      <span style="width:10px;height:10px;border-radius:3px;background:${i.colore};flex:none;box-shadow:${sel === i.label ? '0 0 0 2px #16181c' : 'none'}"></span>
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(i.label)}</span>
      <span style="margin-left:auto;font-variant-numeric:tabular-nums;flex:none">${esc(fmt(i.valore))} · ${nf(i.valore / tot * 100, 1)}%</span>
    </button>`;
  });
  legenda += `</div>`;
  return `<div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap"><div>${svg}</div><div style="flex:1 1 190px;min-width:0">${legenda}</div></div>`;
}

/* ================================ Actions ================================ */
function salvaRilevamento() {
  const f = state.f, { nums } = parseValori(f.valori);
  if (!f.nome.trim()) { setState({ msg: 'Inserisci il nome del prodotto.', msgOk: false }); return; }
  if (!nums.length) { setState({ msg: 'Nessun valore numerico riconosciuto.', msgOk: false }); return; }
  if (nums.length !== 10 && !state.forza) { setState({ forza: true }); return; }
  const d = { prodotti: state.d.prodotti.slice(), ril: state.d.ril.slice() };
  const nome = f.nome.trim();
  let p = d.prodotti.find(x => x.nome.toLowerCase() === nome.toLowerCase());
  let prec = null;
  if (p) {
    prec = rilOf(p.id).slice(-1)[0] || null;
    p = Object.assign({}, p, {
      qty: Math.max(1, parseInt(f.qty, 10) || 1), lingua: f.lingua, categoria: f.categoria || p.categoria || 'ETB', foto: f.foto || p.foto,
      costo: String(f.costo).trim() === '' ? (parseEuro(p.costo) || null) : parseEuro(f.costo),
      dataAcq: f.dataAcq || p.dataAcq || ''
    });
    d.prodotti = d.prodotti.map(x => x.id === p.id ? p : x);
  } else {
    p = {
      id: uid(), nome, lingua: f.lingua, categoria: f.categoria || 'ETB', qty: Math.max(1, parseInt(f.qty, 10) || 1), foto: f.foto,
      costo: parseEuro(f.costo), dataAcq: f.dataAcq || ''
    };
    d.prodotti.push(p);
  }
  const nuovo = mkRil(p.id, f.data, nums);
  d.ril.push(nuovo);
  let msg = 'Rilevamento salvato: ' + nome + ' — medio ' + eur(nuovo.avg) + ', minimo ' + eur(nuovo.min) + '.';
  if (prec) {
    const v = (nuovo.avg - prec.avg) / prec.avg * 100;
    msg += ' Prezzo medio ' + pct(v) + ' rispetto al ' + dmy(prec.data) + '.';
  } else msg += ' Primo rilevamento per questo prodotto.';
  if (parseEuro(p.costo)) {
    const val = nuovo.avg * p.qty;
    msg += ' Vs acquisto (' + eur(p.costo) + (p.dataAcq ? ' del ' + dmy(p.dataAcq) : '') + '): ' + pct((val - p.costo) / p.costo * 100) + ' — ' + eurC(val - p.costo) + '.';
  }
  if (nums.length !== 10) msg += ' (salvati ' + nums.length + ' valori invece di 10)';
  persist(d);
  setState({ d, msg, msgOk: true, forza: false, f: { nome: '', lingua: 'Italiano', categoria: 'ETB', qty: 1, foto: '', data: iso(new Date()), valori: '', costo: '', costoUnit: '', dataAcq: '' } });
}

function eliminaRil(rid) {
  const d = { prodotti: state.d.prodotti.slice(), ril: state.d.ril.filter(r => r.id !== rid) };
  const openId = state.open;
  if (openId && !d.ril.some(r => r.pid === openId)) {
    d.prodotti = d.prodotti.filter(p => p.id !== openId);
    setD(d); setState({ open: null }); return;
  }
  setD(d);
}
function confermaEdit() {
  const e = state.edit; if (!e) return;
  const { nums } = parseValori(e.valori);
  if (!nums.length) { setState({ edit: null }); return; }
  const d = {
    prodotti: state.d.prodotti.map(p => p.id !== e.pid ? p : Object.assign({}, p, {
      costo: parseEuro(e.costo), dataAcq: e.dataAcq || '', categoria: e.categoria || p.categoria || 'ETB'
    })),
    ril: state.d.ril.map(r => r.id !== e.rid ? r : Object.assign({}, r, {
      data: e.data, valori: nums, min: r2(Math.min.apply(null, nums)), avg: r2(nums.reduce((a, b) => a + b, 0) / nums.length)
    }))
  };
  setD(d); setState({ edit: null });
}

function esporta() {
  const rows = [['prodotto', 'lingua', 'quantita', 'foto', 'data', 'minimo', 'medio', 'v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9', 'v10', 'spesa_acquisto', 'data_acquisto', 'categoria', 'prezzo_vendita', 'data_vendita']];
  state.d.prodotti.forEach(p => rilOf(p.id).forEach(r => {
    rows.push([p.nome, p.lingua, p.qty, (p.foto || '').slice(0, 5) === 'data:' ? '' : p.foto, dmy(r.data), r.min, r.avg]
      .concat(r.valori).concat([parseEuro(p.costo) || '', p.dataAcq ? dmy(p.dataAcq) : '', p.categoria || 'ETB',
        venditeDi(p).reduce((a, w) => a + (w.prezzo || 0), 0) || '', (venditeDi(p).slice(-1)[0] || {}).data ? dmy(venditeDi(p).slice(-1)[0].data) : '']));
  }));
  const csv = rows.map(r => r.map(c => { const s = String(c === undefined ? '' : c); return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(';')).join('\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = 'portfolio-pokemon.csv'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function importa(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return;
  const sep = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ',';
  const prodotti = [], ril = [];
  lines.slice(1).forEach(line => {
    const c = line.split(sep).map(s => s.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
    const nome = c[0]; if (!nome) return;
    let p = prodotti.find(x => x.nome.toLowerCase() === nome.toLowerCase());
    if (!p) {
      const cst = parseEuro(c[17]);
      const ap = (c[18] || '').split('/');
      p = {
        id: uid(), nome, lingua: c[1] || 'Altro', qty: Math.max(1, parseInt(c[2], 10) || 1), foto: c[3] || '',
        costo: cst,
        dataAcq: ap.length === 3 ? ap[2] + '-' + ap[1].padStart(2, '0') + '-' + ap[0].padStart(2, '0') : '',
        categoria: CATEGORIE.indexOf(c[19]) !== -1 ? c[19] : 'ETB'
      };
      const pv = parseEuro(c[20]), vp = (c[21] || '').split('/');
      if (pv || c[21]) {
        const dv = vp.length === 3 ? vp[2] + '-' + vp[1].padStart(2, '0') + '-' + vp[0].padStart(2, '0') : '';
        const qv = Math.max(1, p.qty || 1);
        p.vendite = [{ id: uid(), qty: qv, prezzo: pv || 0, data: dv, costoU: (parseEuro(p.costo) || 0) / qv }];
        p.qty = 0; p.costo = null; p.venduto = true;
      }
      prodotti.push(p);
    }
    const dp = (c[4] || '').split('/');
    const data = dp.length === 3 ? dp[2] + '-' + dp[1].padStart(2, '0') + '-' + dp[0].padStart(2, '0') : (c[4] || iso(new Date()));
    const nums = c.slice(7, 17).map(s => parseFloat(String(s).replace(',', '.'))).filter(v => isFinite(v));
    if (nums.length) ril.push(mkRil(p.id, data, nums));
  });
  if (prodotti.length) { setD({ prodotti, ril }); setState({ tab: 'collezione', msg: 'Importati ' + prodotti.length + ' prodotti e ' + ril.length + ' rilevamenti.', msgOk: true }); }
}

/* ================================ computeVals — big derived-state object ================================ */
function computeVals() {
  const s = state, prodotti = s.d.prodotti, acc = ACCENT;

  const stats = prodotti.map(p => {
    const rs = rilOf(p.id), last = rs[rs.length - 1] || null, prev = rs[rs.length - 2] || null;
    const valore = last ? last.avg * p.qty : 0;
    const v = last && prev && prev.avg ? (last.avg - prev.avg) / prev.avg * 100 : null;
    const costo = parseEuro(p.costo);
    const roi = costo ? (valore - costo) / costo * 100 : null;
    const vend = venditeDi(p);
    const qtyVend = vend.reduce((a, w) => a + (w.qty || 0), 0);
    const incasso = vend.reduce((a, w) => a + (w.prezzo || 0), 0);
    const costoVend = vend.reduce((a, w) => a + (w.costoU || 0) * (w.qty || 0), 0);
    const profitto = vend.length ? incasso - costoVend : null;
    const profittoPct = profitto !== null && costoVend ? profitto / costoVend * 100 : null;
    const esaurito = (p.qty || 0) <= 0 || (!(p.vendite && p.vendite.length) && !!p.venduto);
    return {
      p, rs, last, prev, valore, v, costo, roi, roiEuro: costo ? valore - costo : null,
      vend, qtyVend, incasso, costoVend, profitto, profittoPct, venduto: esaurito
    };
  });
  const attivi = stats.filter(x => !x.venduto);
  const pezziVend = stats.reduce((a, x) => a + x.qtyVend, 0);
  const totV = attivi.reduce((a, x) => a + x.valore, 0);
  const totPrev = attivi.reduce((a, x) => a + (x.prev ? x.prev.avg * x.p.qty : x.valore), 0);
  const totVar = totPrev ? (totV - totPrev) / totPrev * 100 : null;
  const incassoTot = stats.reduce((a, x) => a + (x.incasso || 0), 0);
  const profittoTot = stats.reduce((a, x) => a + (x.profitto || 0), 0);
  const spesaVenduti = stats.reduce((a, x) => a + (x.costoVend || 0), 0);
  const profittoPctTot = spesaVenduti ? profittoTot / spesaVenduti * 100 : null;
  const conCosto = attivi.filter(x => x.costo);
  const spesa = conCosto.reduce((a, x) => a + x.costo, 0);
  const valConCosto = conCosto.reduce((a, x) => a + x.valore, 0);
  const nConCosto = conCosto.length;
  const roiTot = spesa ? (valConCosto - spesa) / spesa * 100 : null;

  const statoF = s.statoFiltro || 'In collezione';
  let cards = stats.filter(x => (statoF === 'Tutti' || (statoF === 'Venduti' ? x.venduto : !x.venduto))
    && (s.lingua === 'Tutte' || x.p.lingua === s.lingua)
    && (s.catFiltro === 'Tutte' || (x.p.categoria || 'ETB') === s.catFiltro)
    && x.p.nome.toLowerCase().includes(s.q.toLowerCase().trim()));
  const dir = /-asc$/.test(s.sort) ? 1 : -1;
  const chiave = s.sort.split('-')[0];
  const key = x => chiave === 'roi' ? (x.venduto ? x.profittoPct : x.roi)
    : chiave === 'var' ? (x.venduto ? null : x.v !== null ? x.v : x.last ? 0 : null)
    : chiave === 'valore' ? (x.venduto ? x.incasso || null : x.last ? x.valore : null) : null;
  cards.sort((a, b) => {
    if (chiave === 'nome') return a.p.nome.localeCompare(b.p.nome, 'it', { sensitivity: 'base', numeric: true }) * dir;
    const ka = key(a), kb = key(b);
    const na = ka === null || !isFinite(ka), nb = kb === null || !isFinite(kb);
    if (na && nb) return a.p.nome.localeCompare(b.p.nome, 'it', { sensitivity: 'base' });
    if (na) return 1;
    if (nb) return -1;
    if (ka !== kb) return (ka - kb) * dir;
    return a.p.nome.localeCompare(b.p.nome, 'it', { sensitivity: 'base' });
  });

  // dettaglio
  let dettaglio = null, chartDettaglio = null;
  const openP = prodotti.find(p => p.id === s.open);
  if (openP) {
    const tutti = rilOf(openP.id);
    const giorni = (RANGES.find(r => r[0] === s.range) || ['Tutto', 0])[1];
    let rs = tutti;
    if (giorni) {
      const lim = new Date(); lim.setDate(lim.getDate() - giorni);
      const fl = tutti.filter(r => r.data >= iso(lim));
      rs = fl.length >= 2 ? fl : tutti.slice(-2);
    }
    chartDettaglio = chart('det', rs.map(r => dmy(r.data)), [
      { nome: 'Prezzo medio', colore: acc, valori: rs.map(r => r.avg) },
      { nome: 'Prezzo minimo', colore: '#94a3b8', valori: rs.map(r => r.min), tratteggio: '5 4' }
    ], { legenda: true });
    const arr = tutti.slice().reverse();
    const righe = arr.map((r, idx) => {
      const p2 = arr[idx + 1] || null;
      const dv = p2 && p2.avg ? (r.avg - p2.avg) / p2.avg * 100 : null;
      const inMod = !!(s.edit && s.edit.rid === r.id);
      const esp = !!s.espanse[r.id] || inMod;
      return {
        id: r.id, data: dmy(r.data), minimo: eur(r.min), medio: eur(r.avg), dPct: pct(dv), dStyle: segnoS(dv),
        valori: r.valori.map(v => eur(v)), espanso: esp, inModifica: inMod, normale: !inMod, soloLettura: !inMod,
        etichettaValori: esp && !inMod ? 'Chiudi' : '10 valori',
        etichettaModifica: inMod ? 'In modifica' : 'Modifica',
        editValori: inMod ? s.edit.valori : '',
        editCosto: inMod ? s.edit.costo : '',
        calEData: makeCal('edata' + r.id, inMod ? s.edit.data : r.data,
          v => setState(st => ({ edit: Object.assign({}, st.edit, { data: v || r.data }) }))),
        calEAcq: makeCal('eacq' + r.id, inMod ? (s.edit.dataAcq || '') : '',
          v => setState(st => ({ edit: Object.assign({}, st.edit, { dataAcq: v }) }))),
        dropECat: makeDrop('ecat' + r.id, inMod ? (s.edit.categoria || 'ETB') : 'ETB', CATEGORIE,
          v => setState(st => ({ edit: Object.assign({}, st.edit, { categoria: v }) }))),
        toggleH: H(() => setState(st => ({ espanse: Object.assign({}, st.espanse, { [r.id]: !st.espanse[r.id] }) }))),
        modificaH: H(() => setState({
          edit: {
            rid: r.id, pid: openP.id, data: r.data, valori: r.valori.map(v => nf(v, 2)).join(' '),
            costo: parseEuro(openP.costo) ? nf(parseEuro(openP.costo), 2) : '', dataAcq: openP.dataAcq || '', categoria: openP.categoria || 'ETB'
          }
        })),
        annullaH: H(() => setState({ edit: null })),
        confermaH: H(() => confermaEdit()),
        eliminaH: H(() => eliminaRil(r.id)),
        onEditValoriH: H(e => { const v = e.target.value; setState(st => ({ edit: Object.assign({}, st.edit, { valori: v }) })); }),
        onEditCostoH: H(e => { const v = e.target.value; setState(st => ({ edit: Object.assign({}, st.edit, { costo: v }) })); })
      };
    });
    const st0 = stats.find(x => x.p.id === openP.id);
    dettaglio = {
      nome: openP.nome, lingua: (openP.categoria || 'ETB') + ' · ' + openP.lingua, qty: openP.qty, foto: openP.foto || '', fotoStyle: fotoStyle(openP.foto),
      senzaFoto: !openP.foto, iniziali: iniz(openP.nome), nRil: tutti.length,
      posizione: eur(st0 ? st0.valore : 0),
      varTesto: st0 && st0.v !== null ? pct(st0.v) : '0,0%', pill: pill(st0 ? st0.v || 0 : 0),
      roiTesto: st0 && st0.roi !== null ? 'vs acquisto ' + pct(st0.roi) + ' (' + eurC(st0.roiEuro) + ')' : 'vs acquisto n.d.',
      roiPill: pill(st0 && st0.roi !== null ? st0.roiEuro : 0),
      acquistoTesto: parseEuro(openP.costo) ? 'Acquistato a ' + eur(parseEuro(openP.costo)) + ((openP.qty || 1) > 1 ? ' (' + eur(parseEuro(openP.costo) / openP.qty) + ' per pezzo)' : '') + (openP.dataAcq ? ' il ' + dmy(openP.dataAcq) : '') : 'Spesa d’acquisto non inserita — usa Modifica nello storico',
      righe,
      apriNuovoH: H(() => setState(st => ({ nuovoRil: st.nuovoRil ? null : { pid: openP.id, data: iso(new Date()), valori: '' } }))),
      etichettaNuovo: s.nuovoRil ? 'Chiudi' : 'Aggiungi rilevamento',
      apriModificaH: H(() => setState({
        editP: {
          pid: openP.id, nome: openP.nome, qty: String(openP.qty || 1), lingua: openP.lingua || 'Italiano',
          categoria: openP.categoria || 'ETB', costo: parseEuro(openP.costo) ? nf(parseEuro(openP.costo), 2) : '',
          costoUnit: parseEuro(openP.costo) ? nf(parseEuro(openP.costo) / Math.max(1, openP.qty || 1), 2) : '',
          dataAcq: openP.dataAcq || '', foto: openP.foto || ''
        }
      })),
      etichettaModificaProdotto: s.editP ? 'Chiudi modifica' : 'Modifica prodotto',
      puoVendere: (openP.qty || 0) > 0,
      etichettaVendi: s.vendi ? 'Annulla vendita' : 'Vendi',
      apriVendiH: H(() => setState(st => ({
        vendi: st.vendi ? null : (() => {
          const u = st0 && st0.last ? nf(st0.last.avg, 2) : '';
          return { pid: openP.id, qty: '1', costo: u, costoUnit: u, data: iso(new Date()) };
        })(),
        editP: null, nuovoRil: null
      }))),
      vendiForm: s.vendi ? (() => {
        const w = s.vendi;
        const qTot = Math.max(1, openP.qty || 1);
        const qv = Math.min(qTot, Math.max(1, parseInt(w.qty, 10) || 1));
        const resto = qTot - qv;
        const costoU = parseEuro(openP.costo) ? parseEuro(openP.costo) / qTot : 0;
        const avg = st0 && st0.last ? st0.last.avg : 0;
        const incasso = parseEuro(w.costo) || 0;
        const profitto = costoU ? incasso - costoU * qv : null;
        const setW = (campo, valore) => setState(st => ({ vendi: sincCosto(st.vendi, campo, valore) }));
        return {
          qty: w.qty, max: qTot,
          maxTesto: 'Disponibili ' + qTot + (qTot === 1 ? ' pezzo' : ' pezzi'),
          onQtyH: H(ev => setW('qty', String(Math.min(qTot, Math.max(1, parseInt(ev.target.value, 10) || 1))))),
          menoH: H(() => setW('qty', String(Math.max(1, qv - 1)))),
          piuH: H(() => setW('qty', String(Math.min(qTot, qv + 1)))),
          prezzo: w.costo, prezzoUnit: w.costoUnit,
          onPrezzoH: H(ev => setW('costo', ev.target.value)),
          onPrezzoUnitH: H(ev => setW('costoUnit', ev.target.value)),
          cal: makeCal('vend', w.data, v => setState(st => ({ vendi: Object.assign({}, st.vendi, { data: v }) }))),
          incassoTesto: incasso ? 'Incasso ' + eur(incasso) + ' (' + eur(incasso / qv) + ' per pezzo)' : 'Inserisci il prezzo di vendita',
          profittoTesto: profitto === null ? 'Spesa d’acquisto non inserita: il profitto non può essere calcolato'
            : 'Profitto della vendita ' + eurC(profitto) + (costoU * qv ? ' (' + pct(profitto / (costoU * qv) * 100) + ')' : ''),
          profittoStyle: pill(profitto || 0),
          restoTesto: resto === 0
            ? 'Vendi tutti i pezzi: il prodotto passerà tra i venduti e uscirà dal valore del portfolio.'
            : 'Dopo la vendita restano ' + resto + (resto === 1 ? ' pezzo' : ' pezzi'),
          restoSpesa: resto === 0 ? '' : (costoU ? 'Spesa residua ' + eur(costoU) + ' × ' + resto + ' = ' + eur(costoU * resto) : 'Spesa d’acquisto non inserita'),
          restoValore: resto === 0 ? '' : (avg ? 'Valore attuale ' + eur(avg) + ' × ' + resto + ' = ' + eur(avg * resto) : 'Nessun rilevamento: valore non disponibile'),
          annullaH: H(() => setState({ vendi: null })),
          confermaH: H(() => {
            if (!incasso) return;
            const vendite = (openP.vendite || []).concat([{ id: uid(), qty: qv, prezzo: r2(incasso), data: w.data || iso(new Date()), costoU: r2(costoU) }]);
            const np = Object.assign({}, openP, {
              qty: resto,
              costo: costoU ? r2(costoU * resto) : openP.costo,
              vendite, venduto: resto <= 0,
              prezzoVend: null, dataVend: ''
            });
            setD({ prodotti: s.d.prodotti.map(x => x.id === openP.id ? np : x), ril: s.d.ril.slice() });
            setState({ vendi: null });
          })
        };
      })() : null,
      venditeRighe: (st0 ? st0.vend : []).map(w => ({
        testo: w.qty + (w.qty === 1 ? ' pezzo' : ' pezzi') + (w.data ? ' il ' + dmy(w.data) : '') + ' · ' + eur(w.prezzo || 0),
        profitto: w.costoU ? eurC((w.prezzo || 0) - w.costoU * w.qty) : 'profitto n.d.',
        style: pill(w.costoU ? (w.prezzo || 0) - w.costoU * w.qty : 0)
      })),
      haVendite: !!(st0 && st0.vend.length),
      venditeTitolo: st0 && st0.vend.length
        ? 'Vendite registrate — incassato ' + eur(st0.incasso)
          + (st0.profitto !== null && st0.costoVend ? ' su una spesa di ' + eur(st0.costoVend) + ', profitto ' + eurC(st0.profitto) + ' (' + pct(st0.profitto / st0.costoVend * 100) + ')' : '')
        : '',
      eliminaProdottoH: H(() => setState({ chiedi: { pid: openP.id, nome: openP.nome, n: tutti.length, valore: st0 ? st0.valore : 0 } })),
      ranges: RANGES.map(r => ({ label: r[0], style: chipS(s.range === r[0]), selH: H(() => setState({ range: r[0], tip: null })) }))
    };
  }

  // inserimento
  const f = s.f, pv = parseValori(f.valori), nums = pv.nums;
  const ok10 = nums.length === 10;
  const mn = nums.length ? Math.min.apply(null, nums) : null;
  const mx = nums.length ? Math.max.apply(null, nums) : null;
  const av = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
  const esistente = prodotti.find(p => p.nome.toLowerCase() === f.nome.trim().toLowerCase());
  const setF = (k, v) => setState(st => ({ f: Object.assign({}, st.f, { [k]: v }), forza: false }));

  // analytics
  const { ends, labels } = bucket();
  const datiOk = ends.length >= 2 && prodotti.length > 0;
  let periodo = { varPct: '—', varEuro: '—', pill: pill(0) }, chartPortfolio = null, chartDivario = null, chartConfronto = null, composizione = [], classifica = [], highlights = [], tortaCapitale = null, tortaPezzi = null, recapCat = [];
  if (datiOk) {
    const serieTot = ends.map(e => r2(valoreAt(e)));
    const last = serieTot[serieTot.length - 1], prev = serieTot[serieTot.length - 2];
    const vp = prev ? (last - prev) / prev * 100 : null;
    periodo = { varPct: pct(vp), varEuro: eurC(last - prev), pill: pill(last - prev) };
    chartPortfolio = chart('pf', labels, [{ nome: 'Valore portfolio', colore: acc, valori: serieTot }], { tipLabel: ends.map(dmy), area: true });
    chartDivario = chart('dv', labels, [{ nome: 'Divario medio−minimo', colore: '#2563eb', valori: ends.map(e => r2(divarioAt(e))) }], { tipLabel: ends.map(dmy), area: true });
    chartConfronto = chart('cf', labels, prodotti.map((p, i) => ({
      nome: p.nome.length > 24 ? p.nome.slice(0, 22) + '…' : p.nome,
      colore: SERIE_COLORI[i % SERIE_COLORI.length],
      valori: ends.map(e => { const r = rilAt(p.id, e); return r ? r.avg : null; })
    })), { legenda: true, tipLabel: ends.map(dmy) });

    const eEnd = ends[ends.length - 1], ePrev = ends[ends.length - 2];
    classifica = inColl().map(p => {
      const ra = rilAt(p.id, eEnd), rp = rilAt(p.id, ePrev);
      const att = ra ? ra.avg * p.qty : 0, prec = rp ? rp.avg * p.qty : 0;
      const dEu = att - prec, dp = prec ? dEu / prec * 100 : null;
      const rs = rilOf(p.id);
      const cambi = rs.slice(1).map((r, i) => rs[i].avg ? (r.avg - rs[i].avg) / rs[i].avg * 100 : 0);
      const m = cambi.length ? cambi.reduce((a, b) => a + b, 0) / cambi.length : 0;
      const sd = cambi.length ? Math.sqrt(cambi.reduce((a, b) => a + (b - m) * (b - m), 0) / cambi.length) : 0;
      return {
        p, nome: p.nome, lingua: p.lingua, foto: p.foto || '', fotoStyle: fotoStyle(p.foto), senzaFoto: !p.foto, iniziali: iniz(p.nome),
        prec: eur(prec), att: eur(att), dEuro: eurC(dEu), dPct: pct(dp), dStyle: segnoS(dEu), raw: dEu, rawPct: dp, sd, valore: att
      };
    }).sort((a, b) => (b.rawPct || 0) - (a.rawPct || 0));

    const tot = classifica.reduce((a, r) => a + r.valore, 0) || 1;
    composizione = classifica.slice().sort((a, b) => b.valore - a.valore).map((r, i) => ({
      nome: r.nome, valore: eur(r.valore), pct: nf(r.valore / tot * 100, 1) + '%',
      barStyle: { width: Math.max(2, r.valore / tot * 100) + '%', height: '100%', borderRadius: '999px', background: SERIE_COLORI[i % SERIE_COLORI.length] }
    }));

    const byAbs = classifica.slice().sort((a, b) => Math.abs(b.raw) - Math.abs(a.raw));
    const stabile = classifica.slice().sort((a, b) => a.sd - b.sd)[0];
    const best = classifica[0], worst = classifica[classifica.length - 1];
    highlights = [
      { titolo: 'Top mover', nome: byAbs[0] ? byAbs[0].nome : '—', valore: byAbs[0] ? byAbs[0].dEuro : '—', style: big(byAbs[0] ? byAbs[0].raw : 0), nota: byAbs[0] ? byAbs[0].dPct + ' nel periodo' : '' },
      { titolo: 'Miglior performance', nome: best ? best.nome : '—', valore: best ? best.dPct : '—', style: big(best ? best.rawPct : 0), nota: best ? best.dEuro : '' },
      { titolo: 'Peggior performance', nome: worst ? worst.nome : '—', valore: worst ? worst.dPct : '—', style: big(worst ? worst.rawPct : 0), nota: worst ? worst.dEuro : '' },
      { titolo: 'Più stabile', nome: stabile ? stabile.nome : '—', valore: stabile ? '±' + nf(stabile.sd, 1) + '%' : '—', style: big(0), nota: 'volatilità media tra rilevamenti' }
    ];
  }

  if (prodotti.length) {
    const catVal = CATEGORIE.map(cat => ({
      label: cat, colore: CAT_COLORI[cat],
      valore: r2(attivi.filter(x => (x.p.categoria || 'ETB') === cat).reduce((a, x) => a + x.valore, 0))
    }));
    const catPezzi = CATEGORIE.map(cat => ({
      label: cat, colore: CAT_COLORI[cat],
      valore: attivi.filter(x => (x.p.categoria || 'ETB') === cat).reduce((a, x) => a + (x.p.qty || 0), 0)
    }));
    tortaCapitale = donut('cap', catVal, 'Capitale', eur(catVal.reduce((a, i) => a + i.valore, 0)), eur);
    tortaPezzi = donut('pez', catPezzi, 'Pezzi', String(catPezzi.reduce((a, i) => a + i.valore, 0)), v => nf(v, 0) + ' pz');
    recapCat = CATEGORIE.map(cat => {
      const g = attivi.filter(x => (x.p.categoria || 'ETB') === cat);
      if (!g.length) return null;
      const val = g.reduce((a, x) => a + x.valore, 0);
      const sp = g.reduce((a, x) => a + (x.costo || 0), 0);
      const valSp = g.filter(x => x.costo).reduce((a, x) => a + x.valore, 0);
      return {
        nome: cat, dotStyle: { width: '10px', height: '10px', borderRadius: '3px', background: CAT_COLORI[cat], display: 'inline-block', flex: 'none' }, prodotti: g.length + (g.length === 1 ? ' prodotto' : ' prodotti'),
        pezzi: g.reduce((a, x) => a + (x.p.qty || 0), 0) + ' pz', valore: eur(val),
        roiPct: sp ? pct((valSp - sp) / sp * 100) : 'n.d.', roiPill: pill(sp ? valSp - sp : 0),
        spesa: sp ? 'spesa ' + eur(sp) : 'spesa non inserita'
      };
    }).filter(Boolean).sort((a, b) => (parseEuro(b.valore) || 0) - (parseEuro(a.valore) || 0));
  }

  return {
    isColl: s.tab === 'collezione', isIns: s.tab === 'inserimento', isAn: s.tab === 'analytics',
    tabColl: tabS(s.tab === 'collezione'), tabIns: tabS(s.tab === 'inserimento'), tabAn: tabS(s.tab === 'analytics'),
    goCollH: H(() => setState({ tab: 'collezione' })), goInsH: H(() => setState({ tab: 'inserimento', msg: null })), goAnH: H(() => setState({ tab: 'analytics' })),
    onCsvFileH: H(e => { const file = e.target.files && e.target.files[0]; if (!file) return; const rd = new FileReader(); rd.onload = () => importa(String(rd.result)); rd.readAsText(file); e.target.value = ''; }),
    esportaCsvH: H(() => esporta()),
    resetDemoH: H(() => { if (window.confirm('Azzerare tutti i dati e ricaricare i 4 prodotti di esempio?')) { setD(demo()); setState({ open: null, msg: null }); } }),

    tot: {
      valore: eur(totV), prodotti: attivi.length, pezzi: attivi.reduce((a, x) => a + (x.p.qty || 0), 0),
      haVenduti: pezziVend > 0,
      profittoPct: profittoPctTot === null ? '—' : pct(profittoPctTot),
      profittoEuro: eurC(profittoTot),
      profittoPill: pill(profittoTot),
      venditeTesto: pezziVend + (pezziVend === 1 ? ' pezzo venduto' : ' pezzi venduti') + ' · incassato ' + eur(incassoTot),
      varTesto: pct(totVar), varEuro: eurC(totV - totPrev), pill: pill(totV - totPrev),
      roiPct: spesa ? pct(roiTot) : '—', roiEuro: spesa ? eurC(valConCosto - spesa) : 'nessuna spesa registrata',
      roiPill: pill(spesa ? valConCosto - spesa : 0),
      spesaTesto: spesa ? 'Spesa totale ' + eur(spesa) + ' su ' + nConCosto + (nConCosto === 1 ? ' prodotto' : ' prodotti') : 'Aggiungi la spesa d’acquisto in Inserimento'
    },
    q: s.q,
    onQH: H(e => setState({ q: e.target.value })),
    dropSort: (() => {
      const nessunaVar = !attivi.some(x => x.v !== null);
      const ord = ORDINI.map(o => [nessunaVar && o[1].indexOf('var') === 0 ? o[0] + ' (serve 2° rilevamento)' : o[0], o[1]]);
      return makeDrop('sort', (ord.find(o => o[1] === s.sort) || ord[0])[0], ord.map(o => o[0]),
        v => setState({ sort: (ord.find(o => o[0] === v) || ord[0])[1] }));
    })(),
    sortNota: s.sort.indexOf('var') === 0 && !attivi.some(x => x.v !== null)
      ? 'La variazione % confronta due rilevamenti: finché ogni prodotto ne ha uno solo vale 0,0% e l’ordine non cambia.' : '',
    dropStato: makeDrop('stato', statoF, ['In collezione', 'Venduti', 'Tutti'], v => setState({ statoFiltro: v })),
    dropCat: makeDrop('cat', s.catFiltro === 'Tutte' ? 'Tutte le categorie' : s.catFiltro, ['Tutte le categorie'].concat(CATEGORIE), v => setState({ catFiltro: v === 'Tutte le categorie' ? 'Tutte' : v })),
    dropLingua: makeDrop('lin', s.lingua === 'Tutte' ? 'Tutte le lingue' : s.lingua, ['Tutte le lingue'].concat(LINGUE), v => setState({ lingua: v === 'Tutte le lingue' ? 'Tutte' : v })),
    dropFLingua: makeDrop('flin', f.lingua, LINGUE, v => setF('lingua', v)),
    dropFCat: makeDrop('fcat', f.categoria, CATEGORIE, v => setF('categoria', v)),
    calData: makeCal('fdata', f.data, v => setF('data', v)),
    calAcq: makeCal('facq', f.dataAcq, v => setF('dataAcq', v)),
    nessunProdotto: cards.length === 0,
    cards: cards.map(x => ({
      id: x.p.id,
      nome: x.p.nome, lingua: x.p.lingua, qty: x.p.qty,
      categoria: x.p.categoria || 'ETB',
      catStyle: {
        fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
        borderRadius: '999px', padding: '3px 8px', color: '#fff',
        background: CAT_COLORI[x.p.categoria || 'ETB'] || '#5d6672'
      }, foto: x.p.foto || '', fotoStyle: fotoStyle(x.p.foto), senzaFoto: !x.p.foto, iniziali: iniz(x.p.nome),
      posizione: x.venduto ? eur(x.incasso || 0) : eur(x.valore), medio: eur(x.last ? x.last.avg : 0), minimo: eur(x.last ? x.last.min : 0),
      venduto: x.venduto,
      vendutoBadge: (() => { const u = x.vend.slice(-1)[0]; return u && u.data ? 'VENDUTO ' + dmy(u.data) : 'VENDUTO'; })(),
      primaData: x.rs.length ? dmy(x.rs[0].data) : '—', ultimaData: x.last ? dmy(x.last.data) : '—',
      puntiTesto: x.rs.length + (x.rs.length === 1 ? ' rilevamento' : ' rilevamenti'),
      varTesto: x.v === null ? '– 0,0%' : (x.v > 0 ? '▲ ' : x.v < 0 ? '▼ ' : '– ') + pct(x.v).replace('+', '').replace('−', ''),
      pill: pill(x.v || 0),
      roiEtichetta: x.venduto ? 'Profitto' : 'Vs acquisto',
      roiPct: x.venduto ? (x.profittoPct === null ? 'n.d.' : pct(x.profittoPct)) : (x.roi === null ? 'n.d.' : pct(x.roi)),
      roiPill: pill(x.venduto ? (x.profitto || 0) : (x.roi === null ? 0 : x.roiEuro)),
      roiTesto: x.venduto
        ? (x.profitto === null ? (x.incasso ? 'spesa d’acquisto non inserita' : 'prezzo di vendita non inserito')
          : eurC(x.profitto) + (x.costoVend ? ' su ' + eur(x.costoVend) : ' (spesa d’acquisto non inserita)'))
        : (x.costo === null ? 'spesa non inserita' : eurC(x.roiEuro) + ' su ' + eur(x.costo)),
      spark: sparkline(x.rs.map(r => r.avg), x.v === null || x.v >= 0 ? acc : NEG),
      apriH: H(() => setState({ open: x.p.id, espanse: {}, edit: null, range: 'Tutto', tip: null }))
    })),

    conferma: s.chiedi ? {
      titolo: 'Eliminare questo prodotto?',
      testo: 'Verranno rimossi il prodotto e tutto il suo storico di rilevamenti. L’operazione non è reversibile.',
      nome: s.chiedi.nome,
      meta: s.chiedi.n + (s.chiedi.n === 1 ? ' rilevamento' : ' rilevamenti') + ' · valore attuale ' + eur(s.chiedi.valore),
      annullaH: H(() => setState({ chiedi: null })),
      eseguiH: H(() => {
        const pid = s.chiedi.pid;
        setD({ prodotti: s.d.prodotti.filter(p => p.id !== pid), ril: s.d.ril.filter(r => r.pid !== pid) });
        setState({ chiedi: null, open: null, edit: null, espanse: {} });
      })
    } : null,

    formRil: s.nuovoRil && openP ? (() => {
      const e = s.nuovoRil, pv2 = parseValori(e.valori), nn = pv2.nums;
      const setR = (k, v) => setState(st => ({ nuovoRil: Object.assign({}, st.nuovoRil, { [k]: v }) }));
      const mn2 = nn.length ? Math.min.apply(null, nn) : null;
      const mx2 = nn.length ? Math.max.apply(null, nn) : null;
      const av2 = nn.length ? nn.reduce((a, b) => a + b, 0) / nn.length : null;
      return {
        valori: e.valori,
        onValoriH: H(ev => setR('valori', ev.target.value)),
        cal: makeCal('nril', e.data, v => setR('data', v || iso(new Date()))),
        conteggio: nn.length + '/10 valori riconosciuti' + (pv2.euroMode ? ' — presi i primi prezzi con €' : ''),
        conteggioStyle: { fontSize: '12px', fontWeight: 600, color: nn.length === 10 ? POS : nn.length ? '#c2410c' : '#5d6672' },
        min: nn.length ? eur(mn2) : '—', avg: nn.length ? eur(r2(av2)) : '—',
        max: nn.length ? eur(mx2) : '—', scarto: nn.length ? eur(r2(mx2 - mn2)) : '—',
        annullaH: H(() => setState({ nuovoRil: null })),
        salvaH: H(() => {
          if (!nn.length) return;
          const d = { prodotti: s.d.prodotti.slice(), ril: s.d.ril.concat([mkRil(openP.id, e.data, nn)]) };
          setD(d);
          setState({ nuovoRil: null, tip: null });
        })
      };
    })() : null,

    formP: s.editP ? (() => {
      const e = s.editP;
      const setP = (k, v) => setState(st => ({ editP: Object.assign({}, st.editP, { [k]: v }) }));
      return {
        nome: e.nome, qty: e.qty, costo: e.costo, costoUnit: e.costoUnit || '', foto: e.foto,
        senzaFoto: !e.foto, fotoStyle: fotoStyle(e.foto),
        costoNota: (() => {
          const t = parseEuro(e.costo), u = parseEuro(e.costoUnit);
          const q = Math.max(1, parseInt(e.qty, 10) || 1);
          if (!t && !u) return 'Compila uno dei due: l’altro si calcola automaticamente.';
          return eur(u || 0) + ' × ' + q + (q === 1 ? ' pezzo' : ' pezzi') + ' = ' + eur(t || 0) + ' totali';
        })(),
        onNomeH: H(ev => setP('nome', ev.target.value)),
        onQtyH: H(ev => setState(st => ({ editP: sincCosto(st.editP, 'qty', ev.target.value) }))),
        onCostoH: H(ev => setState(st => ({ editP: sincCosto(st.editP, 'costo', ev.target.value) }))),
        onCostoUnitH: H(ev => setState(st => ({ editP: sincCosto(st.editP, 'costoUnit', ev.target.value) }))),
        onFotoH: H(ev => setP('foto', String(ev.target.value || '').trim().replace(/^["'<]+|["'>]+$/g, ''))),
        pickFileH: H(() => { const el = document.getElementById('fotoFileInputEditP'); if (el) el.click(); }),
        onFileH: H(ev => {
          const file = ev.target.files && ev.target.files[0];
          if (!file) return;
          const rd = new FileReader();
          rd.onload = () => setP('foto', String(rd.result));
          rd.readAsDataURL(file);
          ev.target.value = '';
        }),
        menoH: H(() => setState(st => ({ editP: sincCosto(st.editP, 'qty', String(Math.max(1, (parseInt(st.editP.qty, 10) || 1) - 1))) }))),
        piuH: H(() => setState(st => ({ editP: sincCosto(st.editP, 'qty', String((parseInt(st.editP.qty, 10) || 1) + 1)) }))),
        dropLingua: makeDrop('plin', e.lingua, LINGUE, v => setP('lingua', v)),
        dropCat: makeDrop('pcat', e.categoria, CATEGORIE, v => setP('categoria', v)),
        cal: makeCal('pacq', e.dataAcq, v => setP('dataAcq', v)),
        annullaH: H(() => setState({ editP: null })),
        salvaH: H(() => {
          const nome = String(e.nome || '').trim();
          if (!nome) return;
          const d = {
            prodotti: s.d.prodotti.map(p => p.id !== e.pid ? p : Object.assign({}, p, {
              nome, qty: Math.max(1, parseInt(e.qty, 10) || 1), lingua: e.lingua,
              categoria: e.categoria, costo: parseEuro(e.costo), dataAcq: e.dataAcq || '', foto: e.foto || ''
            })),
            ril: s.d.ril.slice()
          };
          setD(d);
          setState({ editP: null });
        })
      };
    })() : null,

    dettaglio, chartDettaglio,
    chiudiH: H(() => setState({ open: null, edit: null, editP: null, nuovoRil: null })),
    stopH: H(e => e.stopPropagation()),

    f, senzaAnteprima: !f.foto, fotoAnteprimaStyle: fotoStyle(f.foto),
    nomiAperto: !!s.nomiAperto,
    apriNomiH: H(() => setState({ nomiAperto: true })),
    toggleNomiH: H(() => setState(st => ({ nomiAperto: !st.nomiAperto }))),
    chevronNomiStyle: { transform: s.nomiAperto ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .15s', color: '#5d6672' },
    nomi: (() => {
      const q = (f.nome || '').trim().toLowerCase();
      const esatto = prodotti.some(p => p.nome.toLowerCase() === q);
      const lista = (!q || esatto) ? prodotti : prodotti.filter(p => p.nome.toLowerCase().includes(q));
      return lista.slice(0, 40).map(p => ({
        nome: p.nome,
        meta: (p.categoria || 'ETB') + ' · ' + p.lingua + ' · ×' + (p.qty || 0),
        style: {
          display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', font: 'inherit',
          fontSize: '13px', fontWeight: 600, padding: '8px 10px', border: 'none', borderRadius: 10, cursor: 'pointer',
          background: p.nome.toLowerCase() === q ? '#f4f5f8' : 'transparent', color: '#16181c'
        },
        selH: H(() => {
          setState(st => ({
            f: Object.assign({}, st.f, {
              nome: p.nome, lingua: p.lingua, categoria: p.categoria || 'ETB', qty: p.qty, foto: p.foto,
              costo: parseEuro(p.costo) ? nf(parseEuro(p.costo), 2) : '',
              costoUnit: parseEuro(p.costo) ? nf(parseEuro(p.costo) / Math.max(1, p.qty || 1), 2) : '',
              dataAcq: p.dataAcq || ''
            }),
            forza: false, nomiAperto: false
          }));
        })
      }));
    })(),
    onFNomeH: H(e => {
      const v = e.target.value;
      const ex = prodotti.find(p => p.nome.toLowerCase() === v.trim().toLowerCase());
      const vuoto = { nome: '', lingua: 'Italiano', categoria: 'ETB', qty: 1, foto: '', costo: '', costoUnit: '', dataAcq: '' };
      const patch = !v.trim() ? vuoto
        : ex ? {
          nome: v, lingua: ex.lingua, categoria: ex.categoria || 'ETB', qty: ex.qty, foto: ex.foto,
          costo: parseEuro(ex.costo) ? nf(parseEuro(ex.costo), 2) : '',
          costoUnit: parseEuro(ex.costo) ? nf(parseEuro(ex.costo) / Math.max(1, ex.qty || 1), 2) : '',
          dataAcq: ex.dataAcq || ''
        } : { nome: v };
      setState(st => ({ f: Object.assign({}, st.f, patch), forza: false, nomiAperto: true, fotoStato: null }));
    }),
    onFCostoH: H(e => setState(st => ({ f: sincCosto(st.f, 'costo', e.target.value) }))),
    onFCostoUnitH: H(e => setState(st => ({ f: sincCosto(st.f, 'costoUnit', e.target.value) }))),
    costoNota: (() => {
      const c = parseEuro(f.costo);
      if (!c) return 'Totale speso per l’intera posizione (opzionale)';
      const qn = Math.max(1, parseInt(f.qty, 10) || 1);
      let t = eur(c / qn) + ' per pezzo';
      if (av) t += ' · vs medio attuale ' + pct((av * qn - c) / c * 100);
      return t;
    })(),
    onFQtyH: H(e => setState(st => ({ f: sincCosto(st.f, 'qty', e.target.value) }))),
    onFFotoH: H(e => {
      const url = String(e.target.value || '').trim().replace(/^["'<]+|["'>]+$/g, '');
      setF('foto', url);
      if (/^https?:\/\//i.test(url)) {
        setState({ fotoStato: 'carico' });
        const probe = new Image();
        probe.onload = () => setState(st => (st.f.foto === url ? { fotoStato: 'ok' } : null));
        probe.onerror = () => {
          const proxy = 'https://images.weserv.nl/?url=' + encodeURIComponent(url.replace(/^https?:\/\//i, ''));
          const p2 = new Image();
          p2.onload = () => setState(st => {
            if (st.f.foto !== url) return null;
            return { f: Object.assign({}, st.f, { foto: proxy }), fotoStato: 'ok' };
          });
          p2.onerror = () => setState(st => (st.f.foto === url ? { fotoStato: 'errore' } : null));
          p2.src = proxy;
        };
        probe.src = url;
      } else setState({ fotoStato: null });
    }),
    fotoNota: !f.foto ? 'Incolla il link diretto dell’immagine (.jpg, .png, .webp) oppure carica un file'
      : s.fotoStato === 'carico' ? 'Caricamento anteprima…'
      : s.fotoStato === 'errore' ? 'Link non caricabile: assicurati che finisca in .jpg/.png/.webp (tasto destro sull’immagine › Copia indirizzo immagine), oppure scaricala e usa File'
      : s.fotoStato === 'ok' ? 'Immagine caricata correttamente' : '',
    fotoNotaStyle: { fontSize: '12px', fontWeight: 600, marginTop: '6px', color: s.fotoStato === 'errore' ? '#dc2626' : s.fotoStato === 'ok' ? '#16a34a' : '#5d6672' },
    onFValoriH: H(e => setF('valori', e.target.value)),
    pickFotoH: H(() => { const el = document.getElementById('fotoFileInput'); if (el) el.click(); }),
    onFotoFileH: H(e => { const file = e.target.files && e.target.files[0]; if (!file) return; const rd = new FileReader(); rd.onload = () => setF('foto', String(rd.result)); rd.readAsDataURL(file); e.target.value = ''; }),
    matchTesto: esistente ? 'Prodotto già in collezione — il rilevamento sarà aggiunto al suo storico (' + rilOf(esistente.id).length + ' rilevamenti).' : (f.nome.trim() ? 'Nuovo prodotto: verrà creato in collezione.' : ''),
    matchStyle: { fontSize: '12px', fontWeight: 600, marginTop: '6px', color: esistente ? '#ef4444' : '#5d6672' },
    countTesto: nums.length + '/10 valori riconosciuti',
    countStyle: { color: ok10 ? POS : nums.length ? '#c2410c' : '#6b7280' },
    scartatiTesto: pv.euroMode
      ? 'Presi i primi ' + nums.length + ' prezzi con €' + (pv.extra ? ' — altri ' + pv.extra + ' ignorati' : '')
      : (pv.scartati ? pv.scartati + ' voci non numeriche ignorate' : ''),
    calc: { min: nums.length ? eur(mn) : '—', avg: nums.length ? eur(r2(av)) : '—', max: nums.length ? eur(mx) : '—', scarto: nums.length ? eur(r2(mx - mn)) : '—' },
    avviso: !nums.length ? '' : (nums.length !== 10 ? 'Attenzione: hai inserito ' + nums.length + ' valori invece di 10. Puoi comunque forzare il salvataggio.' : (pv.scartati ? 'Alcune voci non sono numeri e sono state ignorate.' : '')),
    etichettaSalva: s.forza && nums.length !== 10 ? 'Salva comunque' : 'Salva rilevamento',
    salvaH: H(() => salvaRilevamento()),

    incolla: s.incolla, incollaAperto: s.incollaAperto,
    toggleIncollaH: H(() => setState(st => ({ incollaAperto: !st.incollaAperto }))),
    onIncollaH: H(e => setState({ incolla: e.target.value })),
    incollaRighe: parseIncolla(s.incolla).map(r => ({
      nome: r.nome, qty: r.qty, lingua: r.lingua, categoria: r.categoria,
      catStyle: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', borderRadius: '999px', padding: '3px 8px', color: '#fff', background: CAT_COLORI[r.categoria] },
      prezzo: r.prezzo ? eur(r.prezzo) : '—',
      costo: r.costo ? eur(r.costo) : '—',
      dataAcq: r.dataAcq ? dmy(r.dataAcq) : '—',
      esiste: prodotti.some(p => p.nome.toLowerCase() === r.nome.toLowerCase()) ? 'aggiorna esistente' : 'nuovo'
    })),
    incollaConteggio: (() => {
      const n = parseIncolla(s.incolla).length;
      return n ? 'Riconosciute ' + n + (n === 1 ? ' riga' : ' righe') : 'Incolla le righe dal foglio di calcolo: nome, tipologia, stato, quantità, prezzo unitario, data di acquisto';
    })(),
    incollaHaRighe: parseIncolla(s.incolla).length > 0,
    incollaEtichetta: s.incollaAperto ? 'Chiudi' : 'Apri incollaggio',
    incollaBottone: 'Importa ' + parseIncolla(s.incolla).length + (parseIncolla(s.incolla).length === 1 ? ' riga' : ' righe'),
    importaIncollaH: H(() => {
      const righe = parseIncolla(s.incolla);
      if (!righe.length) return;
      const d = { prodotti: s.d.prodotti.slice(), ril: s.d.ril.slice() };
      let nuovi = 0, aggiornati = 0;
      righe.forEach(r => {
        const i = d.prodotti.findIndex(p => p.nome.toLowerCase() === r.nome.toLowerCase());
        if (i !== -1) {
          d.prodotti[i] = Object.assign({}, d.prodotti[i], {
            qty: r.qty, lingua: r.lingua, categoria: r.categoria,
            costo: r.costo !== null ? r.costo : d.prodotti[i].costo,
            dataAcq: r.dataAcq || d.prodotti[i].dataAcq
          });
          aggiornati++;
        } else {
          d.prodotti.push({ id: uid(), nome: r.nome, lingua: r.lingua, categoria: r.categoria, qty: r.qty, foto: '', costo: r.costo, dataAcq: r.dataAcq });
          nuovi++;
        }
      });
      persist(d);
      setState({
        d, incolla: '', incollaAperto: false, msgOk: true,
        msg: 'Importate ' + righe.length + ' righe: ' + nuovi + (nuovi === 1 ? ' prodotto nuovo' : ' prodotti nuovi') + ', ' + aggiornati + ' aggiornati. Aggiungi i rilevamenti di mercato per vedere valore e andamento.'
      });
    }),
    msg: s.msg,
    msgStyle: { padding: '13px 15px', fontSize: '13px', fontWeight: 600, borderRadius: '14px', color: s.msgOk ? '#166534' : '#991b1b', background: s.msgOk ? '#dcfce7' : '#fee2e2' },

    periodoLabel: s.periodo.toLowerCase(), datiOk, datiInsufficienti: !datiOk,
    pSetS: tabS(s.periodo === 'Settimanale'), pMenS: tabS(s.periodo === 'Mensile'), pAnnS: tabS(s.periodo === 'Annuale'),
    setSettH: H(() => setState({ periodo: 'Settimanale', tip: null })), setMensH: H(() => setState({ periodo: 'Mensile', tip: null })), setAnnH: H(() => setState({ periodo: 'Annuale', tip: null })),
    periodo, chartPortfolio, chartDivario, chartConfronto, composizione, classifica, highlights,
    tortaCapitale, tortaPezzi, recapCat,
    recap: [
      { titolo: 'Valore totale', valore: eur(totV), nota: prodotti.length + (prodotti.length === 1 ? ' prodotto' : ' prodotti') + ' · ' + prodotti.reduce((a, p) => a + (p.qty || 0), 0) + ' pezzi', pill: null },
      { titolo: 'Spesa complessiva', valore: spesa ? eur(spesa) : '—', nota: spesa ? nConCosto + (nConCosto === 1 ? ' prodotto con spesa' : ' prodotti con spesa') : 'nessuna spesa registrata', pill: null },
      { titolo: 'Rendimento vs acquisto', valore: spesa ? eurC(valConCosto - spesa) : '—', nota: spesa ? 'su ' + eur(spesa) + ' investiti' : 'inserisci la spesa in Inserimento', pill: spesa ? { testo: pct(roiTot), style: pill(valConCosto - spesa) } : null },
      { titolo: 'Variazione nel periodo', valore: datiOk ? periodo.varEuro : '—', nota: datiOk ? 'vs periodo precedente' : 'serve più di un rilevamento', pill: datiOk ? { testo: periodo.varPct, style: periodo.pill } : null }
    ],
    haProdotti: prodotti.length > 0
  };
}

/* ================================ HTML builders ================================ */

function renderHeader(V) {
  return `
  <header style="max-width:1240px;margin:0 auto 18px;background:#fff;border-radius:22px;box-shadow:0 4px 18px rgba(20,24,32,0.07);padding:10px 14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;position:sticky;top:14px;z-index:40">
    <div style="display:flex;align-items:center;gap:9px;margin-right:auto;font-size:20px;font-weight:800;letter-spacing:-0.02em">
      <span style="width:30px;height:30px;border-radius:9px;background:#ef4444;display:grid;place-items:center;color:#fff;font-size:14px;font-weight:800">P</span>
      Poke<span style="color:#ef4444;margin-left:-8px">Folio</span>
    </div>
    <nav style="display:flex;gap:4px">
      <button type="button" class="pk-btn" style="${styleAttr(V.tabColl)}" data-h="${V.goCollH}">Collezione</button>
      <button type="button" class="pk-btn" style="${styleAttr(V.tabIns)}" data-h="${V.goInsH}">Inserimento</button>
      <button type="button" class="pk-btn" style="${styleAttr(V.tabAn)}" data-h="${V.goAnH}">Analytics</button>
    </nav>
    <div style="display:flex;gap:6px;align-items:center;padding-left:12px;border-left:1px solid #e6e9ee">
      <button type="button" class="pk-btn" data-h="${V.esportaCsvH}">Esporta CSV</button>
      <button type="button" class="pk-btn" data-h="${H(() => { const el = document.getElementById('csvFileInput'); if (el) el.click(); })}">Importa CSV</button>
      <button type="button" class="pk-btn" style="color:#5d6672;box-shadow:none;background:transparent" data-h="${V.resetDemoH}">Azzera demo</button>
      <input type="file" accept=".csv,text/csv" id="csvFileInput" data-hchg="${V.onCsvFileH}" class="pk-hidden-file">
    </div>
  </header>`;
}

function renderCollezione(V) {
  return `
  <main style="max-width:1240px;margin:0 auto;display:flex;flex-direction:column;gap:16px">

    <div class="pk-card" style="padding:20px 22px;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:18px">
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#5d6672">Valore portfolio</div>
        <div class="num" style="font-size:34px;font-weight:800;letter-spacing:-0.03em;line-height:1.15">${esc(V.tot.valore)}</div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#5d6672">Variazione complessiva</div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:6px;flex-wrap:wrap">
          <span class="num" style="${styleAttr(V.tot.pill)}">${esc(V.tot.varTesto)}</span>
          <span class="num" style="font-size:14px;font-weight:700;color:#40474f">${esc(V.tot.varEuro)}</span>
        </div>
        <div style="font-size:11px;font-weight:500;color:#5d6672;margin-top:5px">vs rilevamento precedente</div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#5d6672">Rendimento vs acquisto</div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:6px;flex-wrap:wrap">
          <span class="num" style="${styleAttr(V.tot.roiPill)}">${esc(V.tot.roiPct)}</span>
          <span class="num" style="font-size:14px;font-weight:700;color:#40474f">${esc(V.tot.roiEuro)}</span>
        </div>
        <div class="num" style="font-size:11px;font-weight:500;color:#5d6672;margin-top:5px">${esc(V.tot.spesaTesto)}</div>
      </div>
      ${V.tot.haVenduti ? `
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#5d6672">Profitto realizzato</div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:6px;flex-wrap:wrap">
          <span class="num" style="${styleAttr(V.tot.profittoPill)}">${esc(V.tot.profittoPct)}</span>
          <span class="num" style="font-size:14px;font-weight:700;color:#40474f">${esc(V.tot.profittoEuro)}</span>
        </div>
        <div class="num" style="font-size:11px;font-weight:500;color:#5d6672;margin-top:5px">${esc(V.tot.venditeTesto)}</div>
      </div>` : ''}
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#5d6672">Prodotti</div>
        <div class="num" style="font-size:34px;font-weight:800;letter-spacing:-0.03em;line-height:1.15">${V.tot.prodotti}</div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#5d6672">Pezzi totali</div>
        <div class="num" style="font-size:34px;font-weight:800;letter-spacing:-0.03em;line-height:1.15">${V.tot.pezzi}</div>
      </div>
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
      <div style="flex:1 1 240px;min-width:0">
        <label class="pk-lb">Ricerca per nome</label>
        <input class="pk-in" data-field="q" value="${esc(V.q)}" data-hi="${V.onQH}" placeholder="Cerca un prodotto">
      </div>
      <div style="flex:0 1 210px;position:relative" data-drop="1">
        <label class="pk-lb">Ordina per</label>
        ${renderDropField(V.dropSort)}
        ${V.sortNota ? `<div style="position:absolute;top:calc(100% + 4px);left:0;width:250px;font-size:11px;font-weight:600;line-height:1.35;color:#8a929e;text-wrap:pretty">${esc(V.sortNota)}</div>` : ''}
      </div>
      <div style="flex:0 1 160px;position:relative" data-drop="1">
        <label class="pk-lb">Stato</label>
        ${renderDropField(V.dropStato)}
      </div>
      <div style="flex:0 1 200px;position:relative" data-drop="1">
        <label class="pk-lb">Categoria</label>
        ${renderDropField(V.dropCat)}
      </div>
      <div style="flex:0 1 180px;position:relative" data-drop="1">
        <label class="pk-lb">Lingua</label>
        ${renderDropField(V.dropLingua)}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">
      ${V.cards.map(c => `
        <div class="pk-card" style="padding:14px;cursor:pointer;display:flex;flex-direction:column;gap:12px" data-h="${c.apriH}">
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:84px;height:84px;flex:none;border-radius:14px;background:#fff;overflow:hidden;display:grid;place-items:center">
              ${c.foto ? `<div role="img" aria-label="${esc(c.nome)}" style="${styleAttr(c.fotoStyle)}"></div>` : `<div style="font-size:22px;font-weight:800;color:#c9cfd9">${esc(c.iniziali)}</div>`}
            </div>
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px">
              <div style="font-size:15px;font-weight:700;line-height:1.25;letter-spacing:-0.01em">${esc(c.nome)}</div>
              <div style="display:flex;gap:5px;flex-wrap:wrap">
                <span style="${styleAttr(c.catStyle)}">${esc(c.categoria)}</span>
                <span style="font-size:10px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;background:#e9ecf1;color:#5d6672;border-radius:999px;padding:3px 8px">${esc(c.lingua)}</span>
                <span style="font-size:10px;font-weight:700;background:#e9ecf1;color:#5d6672;border-radius:999px;padding:3px 8px">×${c.qty}</span>
                ${c.venduto ? `<span class="num" style="font-size:10px;font-weight:800;letter-spacing:0.05em;background:#16181c;color:#fff;border-radius:999px;padding:3px 8px">${esc(c.vendutoBadge)}</span>` : ''}
              </div>
              <div class="num" style="font-size:22px;font-weight:800;letter-spacing:-0.03em">${esc(c.posizione)}</div>
            </div>
          </div>

          <div style="background:#fff;border-radius:14px;padding:10px 12px;display:flex;flex-direction:column;gap:6px">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:#5d6672">
                <span style="width:7px;height:7px;border-radius:50%;background:#ef4444"></span>Andamento prezzo medio
              </span>
              <span class="num" style="${styleAttr(c.pill)}">${esc(c.varTesto)}</span>
            </div>
            ${c.spark}
            <div class="num" style="display:flex;justify-content:space-between;font-size:10px;font-weight:600;color:#6b7280">
              <span>${esc(c.primaData)}</span>
              <span>${esc(c.puntiTesto)}</span>
              <span>${esc(c.ultimaData)}</span>
            </div>
          </div>

          <div class="num" style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;color:#5d6672">
            <span>Medio ${esc(c.medio)}</span>
            <span style="color:#5d6672">Min ${esc(c.minimo)}</span>
          </div>

          <div style="border-top:1px solid #e6e9ee;padding-top:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#5d6672">${esc(c.roiEtichetta)}</span>
            <span class="num" style="${styleAttr(c.roiPill)}">${esc(c.roiPct)}</span>
            <span class="num" style="font-size:12px;font-weight:700;color:#40474f;margin-left:auto">${esc(c.roiTesto)}</span>
          </div>
        </div>`).join('')}
    </div>

    ${V.nessunProdotto ? `<div class="pk-card" style="padding:28px;text-align:center;font-size:14px;font-weight:500;color:#5d6672">Nessun prodotto corrisponde ai filtri. Aggiungi un rilevamento dalla sezione Inserimento.</div>` : ''}
  </main>`;
}

function renderInserimento(V) {
  return `
  <main style="max-width:820px;margin:0 auto;display:flex;flex-direction:column;gap:14px">
    <h2 style="margin:0;font-size:26px;font-weight:800;letter-spacing:-0.03em">Nuovo rilevamento</h2>

    ${V.msg ? `<div style="${styleAttr(V.msgStyle)}">${esc(V.msg)}</div>` : ''}

    <div class="pk-card" style="padding:20px;display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <div style="margin-right:auto">
          <div style="font-size:16px;font-weight:800;letter-spacing:-0.02em">Incolla dal foglio di calcolo</div>
          <div style="font-size:12px;font-weight:500;color:#5d6672">Nome, lingua, categoria, quantità, prezzo e data di acquisto vengono riconosciuti da soli</div>
        </div>
        <button type="button" class="pk-btn" data-h="${V.toggleIncollaH}">${esc(V.incollaEtichetta)}</button>
      </div>

      ${V.incollaAperto ? `
      <div style="display:flex;flex-direction:column;gap:12px">
        <textarea class="pk-in num" style="min-height:140px;line-height:1.7" data-field="incolla" data-hi="${V.onIncollaH}" placeholder="ETB Ascesa Eroica ITA&#9;Sealed&#9;In Magazzino&#9;5&#9;€55,00&#9;09/04/2026">${esc(V.incolla)}</textarea>
        <div style="font-size:12px;font-weight:600;color:#5d6672">${esc(V.incollaConteggio)}</div>
        ${V.incollaHaRighe ? `
        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="background:#fff;border-radius:16px;padding:12px;overflow-x:auto">
            <table class="pk-t">
              <thead><tr><th>Prodotto</th><th>Categoria</th><th>Lingua</th><th style="text-align:right">Qtà</th><th style="text-align:right">Prezzo unit.</th><th style="text-align:right">Spesa totale</th><th style="text-align:right">Data acquisto</th><th></th></tr></thead>
              <tbody>
                ${V.incollaRighe.map(ir => `
                <tr>
                  <td style="font-weight:700">${esc(ir.nome)}</td>
                  <td><span style="${styleAttr(ir.catStyle)}">${esc(ir.categoria)}</span></td>
                  <td style="color:#5d6672">${esc(ir.lingua)}</td>
                  <td class="num" style="text-align:right">${ir.qty}</td>
                  <td class="num" style="text-align:right">${esc(ir.prezzo)}</td>
                  <td class="num" style="text-align:right;font-weight:700">${esc(ir.costo)}</td>
                  <td class="num" style="text-align:right">${esc(ir.dataAcq)}</td>
                  <td style="text-align:right;color:#5d6672;font-size:11px">${esc(ir.esiste)}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
          <button type="button" class="pk-btn pk-red" style="width:100%;padding:13px;font-size:14px" data-h="${V.importaIncollaH}">${esc(V.incollaBottone)}</button>
        </div>` : ''}
      </div>` : ''}
    </div>

    <div class="pk-card" style="padding:20px;display:flex;flex-direction:column;gap:16px">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px">
        <div style="grid-column:1/-1;position:relative" data-drop="1">
          <label class="pk-lb">Nome del prodotto</label>
          <div style="position:relative;display:flex;align-items:center">
            <input class="pk-in" style="padding-right:40px" data-field="f.nome" value="${esc(V.f.nome)}" data-hi="${V.onFNomeH}" data-h="${V.apriNomiH}" placeholder="Es. Phantasmal Flames Elite Trainer Box" autocomplete="off">
            <button type="button" title="Mostra i prodotti già inseriti" data-h="${V.toggleNomiH}" style="position:absolute;right:6px;display:flex;align-items:center;justify-content:center;width:30px;height:30px;border:none;background:transparent;border-radius:9px;cursor:pointer">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${styleAttr(V.chevronNomiStyle)}"><path d="M6 9l6 6 6-6"></path></svg>
            </button>
          </div>
          ${V.nomiAperto ? `
          <div style="position:absolute;top:calc(100% + 6px);left:0;right:0;z-index:60;background:#fff;border-radius:14px;box-shadow:0 12px 34px rgba(20,24,32,0.16);padding:6px;display:flex;flex-direction:column;gap:2px;max-height:264px;overflow:auto">
            ${V.nomi.map(n => `<button type="button" class="pk-opt" style="${styleAttr(n.style)}" data-h="${n.selH}"><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(n.nome)}</span><span style="font-size:11px;font-weight:700;color:#8a929e;flex:none">${esc(n.meta)}</span></button>`).join('')}
          </div>` : ''}
          <div style="${styleAttr(V.matchStyle)}">${esc(V.matchTesto)}</div>
        </div>
        <div>
          <label class="pk-lb">Quantità posseduta</label>
          <input class="pk-in num" type="number" min="1" step="1" data-field="f.qty" value="${esc(V.f.qty)}" data-hi="${V.onFQtyH}">
        </div>
        <div style="position:relative" data-drop="1">
          <label class="pk-lb">Lingua</label>
          ${renderDropField(V.dropFLingua)}
        </div>
        <div style="position:relative" data-drop="1">
          <label class="pk-lb">Categoria</label>
          ${renderDropField(V.dropFCat)}
        </div>
        <div style="position:relative" data-drop="1">
          <label class="pk-lb">Data del rilevamento</label>
          ${renderCalField(V.calData, 'oggi')}
        </div>
        <div>
          <label class="pk-lb">Spesa all'acquisto — totale €</label>
          <input class="pk-in num" type="text" inputmode="decimal" data-field="f.costo" value="${esc(V.f.costo)}" data-hi="${V.onFCostoH}" placeholder="Es. 89,90">
          <div class="num" style="font-size:12px;font-weight:600;color:#5d6672;margin-top:6px">${esc(V.costoNota)}</div>
        </div>
        <div>
          <label class="pk-lb">Prezzo unitario €</label>
          <input class="pk-in num" type="text" inputmode="decimal" data-field="f.costoUnit" value="${esc(V.f.costoUnit)}" data-hi="${V.onFCostoUnitH}" placeholder="Es. 44,95">
          <div class="num" style="font-size:12px;font-weight:600;color:#5d6672;margin-top:6px">Compila totale o unitario: l'altro si calcola.</div>
        </div>
        <div style="position:relative" data-drop="1">
          <label class="pk-lb">Data di acquisto</label>
          ${renderCalField(V.calAcq, 'both')}
        </div>
        <div>
          <label class="pk-lb">Foto — URL oppure file</label>
          <div style="display:flex;gap:8px;align-items:center">
            <input class="pk-in" data-field="f.foto" value="${esc(V.f.foto)}" data-hi="${V.onFFotoH}" placeholder="https://…">
            <button type="button" class="pk-btn" style="flex:none" data-h="${V.pickFotoH}">File</button>
            <input type="file" accept="image/*" id="fotoFileInput" data-hchg="${V.onFotoFileH}" class="pk-hidden-file">
          </div>
          <div style="${styleAttr(V.fotoNotaStyle)}">${esc(V.fotoNota)}</div>
        </div>
        <div style="display:flex;align-items:flex-end">
          <div style="width:78px;height:78px;border-radius:14px;background:#fff;overflow:hidden;display:grid;place-items:center;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#c9cfd9">
            ${V.f.foto ? `<div role="img" aria-label="Anteprima" style="${styleAttr(V.fotoAnteprimaStyle)}"></div>` : `<span>anteprima</span>`}
          </div>
        </div>
      </div>

      <div>
        <label class="pk-lb">10 valori di mercato — numeri sciolti oppure incolla l'elenco delle offerte</label>
        <textarea class="pk-in num" style="min-height:120px;line-height:1.7" data-field="f.valori" data-hi="${V.onFValoriH}" placeholder="9,50 9,80 10 10,20 10,50 10,90 11 11,20 11,50 12&#10;— oppure incolla direttamente le offerte: verranno presi i primi 10 prezzi con €">${esc(V.f.valori)}</textarea>
        <div style="display:flex;justify-content:space-between;gap:8px;margin-top:7px;font-size:12px;font-weight:600">
          <span class="num" style="${styleAttr(V.countStyle)}">${esc(V.countTesto)}</span>
          <span class="num" style="color:#6b7280">${esc(V.scartatiTesto)}</span>
        </div>
      </div>

      <div style="background:#fff;border-radius:16px;padding:16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:14px">
        <div><div style="font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:#5d6672">Prezzo minimo</div><div class="num" style="font-size:23px;font-weight:800;letter-spacing:-0.03em">${esc(V.calc.min)}</div></div>
        <div><div style="font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:#ef4444">Prezzo medio</div><div class="num" style="font-size:23px;font-weight:800;letter-spacing:-0.03em;color:#ef4444">${esc(V.calc.avg)}</div></div>
        <div><div style="font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:#5d6672">Massimo</div><div class="num" style="font-size:23px;font-weight:800;letter-spacing:-0.03em">${esc(V.calc.max)}</div></div>
        <div><div style="font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:#5d6672">Scarto max−min</div><div class="num" style="font-size:23px;font-weight:800;letter-spacing:-0.03em">${esc(V.calc.scarto)}</div></div>
      </div>

      ${V.avviso ? `<div style="font-size:13px;font-weight:600;color:#c2410c;background:#fff7ed;border-radius:12px;padding:10px 12px">${esc(V.avviso)}</div>` : ''}

      <button type="button" class="pk-btn pk-red" style="width:100%;padding:14px;font-size:15px" data-h="${V.salvaH}">${esc(V.etichettaSalva)}</button>
    </div>
  </main>`;
}

function renderAnalytics(V) {
  let html = `
  <main style="max-width:1240px;margin:0 auto;display:flex;flex-direction:column;gap:16px">
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <h2 style="margin:0;margin-right:auto;font-size:26px;font-weight:800;letter-spacing:-0.03em">Analytics</h2>
      <div style="display:flex;gap:4px;background:#fff;border-radius:999px;padding:4px;box-shadow:0 1px 2px rgba(20,24,32,0.06)">
        <button type="button" class="pk-btn" style="${styleAttr(V.pSetS)}" data-h="${V.setSettH}">Settimanale</button>
        <button type="button" class="pk-btn" style="${styleAttr(V.pMenS)}" data-h="${V.setMensH}">Mensile</button>
        <button type="button" class="pk-btn" style="${styleAttr(V.pAnnS)}" data-h="${V.setAnnH}">Annuale</button>
      </div>
    </div>`;

  if (V.haProdotti) {
    html += `<div style="display:flex;flex-direction:column;gap:16px">
      <div class="pk-card" style="padding:20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:18px">
        ${V.recap.map(rc => `
        <div style="display:flex;flex-direction:column;gap:4px">
          <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#5d6672">${esc(rc.titolo)}</div>
          <div class="num" style="font-size:27px;font-weight:800;letter-spacing:-0.03em;line-height:1.15">${esc(rc.valore)}</div>
          ${rc.pill ? `<span class="num" style="${styleAttr(rc.pill.style)}">${esc(rc.pill.testo)}</span>` : ''}
          <div class="num" style="font-size:11px;font-weight:600;color:#6b7280">${esc(rc.nota)}</div>
        </div>`).join('')}
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:16px">
        <div class="pk-card" style="padding:20px;display:flex;flex-direction:column;gap:14px">
          <div><div style="font-size:19px;font-weight:800;letter-spacing:-0.02em">Capitale per categoria</div>
          <div style="font-size:12px;font-weight:500;color:#5d6672">Quanto valore è investito in ETB, singole, gradate, box, bundle, mini tin e collezioni speciali</div></div>
          ${V.tortaCapitale || ''}
        </div>
        <div class="pk-card" style="padding:20px;display:flex;flex-direction:column;gap:14px">
          <div><div style="font-size:19px;font-weight:800;letter-spacing:-0.02em">Pezzi per categoria</div>
          <div style="font-size:12px;font-weight:500;color:#5d6672">Numero di pezzi posseduti per ciascuna categoria</div></div>
          ${V.tortaPezzi || ''}
        </div>
      </div>

      <div class="pk-card" style="padding:20px;display:flex;flex-direction:column;gap:12px">
        <div style="font-size:19px;font-weight:800;letter-spacing:-0.02em">Recap per categoria</div>
        <div style="overflow-x:auto">
          <table class="pk-t">
            <thead><tr><th>Categoria</th><th>Prodotti</th><th>Pezzi</th><th style="text-align:right">Valore</th><th style="text-align:right">Vs acquisto</th></tr></thead>
            <tbody>
              ${V.recapCat.map(rc => `
              <tr>
                <td><span style="display:inline-flex;align-items:center;gap:9px;font-weight:700"><span style="${styleAttr(rc.dotStyle)}"></span>${esc(rc.nome)}</span></td>
                <td style="color:#5d6672">${esc(rc.prodotti)}</td>
                <td class="num" style="color:#5d6672">${esc(rc.pezzi)}</td>
                <td class="num" style="text-align:right;font-weight:700">${esc(rc.valore)}</td>
                <td style="text-align:right">
                  <span class="num" style="${styleAttr(rc.roiPill)}">${esc(rc.roiPct)}</span>
                  <div class="num" style="font-size:11px;font-weight:600;color:#6b7280;margin-top:3px">${esc(rc.spesa)}</div>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      ${V.datiInsufficienti ? `
      <div class="pk-card" style="padding:28px;text-align:center;display:flex;flex-direction:column;gap:6px">
        <div style="font-size:17px;font-weight:800;letter-spacing:-0.02em">Andamento nel tempo non disponibile per il periodo ${esc(V.periodoLabel)}</div>
        <div style="font-size:13px;font-weight:500;color:#5d6672">Servono almeno due rilevamenti in periodi distinti. Aggiungi rilevamenti o scegli un periodo più ampio.</div>
      </div>` : ''}

      ${V.datiOk ? `
      <div style="display:flex;flex-direction:column;gap:16px">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px">
        ${V.highlights.map(h => `
        <div class="pk-card" style="padding:16px;display:flex;flex-direction:column;gap:5px">
          <div style="font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:#5d6672">${esc(h.titolo)}</div>
          <div style="font-size:14px;font-weight:700;line-height:1.3">${esc(h.nome)}</div>
          <div class="num" style="${styleAttr(h.style)}">${esc(h.valore)}</div>
          <div class="num" style="font-size:11px;font-weight:600;color:#6b7280">${esc(h.nota)}</div>
        </div>`).join('')}
      </div>

      <div class="pk-card" style="padding:20px;display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <div style="font-size:19px;font-weight:800;letter-spacing:-0.02em;margin-right:auto">Andamento del portfolio</div>
          <span class="num" style="${styleAttr(V.periodo.pill)}">${esc(V.periodo.varPct)}</span>
          <span class="num" style="font-size:13px;font-weight:700;color:#40474f">${esc(V.periodo.varEuro)}</span>
          <span style="font-size:11px;font-weight:600;color:#6b7280">vs periodo precedente</span>
        </div>
        <div style="background:#fff;border-radius:16px;padding:12px">${V.chartPortfolio || ''}</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr;gap:16px">
        <div class="pk-card" style="padding:20px;display:flex;flex-direction:column;gap:14px">
          <div style="font-size:19px;font-weight:800;letter-spacing:-0.02em">Composizione del portfolio</div>
          <div style="display:flex;flex-direction:column;gap:11px">
            ${V.composizione.map(c => `
            <div style="display:flex;flex-direction:column;gap:5px">
              <div style="display:flex;justify-content:space-between;gap:10px;font-size:13px;font-weight:600">
                <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.nome)}</span>
                <span class="num" style="color:#5d6672;flex:none">${esc(c.valore)} · ${esc(c.pct)}</span>
              </div>
              <div style="height:9px;border-radius:999px;background:#e6e9ee;overflow:hidden"><div style="${styleAttr(c.barStyle)}"></div></div>
            </div>`).join('')}
          </div>
        </div>

        <div class="pk-card" style="padding:20px;display:flex;flex-direction:column;gap:10px">
          <div style="font-size:19px;font-weight:800;letter-spacing:-0.02em">Divario minimo / medio</div>
          <div style="font-size:12px;font-weight:500;color:#5d6672">Distanza aggregata tra prezzo minimo e prezzo medio, pesata sulle quantità</div>
          <div style="background:#fff;border-radius:16px;padding:12px">${V.chartDivario || ''}</div>
        </div>
      </div>

      <div class="pk-card" style="padding:20px;display:flex;flex-direction:column;gap:12px">
        <div style="font-size:19px;font-weight:800;letter-spacing:-0.02em">Confronto prodotti — prezzo medio</div>
        <div style="background:#fff;border-radius:16px;padding:12px">${V.chartConfronto || ''}</div>
      </div>

      <div class="pk-card" style="padding:20px;display:flex;flex-direction:column;gap:12px">
        <div style="font-size:19px;font-weight:800;letter-spacing:-0.02em">Classifica movimenti</div>
        <div style="overflow-x:auto">
          <table class="pk-t">
            <thead><tr><th>Prodotto</th><th>Lingua</th><th style="text-align:right">Valore prec.</th><th style="text-align:right">Valore attuale</th><th style="text-align:right">Δ €</th><th style="text-align:right">Δ %</th></tr></thead>
            <tbody>
              ${V.classifica.map(r => `
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:10px;min-width:190px">
                    <div style="width:36px;height:36px;flex:none;border-radius:10px;background:#fff;overflow:hidden;display:grid;place-items:center;font-size:12px;font-weight:800;color:#c9cfd9">
                      ${r.foto ? `<div role="img" aria-label="${esc(r.nome)}" style="${styleAttr(r.fotoStyle)}"></div>` : `<span>${esc(r.iniziali)}</span>`}
                    </div>
                    <span style="font-weight:700">${esc(r.nome)}</span>
                  </div>
                </td>
                <td style="color:#5d6672">${esc(r.lingua)}</td>
                <td class="num" style="text-align:right">${esc(r.prec)}</td>
                <td class="num" style="text-align:right;font-weight:700">${esc(r.att)}</td>
                <td class="num" style="${styleAttr(r.dStyle)}">${esc(r.dEuro)}</td>
                <td class="num" style="${styleAttr(r.dStyle)}">${esc(r.dPct)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      </div>` : ''}
    </div>`;
  }

  html += `</main>`;
  return html;
}

function renderConferma(V) {
  if (!V.conferma) return '';
  const c = V.conferma;
  return `
  <div style="position:fixed;inset:0;z-index:80;background:rgba(22,24,28,0.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:18px" data-h="${c.annullaH}">
    <div style="width:min(430px,100%);background:#f4f5f8;border-radius:22px;padding:22px;box-shadow:0 24px 60px rgba(20,24,32,0.32);display:flex;flex-direction:column;gap:14px" data-h="${V.stopH}">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:42px;height:42px;flex:none;border-radius:13px;background:#fee2e2;color:#dc2626;display:grid;place-items:center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 6h18"></path><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"></path><path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path>
          </svg>
        </div>
        <div style="font-size:19px;font-weight:800;letter-spacing:-0.02em;line-height:1.2">${esc(c.titolo)}</div>
      </div>
      <div style="font-size:13px;font-weight:500;color:#40474f;line-height:1.55">${esc(c.testo)}</div>
      <div style="background:#fff;border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:4px">
        <div style="font-size:14px;font-weight:700;line-height:1.3">${esc(c.nome)}</div>
        <div class="num" style="font-size:12px;font-weight:600;color:#5d6672">${esc(c.meta)}</div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">
        <button type="button" class="pk-btn" data-h="${c.annullaH}">Annulla</button>
        <button type="button" class="pk-btn pk-red" data-h="${c.eseguiH}">Sì, elimina definitivamente</button>
      </div>
    </div>
  </div>`;
}

function renderDettaglio(V) {
  if (!V.dettaglio) return '';
  const d = V.dettaglio;
  let html = `
  <div style="position:fixed;inset:0;z-index:60;background:rgba(22,24,28,0.42);backdrop-filter:blur(3px);display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow-y:auto" data-h="${V.chiudiH}">
    <div style="width:min(940px,100%);margin:auto;background:#eceef2;border-radius:24px;padding:16px;box-shadow:0 24px 60px rgba(20,24,32,0.3);display:flex;flex-direction:column;gap:14px" data-h="${V.stopH}">

      <div class="pk-card" style="padding:16px;display:flex;gap:14px;align-items:flex-start">
        <div style="width:88px;height:88px;flex:none;border-radius:16px;background:#fff;overflow:hidden;display:grid;place-items:center;font-size:24px;font-weight:800;color:#c9cfd9">
          ${d.foto ? `<div role="img" aria-label="${esc(d.nome)}" style="${styleAttr(d.fotoStyle)}"></div>` : `<span>${esc(d.iniziali)}</span>`}
        </div>
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px">
          <div style="font-size:24px;font-weight:800;letter-spacing:-0.03em;line-height:1.15">${esc(d.nome)}</div>
          <div class="num" style="font-size:12px;font-weight:600;color:#5d6672">${esc(d.lingua)} · ×${d.qty} · ${d.nRil} rilevamenti</div>
          <div class="num" style="font-size:12px;font-weight:600;color:#5d6672">${esc(d.acquistoTesto)}</div>
          <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">
            <span class="num" style="font-size:30px;font-weight:800;letter-spacing:-0.03em">${esc(d.posizione)}</span>
            <span class="num" style="${styleAttr(d.pill)}">${esc(d.varTesto)}</span>
            <span class="num" style="${styleAttr(d.roiPill)}">${esc(d.roiTesto)}</span>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex:none;flex-wrap:wrap;justify-content:flex-end">
          <button type="button" class="pk-btn" style="display:inline-flex;align-items:center;gap:7px" data-h="${d.apriModificaH}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
            ${esc(d.etichettaModificaProdotto)}
          </button>
          ${d.puoVendere ? `
          <button type="button" class="pk-btn" style="display:inline-flex;align-items:center;gap:7px" title="Registra una vendita" data-h="${d.apriVendiH}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 7H6"></path><circle cx="10" cy="20" r="1"></circle><circle cx="18" cy="20" r="1"></circle></svg>
            ${esc(d.etichettaVendi)}
          </button>` : ''}
          <button type="button" class="pk-btn" style="color:#dc2626;display:inline-flex;align-items:center;gap:7px" title="Elimina il prodotto e tutti i suoi rilevamenti" data-h="${d.eliminaProdottoH}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"></path><path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>
            Elimina
          </button>
          <button type="button" class="pk-btn" data-h="${V.chiudiH}">Chiudi</button>
        </div>
      </div>`;

  if (d.vendiForm) {
    const vf = d.vendiForm;
    html += `
      <div class="pk-card" style="padding:16px;display:flex;flex-direction:column;gap:14px">
        <div style="font-size:15px;font-weight:800;letter-spacing:-0.02em">Registra una vendita</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px">
          <div>
            <label class="pk-lb">Quantità venduta</label>
            <div style="display:flex;gap:8px;align-items:center">
              <button type="button" class="pk-btn" style="padding:9px 14px;font-size:16px;background:#fff" data-h="${vf.menoH}">−</button>
              <input class="pk-in num" style="text-align:center" type="number" min="1" data-field="vendi.qty" value="${esc(vf.qty)}" data-hi="${vf.onQtyH}">
              <button type="button" class="pk-btn" style="padding:9px 14px;font-size:16px;background:#fff" data-h="${vf.piuH}">+</button>
            </div>
            <div class="num" style="font-size:12px;font-weight:600;color:#5d6672;margin-top:6px">${esc(vf.maxTesto)}</div>
          </div>
          <div><label class="pk-lb">Prezzo di vendita — totale €</label><input class="pk-in num" type="text" inputmode="decimal" data-field="vendi.costo" value="${esc(vf.prezzo)}" data-hi="${vf.onPrezzoH}" placeholder="Es. 70,00"></div>
          <div><label class="pk-lb">Prezzo unitario €</label><input class="pk-in num" type="text" inputmode="decimal" data-field="vendi.costoUnit" value="${esc(vf.prezzoUnit)}" data-hi="${vf.onPrezzoUnitH}" placeholder="Es. 70,00"></div>
          <div style="position:relative" data-drop="1">
            <label class="pk-lb">Data di vendita</label>
            ${renderCalField(vf.cal, 'none')}
          </div>
        </div>
        <div style="background:#f4f5f8;border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:6px">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <span class="num" style="font-size:13px;font-weight:700;color:#16181c">${esc(vf.incassoTesto)}</span>
            <span class="num" style="${styleAttr(vf.profittoStyle)}">${esc(vf.profittoTesto)}</span>
          </div>
          <div class="num" style="font-size:13px;font-weight:700;color:#16181c">${esc(vf.restoTesto)}</div>
          <div class="num" style="font-size:12px;font-weight:600;color:#5d6672">${esc(vf.restoSpesa)}</div>
          <div class="num" style="font-size:12px;font-weight:600;color:#5d6672">${esc(vf.restoValore)}</div>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button type="button" class="pk-btn" style="box-shadow:none;background:#f4f5f8" data-h="${vf.annullaH}">Annulla</button>
          <button type="button" class="pk-btn" style="background:#16181c;color:#fff" data-h="${vf.confermaH}">Conferma vendita</button>
        </div>
      </div>`;
  }

  if (d.haVendite) {
    html += `
      <div class="pk-card" style="padding:16px;display:flex;flex-direction:column;gap:10px">
        <div class="num" style="font-size:13px;font-weight:800;letter-spacing:-0.01em">${esc(d.venditeTitolo)}</div>
        ${d.venditeRighe.map(w => `
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-top:1px solid #e6e9ee;padding-top:8px">
          <span class="num" style="font-size:13px;font-weight:600;color:#40474f;margin-right:auto">${esc(w.testo)}</span>
          <span class="num" style="${styleAttr(w.style)}">${esc(w.profitto)}</span>
        </div>`).join('')}
      </div>`;
  }

  if (V.formP) {
    const fp = V.formP;
    html += `
      <div class="pk-card" style="padding:16px;display:flex;flex-direction:column;gap:14px">
        <div style="font-size:15px;font-weight:800;letter-spacing:-0.02em">Modifica prodotto</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
          <div style="grid-column:1/-1"><label class="pk-lb">Nome del prodotto</label><input class="pk-in" data-field="editP.nome" value="${esc(fp.nome)}" data-hi="${fp.onNomeH}"></div>
          <div>
            <label class="pk-lb">Quantità posseduta</label>
            <div style="display:flex;gap:8px;align-items:center">
              <button type="button" class="pk-btn" style="padding:9px 14px;font-size:16px;background:#fff" data-h="${fp.menoH}">−</button>
              <input class="pk-in num" type="text" inputmode="numeric" style="text-align:center" data-field="editP.qty" value="${esc(fp.qty)}" data-hi="${fp.onQtyH}">
              <button type="button" class="pk-btn" style="padding:9px 14px;font-size:16px;background:#fff" data-h="${fp.piuH}">+</button>
            </div>
          </div>
          <div style="position:relative" data-drop="1"><label class="pk-lb">Lingua</label>${renderDropField(fp.dropLingua)}</div>
          <div style="position:relative" data-drop="1"><label class="pk-lb">Categoria</label>${renderDropField(fp.dropCat)}</div>
          <div><label class="pk-lb">Spesa all'acquisto — totale €</label><input class="pk-in num" type="text" inputmode="decimal" data-field="editP.costo" value="${esc(fp.costo)}" data-hi="${fp.onCostoH}" placeholder="Es. 89,90"></div>
          <div>
            <label class="pk-lb">Prezzo unitario €</label>
            <input class="pk-in num" type="text" inputmode="decimal" data-field="editP.costoUnit" value="${esc(fp.costoUnit)}" data-hi="${fp.onCostoUnitH}" placeholder="Es. 44,95">
            <div class="num" style="font-size:12px;font-weight:600;color:#5d6672;margin-top:6px">${esc(fp.costoNota)}</div>
          </div>
          <div style="position:relative" data-drop="1"><label class="pk-lb">Data di acquisto</label>${renderCalField(fp.cal, 'both')}</div>
          <div style="grid-column:1/-1;display:flex;gap:12px;align-items:flex-end">
            <div style="flex:1;min-width:0">
              <label class="pk-lb">Foto — URL oppure file</label>
              <div style="display:flex;gap:8px;align-items:center">
                <input class="pk-in" data-field="editP.foto" value="${esc(fp.foto)}" data-hi="${fp.onFotoH}" placeholder="https://…">
                <button type="button" class="pk-btn" style="flex:none;background:#fff" data-h="${fp.pickFileH}">File</button>
                <input type="file" accept="image/*" id="fotoFileInputEditP" data-hchg="${fp.onFileH}" class="pk-hidden-file">
              </div>
            </div>
            <div style="width:64px;height:64px;flex:none;border-radius:14px;background:#fff;overflow:hidden;display:grid;place-items:center;font-size:10px;font-weight:700;color:#c9cfd9">
              ${fp.foto ? `<div role="img" aria-label="Anteprima" style="${styleAttr(fp.fotoStyle)}"></div>` : `<span>foto</span>`}
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button type="button" class="pk-btn" data-h="${fp.annullaH}">Annulla</button>
          <button type="button" class="pk-btn pk-red" data-h="${fp.salvaH}">Salva prodotto</button>
        </div>
      </div>`;
  }

  html += `
      <div class="pk-card" style="padding:16px;display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span style="display:flex;align-items:center;gap:7px;font-size:13px;font-weight:700;margin-right:auto"><span style="width:8px;height:8px;border-radius:50%;background:#ef4444"></span>Andamento prezzi</span>
          <div style="display:flex;gap:4px;background:#fff;border-radius:999px;padding:4px">
            ${d.ranges.map(rg => `<button type="button" class="pk-btn" style="${styleAttr(rg.style)}" data-h="${rg.selH}">${esc(rg.label)}</button>`).join('')}
          </div>
        </div>
        <div style="background:#fff;border-radius:16px;padding:12px">${V.chartDettaglio || ''}</div>
      </div>

      <div class="pk-card" style="padding:16px;display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <div style="font-size:15px;font-weight:800;letter-spacing:-0.02em;margin-right:auto">Storico rilevamenti</div>
          <button type="button" class="pk-btn" style="background:#fff" data-h="${d.apriNuovoH}">${esc(d.etichettaNuovo)}</button>
        </div>`;

  if (V.formRil) {
    const fr = V.formRil;
    html += `
        <div style="background:#fff;border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:12px">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px">
            <div style="position:relative" data-drop="1"><label class="pk-lb">Data del rilevamento</label>${renderCalField(fr.cal, 'oggi')}</div>
          </div>
          <div>
            <label class="pk-lb">10 valori di mercato — numeri sciolti oppure incolla le offerte</label>
            <textarea class="pk-in num" style="min-height:110px;line-height:1.7" data-field="nuovoRil.valori" data-hi="${fr.onValoriH}" placeholder="9,50 9,80 10 10,20 10,50 10,90 11 11,20 11,50 12">${esc(fr.valori)}</textarea>
            <div class="num" style="${styleAttr(fr.conteggioStyle)}">${esc(fr.conteggio)}</div>
          </div>
          <div style="background:#f4f5f8;border-radius:14px;padding:14px;display:grid;grid-template-columns:repeat(auto-fit,minmax(115px,1fr));gap:12px">
            <div><div style="font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:#5d6672">Minimo</div><div class="num" style="font-size:20px;font-weight:800;letter-spacing:-0.03em">${esc(fr.min)}</div></div>
            <div><div style="font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:#ef4444">Medio</div><div class="num" style="font-size:20px;font-weight:800;letter-spacing:-0.03em;color:#ef4444">${esc(fr.avg)}</div></div>
            <div><div style="font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:#5d6672">Massimo</div><div class="num" style="font-size:20px;font-weight:800;letter-spacing:-0.03em">${esc(fr.max)}</div></div>
            <div><div style="font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:#5d6672">Scarto</div><div class="num" style="font-size:20px;font-weight:800;letter-spacing:-0.03em">${esc(fr.scarto)}</div></div>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button type="button" class="pk-btn" data-h="${fr.annullaH}">Annulla</button>
            <button type="button" class="pk-btn pk-red" data-h="${fr.salvaH}">Salva rilevamento</button>
          </div>
        </div>`;
  }

  html += `
        <div style="overflow-x:auto">
          <table class="pk-t">
            <thead><tr><th>Data</th><th style="text-align:right">Minimo</th><th style="text-align:right">Medio</th><th style="text-align:right">Δ % medio</th><th></th></tr></thead>
            <tbody>
              ${d.righe.map(r => `
              <tr>
                <td class="num">
                  ${r.inModifica ? `
                  <div style="position:relative;min-width:170px" data-drop="1">${renderCalField(r.calEData, 'oggi')}</div>` : `<span style="font-weight:700">${esc(r.data)}</span>`}
                </td>
                <td class="num" style="text-align:right">${esc(r.minimo)}</td>
                <td class="num" style="text-align:right;font-weight:700">${esc(r.medio)}</td>
                <td class="num" style="${styleAttr(r.dStyle)}">${esc(r.dPct)}</td>
                <td style="text-align:right;white-space:nowrap">
                  <button type="button" class="pk-btn" style="padding:6px 11px;font-size:12px" data-h="${r.toggleH}">${esc(r.etichettaValori)}</button>
                  <button type="button" class="pk-btn" style="padding:6px 11px;font-size:12px;margin-left:5px" data-h="${r.modificaH}">${esc(r.etichettaModifica)}</button>
                  <button type="button" class="pk-btn" style="padding:6px 11px;font-size:12px;margin-left:5px;color:#dc2626" data-h="${r.eliminaH}">Elimina</button>
                </td>
              </tr>
              ${r.espanso ? `
              <tr>
                <td colspan="5" style="border-top:0;padding-top:0">
                  ${r.inModifica ? `
                  <div style="display:flex;flex-direction:column;gap:10px;padding:4px 0 10px">
                    <div><label class="pk-lb">10 valori di mercato</label><textarea class="pk-in num" style="min-height:74px" data-field="edit.valori" data-hi="${r.onEditValoriH}">${esc(r.editValori)}</textarea></div>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px">
                      <div><label class="pk-lb">Spesa all'acquisto — totale €</label><input class="pk-in num" type="text" inputmode="decimal" data-field="edit.costo" value="${esc(r.editCosto)}" data-hi="${r.onEditCostoH}" placeholder="Es. 89,90"></div>
                      <div style="position:relative" data-drop="1"><label class="pk-lb">Data di acquisto</label>${renderCalField(r.calEAcq, 'both')}</div>
                      <div style="position:relative" data-drop="1"><label class="pk-lb">Categoria</label>${renderDropField(r.dropECat)}</div>
                    </div>
                    <div style="display:flex;gap:8px;justify-content:flex-end">
                      <button type="button" class="pk-btn" data-h="${r.annullaH}">Annulla</button>
                      <button type="button" class="pk-btn pk-red" data-h="${r.confermaH}">Salva modifiche</button>
                    </div>
                  </div>` : `
                  <div class="num" style="display:flex;flex-wrap:wrap;gap:6px;padding:2px 0 10px">
                    ${r.valori.map(v => `<span style="font-size:11px;font-weight:700;background:#e9ecf1;color:#5d6672;border-radius:999px;padding:4px 9px">${esc(v)}</span>`).join('')}
                  </div>`}
                </td>
              </tr>` : ''}`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>`;
  return html;
}

/* ================================ Top-level render ================================ */
const appEl = document.getElementById('app');

function render() {
  HANDLERS = new Map(); hid = 0;
  const V = computeVals();
  let html = renderHeader(V);
  if (V.isColl) html += renderCollezione(V);
  else if (V.isIns) html += renderInserimento(V);
  else if (V.isAn) html += renderAnalytics(V);
  html += renderConferma(V);
  html += renderDettaglio(V);

  const full = `<div style="min-height:100vh;background:linear-gradient(180deg,#eceef2 0%,#e7eaf0 100%);padding:14px 14px 60px">${html}</div>`;

  // preserve focus + caret position across the full re-render
  const active = document.activeElement;
  let focusInfo = null;
  if (active && appEl.contains(active) && active.hasAttribute && active.hasAttribute('data-field')) {
    focusInfo = { field: active.getAttribute('data-field'), start: active.selectionStart, end: active.selectionEnd };
  }
  appEl.innerHTML = full;
  if (focusInfo) {
    let sel = null;
    try { sel = appEl.querySelector('[data-field="' + focusInfo.field.replace(/"/g, '\\"') + '"]'); } catch (e) { sel = null; }
    if (sel) {
      sel.focus();
      if (typeof sel.setSelectionRange === 'function' && focusInfo.start != null) {
        try { sel.setSelectionRange(focusInfo.start, focusInfo.end); } catch (e) {}
      }
    }
  }
}

/* ================================ Event delegation ================================ */
function dispatch(attr, e) {
  const t = e.target.closest('[' + attr + ']');
  if (!t) return;
  const id = +t.getAttribute(attr);
  const fn = HANDLERS.get(id);
  if (fn) fn(e);
}
appEl.addEventListener('click', e => dispatch('data-h', e));
appEl.addEventListener('input', e => dispatch('data-hi', e));
appEl.addEventListener('change', e => dispatch('data-hchg', e));
appEl.addEventListener('mouseover', e => dispatch('data-henter', e));
appEl.addEventListener('mouseout', e => dispatch('data-hleave', e));
appEl.addEventListener('touchstart', e => dispatch('data-htouch', e), { passive: true });

document.addEventListener('mousedown', e => {
  if (!e.target.closest || !e.target.closest('[data-drop]')) {
    if (state.drop || state.nomiAperto) setState({ drop: null, nomiAperto: false });
  }
});

/* ================================ Boot ================================ */
(function boot() {
  let d = null;
  try { const raw = localStorage.getItem(LS); if (raw) d = JSON.parse(raw); } catch (e) { d = null; }
  if (!d || !d.prodotti || !d.prodotti.length) { d = demo(); persist(d); }
  state.d = d;
  render();
})();
