import { useState } from "react";
import {
  disableSync,
  enableSync,
  lastSyncAt,
  syncConfig,
  syncEnabled,
  syncNow,
} from "../sync";

/**
 * Optional shoal sync controls. The app works fully offline without this;
 * enabling only adds background push/pull of habits and completions to the
 * user's own server, end-to-end encrypted.
 */
export function SyncSettings() {
  const [enabled, setEnabled] = useState(syncEnabled());
  const [serverUrl, setServerUrl] = useState("");
  const [phrase, setPhrase] = useState("");
  const [freshPhrase, setFreshPhrase] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleEnable() {
    setBusy(true);
    setStatus(null);
    try {
      const mnemonic = await enableSync(serverUrl, phrase);
      if (phrase.trim() === "") setFreshPhrase(mnemonic);
      setEnabled(true);
      setStatus("synced");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "sync failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleSyncNow() {
    setBusy(true);
    try {
      await syncNow();
      setStatus("synced");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "sync failed (will retry)");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card space-y-3">
      <h2 className="text-sm font-medium text-accent">sync</h2>
      <p className="text-xs text-text-muted">
        optional. back up decks, cards, and review history to your own{" "}
        <a
          className="underline hover:text-text"
          href="https://github.com/emerson-d-lopes/shoal"
        >
          shoal
        </a>{" "}
        server, end-to-end encrypted. the app works fully offline without it.
      </p>

      {enabled ? (
        <>
          <p className="text-xs text-text-secondary">
            server: {syncConfig().serverUrl}
            {lastSyncAt() > 0 &&
              ` · last synced ${new Date(lastSyncAt()).toLocaleString()}`}
          </p>
          {freshPhrase && (
            <div className="alert space-y-1">
              <p className="text-xs">
                recovery phrase. write it down: it is the only way to restore,
                and it is shown only once.
              </p>
              <p className="text-xs font-mono">{freshPhrase}</p>
              <button
                className="btn btn-ghost text-xs"
                onClick={() => setFreshPhrase(null)}
              >
                i wrote it down
              </button>
            </div>
          )}
          {status && <p className="text-xs text-text-muted">{status}</p>}
          <div className="flex gap-2">
            <button
              className="btn btn-secondary text-xs"
              disabled={busy}
              onClick={handleSyncNow}
            >
              sync now
            </button>
            <button
              className="btn btn-ghost text-xs"
              onClick={() => {
                disableSync();
                setEnabled(false);
                setFreshPhrase(null);
                setStatus(null);
              }}
            >
              turn off
            </button>
          </div>
        </>
      ) : (
        <>
          <input
            className="input text-xs w-full"
            placeholder="server url (https://…)"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
          />
          <input
            className="input text-xs w-full"
            placeholder="recovery phrase (leave empty to create new)"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
          />
          {status && <p className="text-xs text-error">{status}</p>}
          <button
            className="btn btn-secondary text-xs"
            disabled={busy || serverUrl.trim() === ""}
            onClick={handleEnable}
          >
            enable sync
          </button>
        </>
      )}
    </div>
  );
}

