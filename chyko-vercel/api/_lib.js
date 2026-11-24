const crypto = require('crypto');

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const SECRET = process.env.AUTH_SECRET || '';

// Menu trzymane na serwerze, żeby nikt nie mógł podmienić cen w przeglądarce.
const MENU = [
  { cat: 'Zestawy', items: [
    { id: 'sk3', name: 'Nigeryjskie skrzydełka 3 szt.', desc: 'Sos stew, frytki, surówka', price: 23 },
    { id: 'sk6', name: 'Nigeryjskie skrzydełka 6 szt.', desc: 'Sos stew, frytki, surówka', price: 36 },
    { id: 'bur', name: 'Nigeryjski burger – zestaw', desc: 'Szarpana wieprzowina, frytki, coleslaw', price: 45 },
    { id: 'hdz', name: 'Koreański hot dog – zestaw', desc: 'Frytki + afrykańska granita', price: 36 },
    { id: 'nac', name: 'Doładowane nachosy / frytki – zestaw', desc: 'Szarpana wieprzowina, sos serowy', price: 42 }
  ]},
  { cat: 'Dla dwojga', items: [
    { id: 'd1', name: 'Chrupiący Duet', desc: '2 × nachosy/frytki, 2 × corndog, 2 × coleslaw, 2 × granita', price: 119 },
    { id: 'd2', name: 'Burger & corndog', desc: '2 × hamburger, 2 × corndog, 2 × frytki, 2 × coleslaw, 2 × granita', price: 129 },
    { id: 'd3', name: 'Pełne Doładowanie', desc: '2 × hamburger, 2 × nachosy/frytki, 2 × coleslaw, 2 × granita', price: 149 }
  ]},
  { cat: 'Solo & dodatki', items: [
    { id: 'hd', name: 'Koreański hot dog', desc: '', price: 23 },
    { id: 'fr', name: 'Frytki', desc: 'Afrykański sos serowy + sos paprykowy', price: 15 },
    { id: 'zo', name: 'Granita zobo', desc: '', price: 16 },
    { id: 'so', name: 'Granita soya milk', desc: '', price: 18 },
    { id: 'cs', name: 'Afrykański coleslaw', desc: '', price: 8 },
    { id: 'sa', name: 'Dodatkowy sos', desc: '', price: 3 },
    { id: 'nw', name: 'Napój gazowany', desc: '', price: 6 },
    { id: 'gr', name: 'Afrykańska granita', desc: '', price: 9 }
  ]}
];
const FLAT = {};
MENU.forEach(c => c.items.forEach(i => { FLAT[i.id] = i; }));

async function redis(cmd) {
  if (!URL_ || !TOKEN) throw new Error('Brak konfiguracji bazy (Upstash Redis).');
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd)
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

function ip(req) {
  return String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
}

// Prosty limit zapytań: zwraca true, gdy limit przekroczony.
async function limited(key, max, ttl) {
  const n = await redis(['INCR', key]);
  if (n === 1) await redis(['EXPIRE', key, ttl]);
  return n > max;
}

function sign(exp) {
  const p = String(exp);
  return p + '.' + crypto.createHmac('sha256', SECRET).update(p).digest('hex');
}
function verify(tok) {
  if (!SECRET || !tok) return false;
  const [p, sig] = String(tok).split('.');
  if (!p || !sig || Number(p) < Date.now()) return false;
  const e = crypto.createHmac('sha256', SECRET).update(p).digest('hex');
  const a = Buffer.from(sig), b = Buffer.from(e);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function isKitchen(req) {
  const m = (req.headers.cookie || '').match(/(?:^|; )kt=([^;]+)/);
  return !!m && verify(decodeURIComponent(m[1]));
}
function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function send(res, code, obj) {
  res.status(code).json(obj);
}

module.exports = { MENU, FLAT, redis, ip, limited, sign, isKitchen, safeEqual, send };
