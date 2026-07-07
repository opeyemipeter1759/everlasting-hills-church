/**
 * One-time interactive login to generate a Telegram user session string.
 *
 * Run this LOCALLY (never in CI/production): `node scripts/telegram-login.mjs`
 * It needs TELEGRAM_API_ID and TELEGRAM_API_HASH from https://my.telegram.org
 * (API Development Tools) set as env vars or entered when prompted.
 *
 * Log in with an account that's a member of the target Telegram channel — the
 * resulting session can read that channel's message history and download its
 * media, which is what the /api/telegram-audio route needs at runtime.
 *
 * The script prints a session string at the end — save it as TELEGRAM_SESSION
 * in .env.local. Treat it like a password: it's full account access, not
 * scoped to just this channel.
 */
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const rl = readline.createInterface({ input: stdin, output: stdout });

async function ask(question) {
  const answer = await rl.question(question);
  return answer.trim();
}

const apiId = Number(process.env.TELEGRAM_API_ID || (await ask("API ID: ")));
const apiHash = process.env.TELEGRAM_API_HASH || (await ask("API Hash: "));

if (!apiId || !apiHash) {
  console.error("API ID and API Hash are required (from https://my.telegram.org).");
  process.exit(1);
}

const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
  connectionRetries: 5,
});

await client.start({
  phoneNumber: async () => ask("Phone number (with country code, e.g. +234...): "),
  password: async () => ask("2FA password (leave blank if you don't have one): "),
  phoneCode: async () => ask("Login code Telegram just sent you: "),
  onError: (err) => console.error(err),
});

console.log("\nLogged in. Save this as TELEGRAM_SESSION in .env.local:\n");
console.log(client.session.save());
console.log("\n(Keep it secret — it's equivalent to a login session for this account.)");

rl.close();
await client.disconnect();
process.exit(0);
