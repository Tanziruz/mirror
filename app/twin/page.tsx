"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { TwinChat } from "@/components/twin/TwinChat";
import { useMirrorStore } from "@/hooks/useMirrorStore";
import type { DebateMessage } from "@/types";
import { useState } from "react";

export default function TwinPage() {
  const { logs } = useMirrorStore();
  const [messages, setMessages] = useState<DebateMessage[]>([
    { role: "twin", content: "You keep asking for clarity, but your last few logs show hesitation disguised as preparation.", timestamp: new Date().toISOString() },
    { role: "user", content: "What should I do about it?", timestamp: new Date().toISOString() },
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (message: string) => {
    const userMessage: DebateMessage = { role: "user", content: message, timestamp: new Date().toISOString() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, recentLogs: logs.slice(-14) }),
      });

      if (!response.ok) {
        throw new Error(`Twin chat failed with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let twinReply = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          twinReply += decoder.decode(value, { stream: true });
        }
      }

      const safeReply = twinReply.trim() || "I lost the thread for a second. Ask me again in one line.";
      setMessages([...nextMessages, { role: "twin", content: safeReply, timestamp: new Date().toISOString() }]);
    } catch (error) {
      const fallback = error instanceof Error ? error.message : "Twin chat failed unexpectedly";
      setMessages([
        ...nextMessages,
        { role: "twin", content: `I hit a connection issue: ${fallback}. Ask me again.`, timestamp: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
        <Card className="space-y-3">
          <p className="text-xs uppercase tracking-[0.34em] text-(--text-secondary)">Consult Your Twin</p>
          <h1 className="text-2xl font-semibold text-white">Your twin speaks from your data.</h1>
          <p className="max-w-2xl text-(--text-secondary)">It remembers what you logged, what you said, and what you avoided.</p>
        </Card>
        <Card>
          <TwinChat
            messages={messages}
            loading={loading}
            onSend={sendMessage}
            onStarterPrompt={(prompt) => sendMessage(prompt)}
          />
        </Card>
      </main>
    </>
  );
}
