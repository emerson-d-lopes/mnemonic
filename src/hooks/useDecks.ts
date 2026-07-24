import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";

export function useDecks() {
  return useLiveQuery(() => db.decks.orderBy("createdAt").toArray(), []);
}

export function useDueCount(deckId: string) {
  return useLiveQuery(
    () =>
      db.cards
        .where("deckId")
        .equals(deckId)
        .and((c) => c.due <= Date.now())
        .count(),
    [deckId],
  );
}
