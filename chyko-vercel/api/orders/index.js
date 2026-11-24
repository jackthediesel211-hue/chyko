const crypto = require('crypto');
const { FLAT, redis, ip, limited, send } = require('../_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Metoda niedozwolona' });
  try {
    const b = req.body || {};
    const table = parseInt(b.table, 10);
    if (!(table >= 1 && table <= 50)) return send(res, 400, { error: 'Nieprawidłowy numer stolika' });
    if (!Array.isArray(b.items) || !b.items.length || b.items.length > 30) return send(res, 400, { error: 'Pusty koszyk' });

    const items = [];
    let total = 0;
    for (const it of b.items) {
      const m = FLAT[it && it.id];
      const qty = parseInt(it && it.qty, 10);
      if (!m || !(qty >= 1 && qty <= 20)) return send(res, 400, { error: 'Nieprawidłowa pozycja' });
      items.push({ name: m.name, qty, price: m.price });
      total += qty * m.price;
    }
    if (await limited('rl:order:' + ip(req), 12, 60)) return send(res, 429, { error: 'Za dużo zamówień. Poczekaj chwilę.' });

    const id = crypto.randomBytes(8).toString('hex');
    const num = await redis(['INCR', 'orderseq']);
    const order = {
      id, num, table, items, total,
      note: String(b.note || '').slice(0, 300),
      status: 'new',
      ts: Date.now()
    };
    await redis(['SET', 'order:' + id, JSON.stringify(order)]);
    await redis(['LPUSH', 'orders', id]);
    await redis(['LTRIM', 'orders', 0, 999]);
    send(res, 200, { id, num });
  } catch (e) {
    send(res, 500, { error: 'Błąd serwera: ' + e.message });
  }
};
