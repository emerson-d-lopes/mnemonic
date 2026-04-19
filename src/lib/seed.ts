import { db, type Card, type Deck } from "../db";
import { State } from "ts-fsrs";
import { randomId } from "./utils";

const MS = 86_400_000;

function makeCard(
  now: number,
  deckId: string,
  front: string,
  back: string,
  overrides: Partial<Card> = {},
): Card {
  return {
    id: randomId(),
    deckId,
    front,
    back,
    createdAt: now,
    due: now,
    stability: 0,
    difficulty: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 0,
    lapses: 0,
    learning_steps: 0,
    state: State.New,
    last_review: null,
    ...overrides,
  };
}

function reviewed(
  now: number,
  daysAgo: number,
  stability: number,
  dueInDays: number,
): Partial<Card> {
  return {
    state: State.Review,
    reps: Math.round(stability / 3) + 1,
    lapses: 0,
    stability,
    difficulty: 4 + Math.random() * 2,
    elapsed_days: daysAgo,
    scheduled_days: Math.round(stability),
    last_review: now - daysAgo * MS,
    due: now + dueInDays * MS,
    learning_steps: 0,
  };
}

export async function seedData() {
  const now = Date.now();
  const decks: Deck[] = [
    { id: randomId(), name: "spanish vocabulary", createdAt: now - 30 * MS },
    { id: randomId(), name: "world capitals", createdAt: now - 20 * MS },
    { id: randomId(), name: "programming concepts", createdAt: now - 10 * MS },
  ];

  const [spanish, capitals, programming] = decks;

  const cards: Card[] = [
    // spanish — mix of new, due, and upcoming
    makeCard(now, spanish.id, "hello", "hola"),
    makeCard(now, spanish.id, "thank you", "gracias"),
    makeCard(now, spanish.id, "goodbye", "adiós"),
    makeCard(now, spanish.id, "please", "por favor"),
    makeCard(now, spanish.id, "water", "el agua", reviewed(now, 3, 3, -1)),
    makeCard(now, spanish.id, "house", "la casa", reviewed(now, 4, 4, -2)),
    makeCard(now, spanish.id, "book", "el libro", reviewed(now, 6, 6, 1)),
    makeCard(now, spanish.id, "time", "el tiempo", reviewed(now, 8, 8, 2)),
    makeCard(
      now,
      spanish.id,
      "friend",
      "el amigo / la amiga",
      reviewed(now, 2, 2, -1),
    ),

    // capitals — mostly reviewed, some overdue
    makeCard(now, capitals.id, "france", "paris"),
    makeCard(now, capitals.id, "japan", "tokyo"),
    makeCard(now, capitals.id, "brazil", "brasília", reviewed(now, 5, 5, -2)),
    makeCard(
      now,
      capitals.id,
      "australia",
      "canberra",
      reviewed(now, 3, 3, -1),
    ),
    makeCard(now, capitals.id, "egypt", "cairo", reviewed(now, 7, 7, 1)),
    makeCard(
      now,
      capitals.id,
      "argentina",
      "buenos aires",
      reviewed(now, 4, 4, -1),
    ),
    makeCard(now, capitals.id, "canada", "ottawa", reviewed(now, 9, 9, 3)),
    makeCard(now, capitals.id, "india", "new delhi", reviewed(now, 2, 2, -1)),

    // programming — all new or just starting
    makeCard(
      now,
      programming.id,
      "what is a pure function?",
      "a function with no side effects that returns the same output for the same input",
    ),
    makeCard(
      now,
      programming.id,
      "what is memoization?",
      "caching the result of a function call to avoid recomputing it",
    ),
    makeCard(
      now,
      programming.id,
      "what is a closure?",
      "a function that retains access to variables from its enclosing scope",
    ),
    makeCard(
      now,
      programming.id,
      "what is the difference between == and ===?",
      "== coerces types, === checks value and type strictly",
    ),
    makeCard(
      now,
      programming.id,
      "what is big O notation?",
      "a way to describe the time or space complexity of an algorithm as input grows",
    ),
    makeCard(
      now,
      programming.id,
      "what is a race condition?",
      "a bug where the outcome depends on the unpredictable order of concurrent operations",
    ),
  ];

  await db.transaction("rw", db.decks, db.cards, db.reviewLogs, async () => {
    await db.reviewLogs.clear();
    await db.cards.clear();
    await db.decks.clear();
    await db.decks.bulkAdd(decks);
    await db.cards.bulkAdd(cards);
  });
}
