"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { TwinPersonaCard } from "@/components/onboarding/TwinPersonaCard";
import { useMirrorStore } from "@/hooks/useMirrorStore";
import type { OnboardingAnswers, TwinPersona } from "@/types";

const questions = [
  "What are your top 3 values? Not aspirational ones — the ones that actually drive your decisions.",
  "What's your biggest regret, and what does it tell you about yourself?",
  "If you're completely honest, what do you optimize your life for?",
  "Tell me about a decision you're proud of. What made it right?",
  "Tell me about a decision you regret. What made it wrong?",
  "Who do you want to be in 5 years? Be specific.",
  "What's your deepest fear about who you might be becoming?",
];

const storageKey = "mirror:onboarding";

const initialAnswers: OnboardingAnswers = {
  top_values: "",
  biggest_regret: "",
  optimize_for: "",
  proud_decision: "",
  regretted_decision: "",
  future_self: "",
  deepest_fear: "",
};

function buildPersona(answers: OnboardingAnswers): TwinPersona {
  const values = answers.top_values
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 5);

  return {
    id: "mirror-demo",
    user_id: "demo-user",
    created_at: new Date().toISOString(),
    onboarding_answers: answers,
    uploaded_context: null,
    core_values: values.length > 0 ? values : ["Clarity", "Intensity", "Autonomy"],
    decision_style: "You decide fast when something is emotionally true, then rationalize afterward. You want precision, but you often choose what feels like relief.",
    blind_spots: ["You confuse pressure with purpose.", "You call indecision 'research' when it is usually fear."],
    dominant_emotions: ["restlessness", "self-critique", "ambition"],
    risk_appetite: "medium",
    summary:
      "You are highly self-aware but not always self-honest. The twin sees someone who wants a life that is deeper than performance, but whose habits keep drifting back toward urgency, control, and avoidance.",
    full_persona_json: {
      shadow_tendencies: ["overcommitting", "delayed honesty"],
      growth_edge: "You need to choose discomfort sooner instead of dressing it up as strategy.",
    },
  };
}

export default function OnboardingPage() {
  const { updatePersona } = useMirrorStore();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(initialAnswers);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadedText, setUploadedText] = useState("");
  const [persona, setPersona] = useState<TwinPersona | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved) as { step?: number; answers?: OnboardingAnswers; fileName?: string | null };
      if (parsed.answers) {
        setAnswers(parsed.answers);
      }
      if (typeof parsed.step === "number") {
        setStep(parsed.step);
      }
      if (typeof parsed.fileName === "string") {
        setFileName(parsed.fileName);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify({ step, answers, fileName }));
  }, [answers, fileName, step]);

  const questionKey = useMemo(() => Object.keys(initialAnswers)[step] as keyof OnboardingAnswers, [step]);

  if (!mounted) return null;

  const handleContinue = async () => {
    if (step < questions.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    if (step === questions.length - 1) {
      setStep(7);
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch("/api/twin/genesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, uploadedText }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Genesis failed");
      }
      
      const generatedPersona = await response.json();
      setPersona(generatedPersona);
      updatePersona(generatedPersona);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to generate twin:", errorMessage);
      // Fallback to local build if AI fails
      const fallback = buildPersona(answers);
      setPersona(fallback);
      updatePersona(fallback);
    } finally {
      setIsGenerating(false);
    }
  };

  if (persona) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-12 sm:px-8 lg:px-10">
        <div className="w-full space-y-6">
          <TwinPersonaCard persona={persona} />
          <div className="flex justify-end">
            <Link href="/dashboard">
              <Button>Enter Mirror</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (isGenerating) {
    const statuses = [
      "Mapping your decision patterns...",
      "Identifying your blind spots...",
      "Calibrating your risk profile...",
      "Building your twin...",
    ];

    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <div className="space-y-8">
          <div className="mx-auto h-28 w-28 rounded-full bg-[radial-gradient(circle,var(--accent-purple),rgba(124,58,237,0.08))] shadow-[0_0_60px_rgba(124,58,237,0.22)] animate-[pulseGlow_2.4s_ease-in-out_infinite]" />
          <div className="space-y-3 text-[var(--text-secondary)]">
            {statuses.map((status) => (
              <p key={status} className="text-sm uppercase tracking-[0.32em]">{status}</p>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (step === 7) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 py-12 text-center">
        <Card className="w-full space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.34em] text-[var(--text-secondary)]">Optional upload</p>
            <h2 className="text-3xl font-semibold text-white">Give your twin more to work with.</h2>
            <p className="text-[var(--text-secondary)]">Upload journal entries, notes, or anything you&apos;ve written.</p>
          </div>
          <label className="flex cursor-pointer flex-col gap-4 rounded-3xl border border-dashed border-white/15 bg-white/4 px-6 py-10 text-left transition hover:border-[var(--accent-blue)] hover:bg-white/6">
            <span className="text-sm uppercase tracking-[0.3em] text-[var(--text-secondary)]">Drop a file here or click to browse</span>
            <Input
              type="file"
              accept=".txt,.pdf,.docx,.md"
              className="border-0 bg-transparent p-0 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-[var(--accent-blue)] file:px-4 file:py-2 file:text-white"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                setFileName(file?.name ?? null);

                if (!file) {
                  setUploadedText("");
                  return;
                }

                const lowerName = file.name.toLowerCase();
                const supportsTextExtraction = lowerName.endsWith(".txt") || lowerName.endsWith(".md");

                if (!supportsTextExtraction) {
                  // For binary formats, keep the filename metadata for now and skip text extraction.
                  setUploadedText("");
                  return;
                }

                try {
                  const text = await file.text();
                  setUploadedText(text.slice(0, 20000));
                } catch {
                  setUploadedText("");
                }
              }}
            />
            {fileName ? <p className="text-sm text-white">{fileName}</p> : null}
          </label>
          <div className="flex items-center justify-between gap-4">
            <Button variant="ghost" onClick={() => setStep(0)}>Skip</Button>
            <Button onClick={handleContinue}>Continue</Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-12 sm:px-8">
      <Card className="w-full space-y-8">
        <div className="space-y-4">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/8">
            <div className="h-full bg-[var(--accent-blue)]" style={{ width: `${((step + 1) / 7) * 100}%`, transition: "width 300ms ease" }} />
          </div>
          <p className="text-xs uppercase tracking-[0.34em] text-[var(--text-secondary)]">Question {step + 1} of 7</p>
          <h1 className="max-w-3xl text-3xl leading-10 text-white">{questions[step]}</h1>
        </div>

        <Textarea
          className="min-h-40"
          value={answers[questionKey]}
          onChange={(event) => setAnswers((current) => ({ ...current, [questionKey]: event.target.value }))}
          placeholder="Type your answer..."
        />

        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((current) => Math.max(current - 1, 0))}>
            Back
          </Button>
          <Button disabled={!answers[questionKey].trim()} onClick={handleContinue}>
            Next →
          </Button>
        </div>
      </Card>
    </main>
  );
}
