const { redis, isKitchen, send } = require('../_lib');

const NEXT = { new: ['prep', 'prepTs'], prep: ['ready', 'readyTs'], ready: ['done', 'doneTs'] };

module.exports = async (req, res) => {
  if (!isKitchen(req)) return send(res, 401, { error: 'Brak dostępu' });
  if (req.method !== 'POST') return send(res, 405, { error: 'Metoda niedozwolona' });
  try {
    const id = String((req.body && req.body.id) || '').replace(/[^a-f0-9]/g, '');
    const raw = id && (await redis(['GET', 'order:' + id]));
    if (!raw) return send(res, 404, { error: 'Nie znaleziono zamówienia' });
    const o = JSON.parse(raw);
    const nx = NEXT[o.status];
    if (!nx || req.body.status !== nx[0]) return send(res, 409, { error: 'Nieprawidłowa zmiana statusu', order: o });
    o.status = nx[0];
    o[nx[1]] = Date.now();
    await redis(['SET', 'order:' + id, JSON.stringify(o)]);
    send(res, 200, { order: o });
  } catch (e) {
    send(res, 500, { error: 'Błąd serwera: ' + e.message });
  }
};
