require("dotenv").config();
const { KiteConnect } = require("kiteconnect");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name} in kite-backtest/.env. Copy .env.example to .env and fill it in.`
    );
  }
  return value;
}

function getKite({ requireAccessToken = true } = {}) {
  const apiKey = requireEnv("KITE_API_KEY");
  const kite = new KiteConnect({ api_key: apiKey });

  if (requireAccessToken) {
    const accessToken = requireEnv("KITE_ACCESS_TOKEN");
    kite.setAccessToken(accessToken);
  }

  return kite;
}

module.exports = { getKite, requireEnv };
