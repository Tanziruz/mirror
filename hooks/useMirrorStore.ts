"use client";

import { useEffect, useMemo, useState } from "react";
import type { DailyLog, DebateMessage, ShadowDecision, TwinPersona } from "@/types";

const LOGS_KEY = "mirror:logs";
const DECISIONS_KEY = "mirror:decisions";
const PERSONA_KEY = "mirror:persona";

interface StoredShadowDecision extends ShadowDecision {
  created_at: string;
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const initialLogs: DailyLog[] = [
  // ... (previous initial logs content)
];

export function useMirrorStore() {
  const [hydrated, setHydrated] = useState(false);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [decisions, setDecisions] = useState<StoredShadowDecision[]>([]);
  const [persona, setPersona] = useState<TwinPersona | null>(null);

  useEffect(() => {
    const storedLogs = readStorage<DailyLog[]>(LOGS_KEY, []);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLogs(storedLogs.length > 0 ? storedLogs : initialLogs);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDecisions(readStorage<StoredShadowDecision[]>(DECISIONS_KEY, []));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPersona(readStorage<TwinPersona | null>(PERSONA_KEY, null));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  }, [hydrated, logs]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(DECISIONS_KEY, JSON.stringify(decisions));
  }, [decisions, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(PERSONA_KEY, JSON.stringify(persona));
  }, [persona, hydrated]);

  const addLog = (log: DailyLog) => {
    setLogs((current) => [...current.filter((item) => item.id !== log.id), log]);
  };

  const addDecision = (decision: StoredShadowDecision) => {
    setDecisions((current) => [decision, ...current.filter((item) => item.id !== decision.id)]);
  };

  const updateDecisionHistory = (decisionId: string, debateHistory: DebateMessage[]) => {
    setDecisions((current) =>
      current.map((decision) =>
        decision.id === decisionId
          ? {
              ...decision,
              debate_history: debateHistory,
            }
          : decision,
      ),
    );
  };

  const updatePersona = (newPersona: TwinPersona) => {
    setPersona(newPersona);
  };

  const latestLog = useMemo(() => {
    if (logs.length === 0) {
      return null;
    }

    return [...logs].sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime())[0] ?? null;
  }, [logs]);

  return {
    hydrated,
    logs,
    decisions,
    persona,
    latestLog,
    addLog,
    addDecision,
    updateDecisionHistory,
    updatePersona,
  };
}
