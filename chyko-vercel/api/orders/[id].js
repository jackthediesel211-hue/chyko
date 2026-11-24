const { redis, send } = require('../_lib');

module.exports = async (req, res) => {
  try {
    const id = String(req.query.id || '').replace(/[^a-f0-9]/g, '');
    const raw = id && (await redis(['GET', 'order:' + id]));
    if (!raw) return send(res, 404, { error: 'Nie znaleziono zamówienia' });
    const o = JSON.parse(raw);
    send(res, 200, { status: o.status, num: o.num, table: o.table });
  } catch (e) {
    send(res, 500, { error: 'Błąd serwera' });
  }
};
