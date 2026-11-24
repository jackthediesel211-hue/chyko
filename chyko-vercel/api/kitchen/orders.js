const { redis, isKitchen, send } = require('../_lib');

module.exports = async (req, res) => {
  if (!isKitchen(req)) return send(res, 401, { error: 'Brak dostępu' });
  try {
    const ids = await redis(['LRANGE', 'orders', 0, 299]);
    let orders = [];
    if (ids.length) {
      const raw = await redis(['MGET', ...ids.map(i => 'order:' + i)]);
      orders = raw.filter(Boolean).map(r => JSON.parse(r));
    }
    send(res, 200, { orders, now: Date.now() });
  } catch (e) {
    send(res, 500, { error: 'Błąd serwera: ' + e.message });
  }
};
