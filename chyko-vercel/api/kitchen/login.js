const { ip, limited, sign, safeEqual, send } = require('../_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Metoda niedozwolona' });
  try {
    const PIN = process.env.KITCHEN_PIN;
    if (!PIN || !process.env.AUTH_SECRET) return send(res, 500, { error: 'Brak KITCHEN_PIN lub AUTH_SECRET w ustawieniach Vercel.' });
    if (await limited('rl:login:' + ip(req), 6, 600)) return send(res, 429, { error: 'Za dużo prób. Spróbuj za kilka minut.' });
    const pin = String((req.body && req.body.pin) || '');
    if (!safeEqual(pin, PIN)) return send(res, 401, { error: 'Nieprawidłowy kod.' });
    const maxAge = 12 * 60 * 60;
    const tok = sign(Date.now() + maxAge * 1000);
    res.setHeader('Set-Cookie', `kt=${encodeURIComponent(tok)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`);
    send(res, 200, { ok: true });
  } catch (e) {
    send(res, 500, { error: 'Błąd serwera: ' + e.message });
  }
};
