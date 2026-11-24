const { MENU } = require('./_lib');
module.exports = (req, res) => res.status(200).json({ menu: MENU });
