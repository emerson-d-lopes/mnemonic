import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  type Card as FsrsCard,
  type Grade,
} from "ts-fsrs";
import type { Card } from "../db";

export { Rating };

const f = fsrs(
  generatorParameters({
    request_retention: 0.9,
    maximum_interval: 365,
    enable_fuzz: true,
  }),
);

export function newCardDefaults(): Omit<
  Card,
  "id" | "deckId" | "front" | "back" | "createdAt"
> {
  const empty = createEmptyCard();
  return {
    due: empty.due.getTime(),
    stability: empty.stability,
    difficulty: empty.difficulty,
    elapsed_days: empty.elapsed_days,
    scheduled_days: empty.scheduled_days,
    reps: empty.reps,
    lapses: empty.lapses,
    learning_steps: empty.learning_steps,
    state: empty.state,
    last_review: null,
  };
}

function toFsrsCard(card: Card): FsrsCard {
  return {
    due: new Date(card.due),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    learning_steps: card.learning_steps,
    state: card.state,
    last_review: card.last_review ? new Date(card.last_review) : undefined,
  };
}

export function scheduleCard(
  card: Card,
  rating: Rating,
): Omit<Card, "id" | "deckId" | "front" | "back" | "createdAt"> {
  const scheduling = f.repeat(toFsrsCard(card), new Date());
  const scheduled = scheduling[rating as Grade].card;
  return {
    due: scheduled.due.getTime(),
    stability: scheduled.stability,
    difficulty: scheduled.difficulty,
    elapsed_days: scheduled.elapsed_days,
    scheduled_days: scheduled.scheduled_days,
    reps: scheduled.reps,
    lapses: scheduled.lapses,
    learning_steps: scheduled.learning_steps,
    state: scheduled.state,
    last_review: Date.now(),
  };
}

export function getIntervals(card: Card): Record<Rating, number> {
  const scheduling = f.repeat(toFsrsCard(card), new Date());
  const now = Date.now();
  return {
    [Rating.Again]:
      (scheduling[Rating.Again].card.due.getTime() - now) / 86_400_000,
    [Rating.Hard]:
      (scheduling[Rating.Hard].card.due.getTime() - now) / 86_400_000,
    [Rating.Good]:
      (scheduling[Rating.Good].card.due.getTime() - now) / 86_400_000,
    [Rating.Easy]:
      (scheduling[Rating.Easy].card.due.getTime() - now) / 86_400_000,
  } as Record<Rating, number>;
}

export function formatInterval(days: number): string {
  const minutes = days * 24 * 60;
  if (minutes < 60) return `${Math.round(minutes)}min`;
  const hours = days * 24;
  if (hours < 24) return `${Math.round(hours)}h`;
  if (days < 30) return `${Math.round(days)}d`;
  return `${Math.round(days / 30)}mo`;
}
