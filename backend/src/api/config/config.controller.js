const emailConnectionService = require('../../services/emailConnectionService');

async function testEmailConnection(req, res) {
  try {
    await emailConnectionService.testConnection();
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(502).json({ ok: false, error: err.message });
  }
}

module.exports = { testEmailConnection };
