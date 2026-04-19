import { HeatMap } from "../components/HeatMap";
import {
  useReviewsByDate,
  useTotalReviews,
  useGlobalCardStats,
} from "../hooks/useReviews";
import { formatDue } from "../lib/utils";

export function Stats() {
  const countsByDate = useReviewsByDate();
  const totalReviews = useTotalReviews();
  const global = useGlobalCardStats();

  return (
    <div className="space-y-10">
      <h2>stats</h2>

      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center space-y-1">
          <p className="text-2xl font-medium text-accent">
            {totalReviews ?? "—"}
          </p>
          <p className="text-text-muted text-sm">total reviews</p>
        </div>
        <div className="card text-center space-y-1">
          <p className="text-2xl font-medium text-accent">
            {global?.total ?? "—"}
          </p>
          <p className="text-text-muted text-sm">total cards</p>
        </div>
        <div className="card text-center space-y-1">
          <p className="text-2xl font-medium text-accent">
            {global?.due ?? "—"}
          </p>
          <p className="text-text-muted text-sm">due today</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-text-secondary text-sm">
          reviews per day — last 52 weeks
        </p>
        {countsByDate !== undefined ? (
          <HeatMap countsByDate={countsByDate} />
        ) : (
          <p className="text-text-muted text-sm">loading...</p>
        )}
      </div>

      {global && global.decks.length > 0 && (
        <div className="space-y-3">
          <p className="text-text-secondary text-sm">decks</p>
          <div className="space-y-2">
            {global.decks.map((deck) => (
              <div
                key={deck.id}
                className="card flex items-center justify-between gap-4"
              >
                <span className="text-text">{deck.name}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-text-muted text-sm">
                    {deck.total} cards
                  </span>
                  {deck.due > 0 ? (
                    <span className="badge badge-info">{deck.due} due</span>
                  ) : deck.nextDue !== null ? (
                    <span className="badge">
                      next {formatDue(deck.nextDue)}
                    </span>
                  ) : (
                    <span className="badge">empty</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {global?.total === 0 && (
        <p className="text-text-muted text-sm">
          no cards yet. add some decks to get started.
        </p>
      )}
    </div>
  );
}
