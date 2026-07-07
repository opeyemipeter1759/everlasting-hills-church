/**
 * Singleton GramJS (MTProto) client, authenticated via a pre-generated user
 * session (see scripts/telegram-login.mjs — that interactive login can't run
 * here, so it's a one-time local step whose output goes into TELEGRAM_SESSION).
 *
 * Module-level caching means a warm serverless invocation reuses the already
 * -connected client; a cold start pays the connect+auth cost again. That's an
 * accepted tradeoff of running this on Vercel instead of a persistent server.
 */
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";

let clientPromise: Promise<TelegramClient> | null = null;

export function getTelegramClient(): Promise<TelegramClient> {
  if (!clientPromise) {
    clientPromise = connect().catch((err) => {
      clientPromise = null; // let the next request retry instead of caching a failure
      throw err;
    });
  }
  return clientPromise;
}

async function connect(): Promise<TelegramClient> {
  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH;
  const session = process.env.TELEGRAM_SESSION;

  if (!apiId || !apiHash || !session) {
    throw new Error(
      "TELEGRAM_API_ID, TELEGRAM_API_HASH, and TELEGRAM_SESSION must be set (see scripts/telegram-login.mjs)."
    );
  }

  const client = new TelegramClient(new StringSession(session), apiId, apiHash, {
    connectionRetries: 3,
  });
  await client.connect();
  return client;
}
