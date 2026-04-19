import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";

export function useDecks() {
  return useLiveQuery(() => db.decks.orderBy("createdAt").toArray(), []);
}
