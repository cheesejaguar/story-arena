"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BENCHMARK_MODELS } from "@/lib/ai/models";
import type { Slot } from "@/lib/utils/randomize-slots";
import type { Reveal } from "./vote-panel";

const SLOTS: Slot[] = ["A", "B", "C"];

function modelLabel(slug: string): string {
  return BENCHMARK_MODELS.find((m) => m.slug === slug)?.label ?? slug;
}

export function RevealPanel({
  reveal,
  chosenSlot,
}: {
  reveal: Reveal;
  chosenSlot: Slot;
}) {
  return (
    <div className="mx-auto mt-12 max-w-2xl space-y-8 text-center">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wider text-muted-foreground">
          Thanks for voting
        </p>
        <h2 className="font-serif text-3xl font-light">
          You picked{" "}
          <span className="font-medium">{modelLabel(reveal[chosenSlot])}</span>
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {SLOTS.map((slot) => {
          const isPick = slot === chosenSlot;
          return (
            <Card
              key={slot}
              className={cn(
                "p-4 text-center",
                isPick && "ring-foreground/60 bg-accent/50",
              )}
            >
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Story {slot}
              </p>
              <p className="mt-2 font-serif text-base">
                {modelLabel(reveal[slot])}
              </p>
              {isPick && (
                <Badge variant="default" className="mt-2 text-[10px]">
                  Your pick
                </Badge>
              )}
            </Card>
          );
        })}
      </div>

      <Button
        size="lg"
        render={<Link href="/">Try another prompt</Link>}
      />
    </div>
  );
}
