import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Card } from "../db";
import {
  Rating,
  scheduleCard,
  getIntervals,
  formatInterval,
} from "../lib/fsrs";
import { randomId, toDateStr } from "../lib/utils";

export function Study() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const deck = useLiveQuery(() => (id ? db.decks.get(id) : undefined), [id]);

  const [queue, setQueue] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    db.cards
      .where("deckId")
      .equals(id)
      .and((c) => c.due <= Date.now())
      .sortBy("due")
      .then((cards) => {
        setQueue(cards);
        setLoading(false);
      });
  }, [id]);

  const card = queue[index];

  const intervals = useMemo(() => {
    if (!card) return null;
    return getIntervals(card);
  }, [card]);

  const handleRate = useCallback(
    async (rating: Rating) => {
      if (!card || !id) return;
      await db.reviewLogs.add({
        id: randomId(),
        cardId: card.id,
        deckId: id,
        date: toDateStr(),
        rating,
        timestamp: Date.now(),
      });
      await db.cards.update(card.id, scheduleCard(card, rating));
      setFlipped(false);
      setIndex((i) => i + 1);
    },
    [card, id],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (!flipped && e.key === " ") {
        e.preventDefault();
        setFlipped(true);
        return;
      }
      if (flipped) {
        if (e.key === "1") handleRate(Rating.Again);
        else if (e.key === "2") handleRate(Rating.Hard);
        else if (e.key === "3") handleRate(Rating.Good);
        else if (e.key === "4") handleRate(Rating.Easy);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flipped, handleRate]);

  if (loading) {
    return <p className="text-text-muted text-sm">loading...</p>;
  }

  if (deck === null) {
    return (
      <div className="space-y-4">
        <p className="text-text-muted">deck not found.</p>
        <Link to="/" className="text-accent text-sm">
          ← back
        </Link>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            to={`/decks/${id}`}
            className="text-text-muted text-sm hover:text-text transition-colors"
          >
            ← {deck?.name ?? "deck"}
          </Link>
          <h2 className="mt-1">all done</h2>
        </div>
        <p className="text-text-secondary">
          {queue.length === 0
            ? "no cards due right now. check back later."
            : `reviewed ${queue.length} card${queue.length !== 1 ? "s" : ""}. great work.`}
        </p>
        <div className="flex gap-3">
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/decks/${id}`)}
          >
            back to deck
          </button>
          <Link to="/" className="btn btn-ghost">
            home
          </Link>
        </div>
      </div>
    );
  }

  const progress = queue.length > 0 ? (index / queue.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header + progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Link
            to={`/decks/${id}`}
            className="text-text-muted text-sm hover:text-text transition-colors"
          >
            ← {deck?.name ?? "deck"}
          </Link>
          <span className="text-text-muted text-xs">
            {index} / {queue.length}
          </span>
        </div>
        <div className="w-full bg-surface rounded-full h-1">
          <div
            className="bg-accent h-1 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        <div className="card card-raised min-h-40 flex items-center justify-center text-center p-8">
          <p className="text-text text-lg">{card.front}</p>
        </div>

        {flipped && (
          <div className="card min-h-32 flex items-center justify-center text-center p-8 border-border">
            <p className="text-text-secondary">{card.back}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {!flipped ? (
        <button
          className="btn btn-primary w-full"
          onClick={() => setFlipped(true)}
        >
          show answer
          <span
            className="ml-2 text-text-faint"
            style={{ fontSize: "var(--font-size-xs)" }}
          >
            [space]
          </span>
        </button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              { rating: Rating.Again, label: "again", key: "1" },
              { rating: Rating.Hard, label: "hard", key: "2" },
              { rating: Rating.Good, label: "good", key: "3" },
              { rating: Rating.Easy, label: "easy", key: "4" },
            ] as const
          ).map(({ rating, label, key }) => (
            <button
              key={rating}
              className="btn btn-secondary flex flex-col items-center gap-1 py-3"
              onClick={() => handleRate(rating)}
            >
              <span>{label}</span>
              {intervals && (
                <span
                  className="text-text-muted"
                  style={{ fontSize: "var(--font-size-xs)" }}
                >
                  {formatInterval(intervals[rating])}
                </span>
              )}
              <span
                className="text-text-faint"
                style={{ fontSize: "var(--font-size-xs)" }}
              >
                [{key}]
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
