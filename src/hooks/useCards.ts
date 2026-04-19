import { useLiveQuery } from "dexie-react-hooks";
import { State } from "ts-fsrs";
import { db } from "../db";

export function useCards(deckId: string) {
  return useLiveQuery(
    () => db.cards.where("deckId").equals(deckId).sortBy("createdAt"),
    [deckId],
  );
}

export function useDeckStats(deckId: string) {
  return useLiveQuery(async () => {
    const cards = await db.cards.where("deckId").equals(deckId).toArray();
    const now = Date.now();
    const upcoming = cards
      .filter((c) => c.due > now)
      .sort((a, b) => a.due - b.due);
    return {
      total: cards.length,
      byState: {
        [State.New]: cards.filter((c) => c.state === State.New).length,
        [State.Learning]: cards.filter((c) => c.state === State.Learning)
          .length,
        [State.Review]: cards.filter((c) => c.state === State.Review).length,
        [State.Relearning]: cards.filter((c) => c.state === State.Relearning)
          .length,
      },
      due: cards.filter((c) => c.due <= now).length,
      nextDue: upcoming[0]?.due ?? null,
    };
  }, [deckId]);
}
