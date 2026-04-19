import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";

export function useReviewsByDate() {
  return useLiveQuery(
    () =>
      db.reviewLogs.toArray().then((logs) => {
        const counts: Record<string, number> = {};
        for (const log of logs) {
          counts[log.date] = (counts[log.date] ?? 0) + 1;
        }
        return counts;
      }),
    [],
  );
}

export function useTotalReviews() {
  return useLiveQuery(() => db.reviewLogs.count(), []);
}

export function useGlobalCardStats() {
  return useLiveQuery(async () => {
    const [cards, decks] = await Promise.all([
      db.cards.toArray(),
      db.decks.orderBy("createdAt").toArray(),
    ]);
    const now = Date.now();
    return {
      total: cards.length,
      due: cards.filter((c) => c.due <= now).length,
      decks: decks.map((deck) => {
        const dc = cards.filter((c) => c.deckId === deck.id);
        const upcoming = dc
          .filter((c) => c.due > now)
          .sort((a, b) => a.due - b.due);
        return {
          id: deck.id,
          name: deck.name,
          total: dc.length,
          due: dc.filter((c) => c.due <= now).length,
          nextDue: upcoming[0]?.due ?? null,
        };
      }),
    };
  }, []);
}
