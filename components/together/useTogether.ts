"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { otherSeat } from "@/lib/together/content";
import { freshDoc, isOnline, sanitizeDoc } from "@/lib/together/logic";
import type { PlayerDoc, Seat } from "@/lib/together/types";

const POLL_MS = 900;
const HIDDEN_POLL_MS = 5_000;
const HEARTBEAT_MS = 4_000;

const storageKey = (seat: Seat) => `together:doc:${seat}`;

const readStored = (seat: Seat): PlayerDoc | null => {
  try {
    return sanitizeDoc(JSON.parse(window.localStorage.getItem(storageKey(seat)) ?? "null"));
  } catch {
    return null;
  }
};

interface Snapshot {
  partner: PlayerDoc | null;
  serverNow: number;
  receivedAt: number;
  shared: boolean;
}

export function useTogether(seat: Seat) {
  const [me, setMe] = useState<PlayerDoc>(() => freshDoc());
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const meRef = useRef(me);
  const reconciled = useRef(false);
  const pushing = useRef(false);
  const dirty = useRef(false);

  const commit = useCallback(
    (next: PlayerDoc) => {
      meRef.current = next;
      setMe(next);
      try {
        window.localStorage.setItem(storageKey(seat), JSON.stringify(next));
      } catch {
        // Private browsing can refuse storage; the server copy still keeps the game going.
      }
    },
    [seat],
  );

  const push = useCallback(async () => {
    if (pushing.current) {
      dirty.current = true;
      return;
    }
    pushing.current = true;
    try {
      do {
        dirty.current = false;
        const response = await fetch("/api/together", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seat, doc: meRef.current }),
          cache: "no-store",
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? `Couldn't save (${response.status}).`);
        }
      } while (dirty.current);
    } catch (problem) {
      dirty.current = true;
      setError(problem instanceof Error ? problem.message : "Couldn't reach the table.");
    } finally {
      pushing.current = false;
    }
  }, [seat]);

  const update = useCallback(
    (change: (doc: PlayerDoc) => PlayerDoc) => {
      commit(change(meRef.current));
      void push();
    },
    [commit, push],
  );

  useEffect(() => {
    const stored = readStored(seat);
    reconciled.current = false;
    commit(stored ?? freshDoc());
    setSnapshot(null);
  }, [seat, commit]);

  useEffect(() => {
    let stopped = false;
    let inFlight = false;
    let timer: number | undefined;

    const schedule = () => {
      if (!stopped) timer = window.setTimeout(tick, document.hidden ? HIDDEN_POLL_MS : POLL_MS);
    };

    const tick = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const response = await fetch("/api/together", { cache: "no-store" });
        const body = (await response.json()) as {
          seats?: Record<Seat, unknown>;
          now?: number;
          shared?: boolean;
          error?: string;
        };
        if (!response.ok || !body.seats) throw new Error(body.error ?? `Couldn't reach the table (${response.status}).`);

        const mine = sanitizeDoc(body.seats[seat]);
        const partner = sanitizeDoc(body.seats[otherSeat(seat)]);

        if (!reconciled.current) {
          reconciled.current = true;
          const local = meRef.current;
          // A different phone (or a cleared browser) may have played further for this seat.
          if (mine && (mine.round > local.round || (mine.round === local.round && mine.at > local.at))) {
            commit({ ...mine, holding: false });
          }
          void push();
        }

        if (partner && partner.round > meRef.current.round) {
          update((doc) => ({ ...freshDoc(partner.round), reactions: doc.reactions }));
        }

        setSnapshot({ partner, serverNow: body.now ?? Date.now(), receivedAt: Date.now(), shared: body.shared ?? true });
        setError(null);
      } catch (problem) {
        setError(problem instanceof Error ? problem.message : "Couldn't reach the table.");
      } finally {
        inFlight = false;
        schedule();
      }
    };

    void tick();

    const heartbeat = window.setInterval(() => {
      if (!document.hidden) void push();
    }, HEARTBEAT_MS);

    const onVisibility = () => {
      if (!document.hidden) {
        window.clearTimeout(timer);
        void tick();
        void push();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [seat, commit, push, update]);

  const partner = snapshot?.partner ?? null;
  const serverNow = snapshot ? snapshot.serverNow + (Date.now() - snapshot.receivedAt) : 0;

  return {
    me,
    partner,
    partnerOnline: snapshot ? isOnline(partner, serverNow) : false,
    loaded: snapshot !== null,
    shared: snapshot?.shared ?? true,
    error,
    update,
  };
}
