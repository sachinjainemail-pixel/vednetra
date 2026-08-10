require("dotenv").config();
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { KiteConnect } = require("kiteconnect");
const { requireEnv } = require("./kiteClient");

const ENV_PATH = path.join(__dirname, "..", ".env");

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => {
    rl.close();
    resolve(answer.trim());
  }));
}

function persistAccessToken(accessToken) {
  let contents = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";
  if (/^KITE_ACCESS_TOKEN=.*$/m.test(contents)) {
    contents = contents.replace(/^KITE_ACCESS_TOKEN=.*$/m, `KITE_ACCESS_TOKEN=${accessToken}`);
  } else {
    contents += `${contents.endsWith("\n") || contents === "" ? "" : "\n"}KITE_ACCESS_TOKEN=${accessToken}\n`;
  }
  fs.writeFileSync(ENV_PATH, contents);
}

async function main() {
  const apiKey = requireEnv("KITE_API_KEY");
  const apiSecret = requireEnv("KITE_API_SECRET");
  const kite = new KiteConnect({ api_key: apiKey });

  console.log("1. Open this URL, log in with your Zerodha credentials, and approve access:\n");
  console.log(kite.getLoginURL());
  console.log("\n2. After login you'll be redirected to your app's redirect URL with a");
  console.log('   "?request_token=..." query param (the page may show an error - that is fine,');
  console.log("   the request_token is still in the browser's address bar).\n");

  const requestToken = await prompt("Paste the request_token here: ");
  if (!requestToken) {
    console.error("No request_token provided, aborting.");
    process.exit(1);
  }

  const session = await kite.generateSession(requestToken, apiSecret);
  persistAccessToken(session.access_token);

  console.log("\nLogin successful. Access token saved to kite-backtest/.env.");
  console.log("This token is valid until end-of-day exchange session - rerun `npm run login`");
  console.log("each trading day before running the backtest.");
}

main().catch((err) => {
  console.error("Login failed:", err.message || err);
  process.exit(1);
});
