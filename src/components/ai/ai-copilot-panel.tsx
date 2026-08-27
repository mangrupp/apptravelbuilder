"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Send, Loader2, Bot, User, Wand2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { applyAIOptimization } from "@/lib/actions/ai";
import { formatIDR } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/constants";
import { toast } from "@/store/toast";
import { cn } from "@/lib/utils";
import type { TripDetail } from "@/lib/queries/trips";
import type { AIOptimizationResponse, AIRecommendationItem } from "@/lib/ai/schema";

const SUGGESTED_QUESTIONS = [
  "Bagaimana supaya trip ini masuk budget?",
  "Kategori mana yang paling besar?",
  "Apa yang paling aman untuk dipotong?",
  "Berapa profit saya jika markup menjadi 20%?",
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function AICopilotPanel({ trip }: { trip: TripDetail }) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [chatPending, startChatTransition] = useTransition();
  const [chatError, setChatError] = useState<string | null>(null);

  const [optimizeResult, setOptimizeResult] = useState<
    (AIOptimizationResponse & { id: string; potentialSavings: number }) | null
  >(null);
  const [optimizePending, startOptimizeTransition] = useTransition();
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [applyPending, startApplyTransition] = useTransition();

  function ask(text: string) {
    if (!text.trim()) return;
    setChatError(null);
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setQuestion("");

    startChatTransition(async () => {
      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tripId: trip.id,
            question: text,
            history: messages.slice(-6),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setChatError(data.error ?? "Something went wrong.");
          return;
        }
        setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
      } catch {
        setChatError("Could not reach the AI service.");
      }
    });
  }

  function runOptimize() {
    setOptimizeError(null);
    setOptimizeResult(null);
    startOptimizeTransition(async () => {
      try {
        const res = await fetch("/api/ai/optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tripId: trip.id }),
        });
        const data = await res.json();
        if (!res.ok) {
          setOptimizeError(data.error ?? "Something went wrong.");
          return;
        }
        setOptimizeResult(data);
        setSelected(new Set(data.recommendations.map((r: AIRecommendationItem) => r.costItemId)));
      } catch {
        setOptimizeError("Could not reach the AI service.");
      }
    });
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleApply() {
    if (!optimizeResult) return;
    startApplyTransition(async () => {
      const changes = optimizeResult.recommendations
        .filter((r) => selected.has(r.costItemId))
        .map((r) => ({
          costItemId: r.costItemId,
          action: r.action,
          suggestedUnitPrice: r.suggestedUnitPrice,
          suggestedQuantity: r.suggestedQuantity,
        }));

      const result = await applyAIOptimization(trip.id, {
        recommendationId: optimizeResult.id,
        changes,
      });

      if (!result.success) {
        toast({ title: "Could not apply optimization", description: result.error, variant: "destructive" });
        return;
      }

      toast({ title: "Optimization applied", description: "Trip costs recalculated.", variant: "success" });
      setConfirmOpen(false);
      setOptimizeResult(null);
      router.refresh();
    });
  }

  const selectedSavings =
    optimizeResult?.recommendations
      .filter((r) => selected.has(r.costItemId))
      .reduce((sum, r) => {
        const original = trip.costs.find((c) => c.id === r.costItemId);
        if (!original) return sum;
        const originalTotal = Number(original.baseAmountIDR);
        let newTotal = originalTotal;
        if (r.action === "REMOVE_ITEM") newTotal = 0;
        else if (r.suggestedUnitPrice != null && Number(original.unitPrice) > 0) {
          newTotal = originalTotal * (r.suggestedUnitPrice / Number(original.unitPrice));
        } else if (r.suggestedQuantity != null && Number(original.quantity) > 0) {
          newTotal = originalTotal * (r.suggestedQuantity / Number(original.quantity));
        }
        return sum + Math.max(0, originalTotal - newTotal);
      }, 0) ?? 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-4 w-4" /> Travel Copilot
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ask about this trip&apos;s budget, categories, or hypothetical changes.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex max-h-80 flex-col gap-3 overflow-y-auto">
            {messages.length === 0 && (
              <div className="flex flex-col gap-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => ask(q)}
                    className="rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2 rounded-lg p-3 text-sm",
                  m.role === "user" ? "bg-secondary" : "bg-muted",
                )}
              >
                {m.role === "user" ? <User className="mt-0.5 h-4 w-4 shrink-0" /> : <Bot className="mt-0.5 h-4 w-4 shrink-0" />}
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
            {chatPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
              </div>
            )}
          </div>
          {chatError && <p className="text-sm text-destructive">{chatError}</p>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(question);
            }}
            className="flex gap-2"
          >
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask the Travel Copilot..."
            />
            <Button type="submit" disabled={chatPending || !question.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> AI Optimization
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Analyze this trip against the customer budget and find savings from existing costs.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button onClick={runOptimize} disabled={optimizePending}>
            {optimizePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            Optimize My Trip
          </Button>

          {optimizeError && <p className="text-sm text-destructive">{optimizeError}</p>}

          {optimizeResult && (
            <div className="flex flex-col gap-3">
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium">{optimizeResult.summary}</p>
                {optimizeResult.status === "OVER_BUDGET" && (
                  <p className="mt-1 text-destructive">
                    Over budget by {formatIDR(optimizeResult.budgetDifference)}
                  </p>
                )}
                {optimizeResult.status === "FITS_BUDGET" && (
                  <p className="mt-1 text-success">Fits within customer budget.</p>
                )}
              </div>

              {optimizeResult.recommendations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No further savings identified.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {optimizeResult.recommendations.map((rec) => (
                    <label
                      key={rec.costItemId}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selected.has(rec.costItemId)}
                        onChange={() => toggleSelected(rec.costItemId)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">
                            <Badge variant="secondary" className="mr-2">
                              {CATEGORY_LABELS[rec.category as keyof typeof CATEGORY_LABELS] ?? rec.category}
                            </Badge>
                            {rec.description}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{rec.rationale}</p>
                      </div>
                    </label>
                  ))}
                  <div className="flex items-center justify-between rounded-lg bg-success/10 p-3 text-sm text-success">
                    <span>Potential savings (selected)</span>
                    <span className="font-semibold">{formatIDR(selectedSavings)}</span>
                  </div>
                  <Button onClick={() => setConfirmOpen(true)} disabled={selected.size === 0}>
                    <CheckCircle2 className="h-4 w-4" /> Apply Optimization
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply {selected.size} optimization{selected.size === 1 ? "" : "s"}?</DialogTitle>
            <DialogDescription>
              This will update the trip&apos;s cost items and recalculate the total cost, selling price, profit,
              and margin. Estimated savings: {formatIDR(selectedSavings)}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={applyPending}>
              {applyPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm & Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
