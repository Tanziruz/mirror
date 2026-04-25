"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { DailyLogForm } from "@/components/dashboard/DailyLogForm";
import { DivergenceGauge } from "@/components/dashboard/DivergenceGauge";
import { TwinTakePanel } from "@/components/dashboard/TwinTakePanel";
import { formatDateLabel } from "@/lib/utils";
import { useMirrorStore } from "@/hooks/useMirrorStore";
import type { DailyLog } from "@/types";
import { useMemo, useState } from "react";

export default function DashboardPage() {
  const { hydrated, logs, addLog, latestLog, persona } = useMirrorStore();
  const [latestScore, setLatestScore] = useState(50);
  const [latestCommentary, setLatestCommentary] = useState<string | undefined>(undefined);
  const [latestTimestamp, setLatestTimestamp] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const visibleLogs = logs;

  const lastSeven = useMemo(
    () =>
      visibleLogs.slice(-7).map((entry) => ({
        date: entry.log_date,
        score: entry.divergence_score ?? 50,
      })),
    [visibleLogs],
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-(--accent-purple) border-t-transparent" />
          <p className="text-sm font-bold uppercase tracking-[0.4em] text-(--text-secondary)">Syncing Mirror...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.05),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(59,111,255,0.05),transparent_50%)]">
        <Navbar />
      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card className="flex flex-col gap-6 border-white/5 bg-white/2 backdrop-blur-xl">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-(--text-secondary)">Input Layer</p>
            <h1 className="mt-2 text-3xl font-bold text-white tracking-tight">Daily Sync</h1>
          </div>
          <DailyLogForm
            onSubmit={async ({ mood, goalStatus, decisionMade, notes, timeSpent, commentary }) => {
              setIsLoading(true);
              try {
                const response = await fetch("/api/divergence", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    logData: {
                      mood,
                      decision_made: decisionMade,
                      time_spent: timeSpent,
                      goal_status: goalStatus,
                      notes,
                    },
                    persona,
                  }),
                });

                if (!response.ok) {
                  throw new Error(`Divergence request failed with status ${response.status}`);
                }

                const payload = (await response.json()) as { divergence_score: number; commentary: string; logId: string };
                
                const createdLog: DailyLog = {
                  id: payload.logId,
                  user_id: "demo-user",
                  log_date: new Date().toISOString().slice(0, 10),
                  mood,
                  decision_made: decisionMade || null,
                  time_spent: timeSpent,
                  goal_status: goalStatus,
                  notes: notes || null,
                  divergence_score: payload.divergence_score,
                  twin_commentary: payload.commentary,
                };

                addLog(createdLog);
                setLatestScore(createdLog.divergence_score ?? 50);
                setLatestCommentary(createdLog.twin_commentary ?? undefined);
                setLatestTimestamp(new Date().toISOString());
              } finally {
                setIsLoading(false);
              }
            }}
          />
        </Card>

        <Card className="flex flex-col items-center justify-between gap-10 border-white/5 bg-white/2 backdrop-blur-xl py-10">
          <DivergenceGauge
            score={latestLog?.divergence_score ?? latestScore}
            animatedScore={isLoading ? 50 : latestLog?.divergence_score ?? latestScore}
            emptyState={visibleLogs.length === 0 && !latestCommentary}
            loading={isLoading}
          />
          <div className="flex w-full items-center justify-center gap-3 px-4">
            {lastSeven.map((entry, index) => (
              <div
                key={`${entry.date}-${index}`}
                title={`${formatDateLabel(entry.date)} · ${entry.score}%`}
                className="h-2 w-full rounded-full bg-white/5 overflow-hidden"
              >
                 <div 
                  className="h-full transition-all duration-1000"
                  style={{ 
                    width: '100%',
                    background: entry.score <= 30 ? "var(--success)" : entry.score <= 60 ? "var(--warning)" : "var(--danger)",
                    boxShadow: `0 0 10px ${entry.score <= 30 ? "var(--success)" : entry.score <= 60 ? "var(--warning)" : "var(--danger)"}44`
                  }}
                />
              </div>
            ))}
          </div>
        </Card>

        <TwinTakePanel
          commentary={latestCommentary ?? latestLog?.twin_commentary ?? undefined}
          timestamp={latestTimestamp ?? latestLog?.log_date}
          loading={isLoading}
          history={visibleLogs.slice(-3).reverse().map((entry) => `${formatDateLabel(entry.log_date)}: ${entry.twin_commentary ?? "No commentary yet."}`)}
        />
      </main>
    </div>
    </ProtectedRoute>
  );
}
