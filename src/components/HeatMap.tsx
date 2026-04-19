import { useEffect, useMemo, useRef } from "react";
import { toDateStr } from "../lib/utils";

function cellColor(count: number): string {
  if (count === 0) return "var(--color-surface-raised)";
  if (count <= 2)
    return "color-mix(in srgb, var(--color-accent) 25%, var(--color-surface))";
  if (count <= 5)
    return "color-mix(in srgb, var(--color-accent) 55%, var(--color-surface))";
  return "var(--color-accent)";
}

interface Cell {
  date: string;
  count: number;
  future: boolean;
}

function buildGrid(
  countsByDate: Record<string, number>,
  weeksBack = 52,
): Cell[][] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toDateStr(today);

  // Start from Monday of the week that was (weeksBack-1) weeks ago
  const dayOfWeek = (today.getDay() + 6) % 7; // 0=Mon … 6=Sun
  const startOffset = dayOfWeek + (weeksBack - 1) * 7;

  const weeks: Cell[][] = [];
  for (let w = 0; w < weeksBack; w++) {
    const week: Cell[] = [];
    for (let d = 0; d < 7; d++) {
      const daysAgo = startOffset - w * 7 - d;
      const date = new Date(today);
      date.setDate(today.getDate() - daysAgo);
      const dateStr = toDateStr(date);
      week.push({
        date: dateStr,
        count: countsByDate[dateStr] ?? 0,
        future: dateStr > todayStr,
      });
    }
    weeks.push(week);
  }
  return weeks;
}

const DAY_LABELS = ["mon", "wed", "fri"];
const DAY_LABEL_ROWS = [0, 2, 4]; // which row index to label

export function HeatMap({
  countsByDate,
}: {
  countsByDate: Record<string, number>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const weeks = useMemo(() => buildGrid(countsByDate), [countsByDate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  return (
    <div className="space-y-2">
      <div ref={scrollRef} className="overflow-x-auto">
        <div className="flex gap-0.5" style={{ width: "max-content" }}>
          {/* Day-of-week labels */}
          <div className="flex flex-col gap-0.5 mr-1">
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 11,
                  height: 11,
                  fontSize: "0.6rem",
                  lineHeight: "11px",
                }}
                className="text-text-faint text-right"
              >
                {DAY_LABEL_ROWS.includes(i)
                  ? DAY_LABELS[DAY_LABEL_ROWS.indexOf(i)]
                  : ""}
              </div>
            ))}
          </div>

          {/* Week columns */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((cell) => (
                <div
                  key={cell.date}
                  title={
                    cell.future
                      ? ""
                      : `${cell.date}: ${cell.count} review${cell.count !== 1 ? "s" : ""}`
                  }
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 2,
                    backgroundColor: cell.future
                      ? "transparent"
                      : cellColor(cell.count),
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 justify-end">
        <span className="text-text-faint" style={{ fontSize: "0.65rem" }}>
          less
        </span>
        {[0, 1, 3, 6].map((n) => (
          <div
            key={n}
            style={{
              width: 11,
              height: 11,
              borderRadius: 2,
              backgroundColor: cellColor(n),
            }}
          />
        ))}
        <span className="text-text-faint" style={{ fontSize: "0.65rem" }}>
          more
        </span>
      </div>
    </div>
  );
}
