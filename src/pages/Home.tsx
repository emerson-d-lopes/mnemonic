import { useState } from "react";
import { useNavigate } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { useDecks, useDueCount } from "../hooks/useDecks";
import { randomId } from "../lib/utils";
import { seedData } from "../lib/seed";

function DeckRow({ id, name }: { id: string; name: string }) {
  const navigate = useNavigate();
  const due = useDueCount(id);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("delete this deck and all its cards?")) return;
    await db.transaction("rw", db.decks, db.cards, async () => {
      await db.cards.where("deckId").equals(id).delete();
      await db.decks.delete(id);
    });
  };

  return (
    <div
      className="card card-interactive flex items-center justify-between"
      onClick={() => navigate(`/decks/${id}`)}
    >
      <span className="text-text">{name}</span>
      <div className="flex items-center gap-3">
        {due !== undefined && due > 0 && (
          <span className="badge badge-info">{due} due</span>
        )}
        <button
          className="btn btn-ghost text-xs px-2 py-1"
          onClick={handleDelete}
        >
          delete
        </button>
      </div>
    </div>
  );
}

export function Home() {
  const decks = useDecks();
  const totalDue = useLiveQuery(
    () => db.cards.where("due").belowOrEqual(Date.now()).count(),
    [],
  );
  const [name, setName] = useState("");

  const handleSeed = async () => {
    if (
      decks &&
      decks.length > 0 &&
      !confirm("this will replace all existing decks and cards. continue?")
    )
      return;
    await seedData();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await db.decks.add({
      id: randomId(),
      name: trimmed,
      createdAt: Date.now(),
    });
    setName("");
  };

  return (
    <div className="space-y-8">
      <div>
        <h2>decks</h2>
        {totalDue !== undefined && totalDue > 0 && (
          <p className="text-text-secondary text-sm mt-1">
            {totalDue} card{totalDue !== 1 ? "s" : ""} due across all decks
          </p>
        )}
      </div>

      <div className="space-y-2">
        {decks === undefined && (
          <p className="text-text-muted text-sm">loading...</p>
        )}
        {decks?.length === 0 && (
          <p className="text-text-muted text-sm">
            no decks yet. add one below.
          </p>
        )}
        {decks?.map((deck) => (
          <DeckRow key={deck.id} id={deck.id} name={deck.name} />
        ))}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          className="input"
          placeholder="new deck name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary whitespace-nowrap">
          add deck
        </button>
      </form>

      <button
        className="btn btn-ghost text-sm text-text-muted"
        onClick={handleSeed}
      >
        load sample data
      </button>
    </div>
  );
}
