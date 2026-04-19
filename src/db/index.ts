import Dexie, { type EntityTable } from "dexie";
import type { State } from "ts-fsrs";

export interface Deck {
  id: string;
  name: string;
  createdAt: number;
}

export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  createdAt: number;
  due: number;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  learning_steps: number;
  state: State;
  last_review: number | null;
}

export interface ReviewLog {
  id: string;
  cardId: string;
  deckId: string;
  date: string; // YYYY-MM-DD local time
  rating: number;
  timestamp: number;
}

const db = new Dexie("mnemonic") as Dexie & {
  decks: EntityTable<Deck, "id">;
  cards: EntityTable<Card, "id">;
  reviewLogs: EntityTable<ReviewLog, "id">;
};

db.version(1).stores({
  decks: "id, createdAt",
  cards: "id, deckId, due, state",
});

db.version(2).stores({
  decks: "id, createdAt",
  cards: "id, deckId, due, state",
  reviewLogs: "id, deckId, cardId, date",
});

export { db };
