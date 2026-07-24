import { ShoalSync, SyncKeys } from "shoal-client";
import { DexieShoalStorage } from "shoal-client/dexie";
import { db, type Card, type Deck, type ReviewLog } from "../db";

/**
 * Optional sync against a self-hosted shoal server (collection "mnemonic").
 * Off until the user saves a server URL and recovery phrase. Mutations only
 * append to a local outbox; syncNow() drains it opportunistically. The app
 * is unchanged with the server down or sync unconfigured.
 *
 * Records: deck/<id>, card/<id> (full FSRS state, LWW), review/<id>
 * (append-only in practice; LWW is harmless for identical ids).
 */

const URL_KEY = "shoal-server-url";
const MNEMONIC_KEY = "shoal-recovery-phrase";
const NODE_KEY = "shoal-node-id";

let instance: ShoalSync | null = null;
let instanceFor = "";

export function syncConfig() {
  return {
    serverUrl: localStorage.getItem(URL_KEY) ?? "",
    mnemonic: localStorage.getItem(MNEMONIC_KEY) ?? "",
  };
}

export function syncEnabled(): boolean {
  const { serverUrl, mnemonic } = syncConfig();
  return serverUrl !== "" && mnemonic !== "";
}

function getSync(): ShoalSync | null {
  if (!syncEnabled()) return null;
  const { serverUrl, mnemonic } = syncConfig();
  const key = serverUrl + "\n" + mnemonic;
  if (instance && instanceFor === key) return instance;
  let nodeId = Number(localStorage.getItem(NODE_KEY));
  if (!Number.isInteger(nodeId) || nodeId === 0) {
    nodeId = crypto.getRandomValues(new Uint32Array(1))[0];
    localStorage.setItem(NODE_KEY, String(nodeId));
  }
  instance = new ShoalSync({
    serverUrl,
    mnemonic,
    collection: "mnemonic",
    nodeId,
    storage: new DexieShoalStorage(db),
    apply: applyRemote,
  });
  instanceFor = key;
  return instance;
}

type Tombstoned<T> = T & { deleted?: boolean };

async function applyRemote(recordId: string, body: unknown): Promise<void> {
  const [kind, id] = recordId.split("/");
  if (kind === "deck") {
    const deck = body as Tombstoned<Deck>;
    if (deck.deleted) {
      await db.cards.where("deckId").equals(id).delete();
      await db.decks.delete(id);
    } else {
      const { deleted: _d, ...row } = deck;
      await db.decks.put({ ...row, id });
    }
  } else if (kind === "card") {
    const card = body as Tombstoned<Card>;
    if (card.deleted) {
      await db.cards.delete(id);
    } else {
      const { deleted: _d, ...row } = card;
      await db.cards.put({ ...row, id });
    }
  } else if (kind === "review") {
    const log = body as ReviewLog;
    await db.reviewLogs.put({ ...log, id });
  }
}

// ---- recorders called from the mutation sites -----------------------------

export async function recordDeck(id: string): Promise<void> {
  const row = await db.decks.get(id);
  await getSync()?.record(`deck/${id}`, row ?? { deleted: true });
  scheduleSync();
}

export async function recordCard(id: string): Promise<void> {
  const row = await db.cards.get(id);
  await getSync()?.record(`card/${id}`, row ?? { deleted: true });
  scheduleSync();
}

/** Deck deletion cascades to its cards; tombstone each so other devices cascade too. */
export async function recordDeckDeleted(id: string, cardIds: string[]): Promise<void> {
  const sync = getSync();
  if (!sync) return;
  for (const cardId of cardIds) {
    await sync.record(`card/${cardId}`, { deleted: true });
  }
  await sync.record(`deck/${id}`, { deleted: true });
  scheduleSync();
}

export async function recordReview(log: ReviewLog): Promise<void> {
  await getSync()?.record(`review/${log.id}`, log);
  scheduleSync();
}

// ---- lifecycle ------------------------------------------------------------

/** Enable sync. Empty phrase = new identity; returns the phrase to show once. */
export async function enableSync(serverUrl: string, phrase: string): Promise<string> {
  const mnemonic = phrase.trim() === "" ? SyncKeys.generateMnemonic() : phrase.trim();
  SyncKeys.fromMnemonic(mnemonic); // validate before persisting
  localStorage.setItem(URL_KEY, serverUrl.trim().replace(/\/$/, ""));
  localStorage.setItem(MNEMONIC_KEY, mnemonic);
  instance = null;
  await bootstrap();
  await syncNow();
  return mnemonic;
}

export function disableSync(): void {
  localStorage.removeItem(URL_KEY);
  localStorage.removeItem(MNEMONIC_KEY);
  instance = null;
}

/** Snapshot everything into the outbox (first enable, recovery). */
async function bootstrap(): Promise<void> {
  const sync = getSync();
  if (!sync) return;
  for (const deck of await db.decks.toArray()) {
    await sync.record(`deck/${deck.id}`, deck);
  }
  for (const card of await db.cards.toArray()) {
    await sync.record(`card/${card.id}`, card);
  }
  for (const log of await db.reviewLogs.toArray()) {
    await sync.record(`review/${log.id}`, log);
  }
}

export async function syncNow(): Promise<void> {
  const sync = getSync();
  if (!sync) return;
  await sync.sync();
  localStorage.setItem("shoal-last-sync", String(Date.now()));
}

let timer: ReturnType<typeof setTimeout> | undefined;

function scheduleSync(): void {
  clearTimeout(timer);
  timer = setTimeout(() => {
    void syncNow().catch(() => {});
  }, 5_000);
}

/** Call once at startup: sync on load and when the tab regains focus. */
export function startAutoSync(): void {
  if (!syncEnabled()) return;
  void syncNow().catch(() => {});
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void syncNow().catch(() => {});
  });
}

export function lastSyncAt(): number {
  return Number(localStorage.getItem("shoal-last-sync")) || 0;
}
