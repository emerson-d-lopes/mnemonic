import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { State } from "ts-fsrs";
import { db } from "../db";
import { useCards, useDeckStats } from "../hooks/useCards";
import { newCardDefaults } from "../lib/fsrs";
import { randomId, formatDue } from "../lib/utils";

function CardRow({
  id,
  front,
  back,
}: {
  id: string;
  front: string;
  back: string;
}) {
  const [editing, setEditing] = useState(false);
  const [editFront, setEditFront] = useState(front);
  const [editBack, setEditBack] = useState(back);

  const handleSave = async () => {
    const f = editFront.trim();
    const b = editBack.trim();
    if (!f || !b) return;
    await db.cards.update(id, { front: f, back: b });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm("delete this card?")) return;
    await db.cards.delete(id);
  };

  if (editing) {
    return (
      <div className="card space-y-3">
        <textarea
          className="input textarea"
          value={editFront}
          onChange={(e) => setEditFront(e.target.value)}
          placeholder="front"
        />
        <textarea
          className="input textarea"
          value={editBack}
          onChange={(e) => setEditBack(e.target.value)}
          placeholder="back"
        />
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={handleSave}>
            save
          </button>
          <button className="btn btn-ghost" onClick={() => setEditing(false)}>
            cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card flex gap-4 items-start">
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-text">{front}</p>
        <p className="text-text-secondary text-sm">{back}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          className="btn btn-ghost text-xs px-2 py-1"
          onClick={() => setEditing(true)}
        >
          edit
        </button>
        <button
          className="btn btn-danger text-xs px-2 py-1"
          onClick={handleDelete}
        >
          delete
        </button>
      </div>
    </div>
  );
}

export function Deck() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const deck = useLiveQuery(() => (id ? db.decks.get(id) : undefined), [id]);
  const cards = useCards(id ?? "");
  const stats = useDeckStats(id ?? "");

  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const f = front.trim();
    const b = back.trim();
    if (!f || !b || !id) return;
    await db.cards.add({
      id: randomId(),
      deckId: id,
      front: f,
      back: b,
      createdAt: Date.now(),
      ...newCardDefaults(),
    });
    setFront("");
    setBack("");
  };

  const handleDeleteDeck = async () => {
    if (!confirm(`delete "${deck?.name}" and all its cards?`)) return;
    await db.transaction("rw", db.decks, db.cards, async () => {
      await db.cards.where("deckId").equals(id!).delete();
      await db.decks.delete(id!);
    });
    navigate("/");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            to="/"
            className="text-text-muted text-sm hover:text-text transition-colors"
          >
            ← decks
          </Link>
          <h2 className="mt-1">{deck?.name ?? "..."}</h2>
          {stats && stats.total > 0 && (
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {stats.byState[State.New] > 0 && (
                <span className="text-text-muted text-xs">
                  new {stats.byState[State.New]}
                </span>
              )}
              {stats.byState[State.Learning] > 0 && (
                <span className="text-text-muted text-xs">
                  learning {stats.byState[State.Learning]}
                </span>
              )}
              {stats.byState[State.Review] > 0 && (
                <span className="text-text-muted text-xs">
                  review {stats.byState[State.Review]}
                </span>
              )}
              {stats.byState[State.Relearning] > 0 && (
                <span className="text-text-muted text-xs">
                  relearning {stats.byState[State.Relearning]}
                </span>
              )}
              {stats.due === 0 && stats.nextDue !== null && (
                <span className="text-text-faint text-xs">
                  · next {formatDue(stats.nextDue)}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2 shrink-0 mt-1">
          {(stats?.due ?? 0) > 0 && (
            <Link to={`/decks/${id}/study`} className="btn btn-primary">
              study ({stats?.due})
            </Link>
          )}
          {(stats?.due ?? 0) === 0 && cards && cards.length > 0 && (
            <Link to={`/decks/${id}/study`} className="btn btn-secondary">
              review all
            </Link>
          )}
          <button className="btn btn-ghost" onClick={handleDeleteDeck}>
            delete deck
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {cards?.length === 0 && (
          <p className="text-text-muted text-sm">
            no cards yet. add one below.
          </p>
        )}
        {cards?.map((card) => (
          <CardRow
            key={card.id}
            id={card.id}
            front={card.front}
            back={card.back}
          />
        ))}
      </div>

      <form onSubmit={handleAdd} className="card space-y-3">
        <p className="text-text-secondary text-sm font-medium">add card</p>
        <textarea
          className="input textarea"
          placeholder="front"
          value={front}
          onChange={(e) => setFront(e.target.value)}
        />
        <textarea
          className="input textarea"
          placeholder="back"
          value={back}
          onChange={(e) => setBack(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          add card
        </button>
      </form>
    </div>
  );
}
