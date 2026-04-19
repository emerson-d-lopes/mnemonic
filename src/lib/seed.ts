import { db, type Card, type Deck } from "../db";
import { State } from "ts-fsrs";
import { randomId } from "./utils";

const MS = 86_400_000;
const now = () => Date.now();

function makeCard(
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
    createdAt: now(),
    due: now(),
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
    last_review: now() - daysAgo * MS,
    due: now() + dueInDays * MS,
    learning_steps: 0,
  };
}

export async function seedData() {
  const decks: Deck[] = [
    { id: randomId(), name: "spanish vocabulary", createdAt: now() - 30 * MS },
    { id: randomId(), name: "world capitals", createdAt: now() - 20 * MS },
    {
      id: randomId(),
      name: "programming concepts",
      createdAt: now() - 10 * MS,
    },
  ];

  const [spanish, capitals, programming] = decks;

  const cards: Card[] = [
    // spanish — mix of new, due, and upcoming
    makeCard(spanish.id, "hello", "hola"),
    makeCard(spanish.id, "thank you", "gracias"),
    makeCard(spanish.id, "goodbye", "adiós"),
    makeCard(spanish.id, "please", "por favor"),
    makeCard(spanish.id, "water", "el agua", reviewed(3, 3, -1)),
    makeCard(spanish.id, "house", "la casa", reviewed(4, 4, -2)),
    makeCard(spanish.id, "book", "el libro", reviewed(6, 6, 1)),
    makeCard(spanish.id, "time", "el tiempo", reviewed(8, 8, 2)),
    makeCard(spanish.id, "friend", "el amigo / la amiga", reviewed(2, 2, -1)),

    // capitals — mostly reviewed, some overdue
    makeCard(capitals.id, "france", "paris"),
    makeCard(capitals.id, "japan", "tokyo"),
    makeCard(capitals.id, "brazil", "brasília", reviewed(5, 5, -2)),
    makeCard(capitals.id, "australia", "canberra", reviewed(3, 3, -1)),
    makeCard(capitals.id, "egypt", "cairo", reviewed(7, 7, 1)),
    makeCard(capitals.id, "argentina", "buenos aires", reviewed(4, 4, -1)),
    makeCard(capitals.id, "canada", "ottawa", reviewed(9, 9, 3)),
    makeCard(capitals.id, "india", "new delhi", reviewed(2, 2, -1)),

    // programming — all new or just starting
    makeCard(
      programming.id,
      "what is a pure function?",
      "a function with no side effects that returns the same output for the same input",
    ),
    makeCard(
      programming.id,
      "what is memoization?",
      "caching the result of a function call to avoid recomputing it",
    ),
    makeCard(
      programming.id,
      "what is a closure?",
      "a function that retains access to variables from its enclosing scope",
    ),
    makeCard(
      programming.id,
      "what is the difference between == and ===?",
      "== coerces types, === checks value and type strictly",
    ),
    makeCard(
      programming.id,
      "what is big O notation?",
      "a way to describe the time or space complexity of an algorithm as input grows",
    ),
    makeCard(
      programming.id,
      "what is a race condition?",
      "a bug where the outcome depends on the unpredictable order of concurrent operations",
    ),
  ];

  await db.transaction("rw", db.decks, db.cards, async () => {
    await db.cards.clear();
    await db.decks.clear();
    await db.decks.bulkAdd(decks);
    await db.cards.bulkAdd(cards);
  });
}
