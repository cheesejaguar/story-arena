"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { StoryCard, type StoryCardProps } from "./story-card";
import type { Slot } from "@/lib/utils/randomize-slots";

export type CompareStory = {
  slot: Slot;
  text: string;
};

export type CompareGridProps = {
  stories: CompareStory[];
  selectedSlot: Slot | null;
  disabled?: boolean;
  onSelect: (slot: Slot) => void;
  onViewed?: (slot: Slot) => void;
  onScrollDepth?: (slot: Slot, depth: number) => void;
};

export function CompareGrid({
  stories,
  selectedSlot,
  disabled,
  onSelect,
  onViewed,
  onScrollDepth,
}: CompareGridProps) {
  const cardProps = (s: CompareStory): StoryCardProps => ({
    slot: s.slot,
    text: s.text,
    selected: selectedSlot === s.slot,
    disabled,
    onSelect: () => onSelect(s.slot),
    onViewed: onViewed ? () => onViewed(s.slot) : undefined,
    onScrollDepth: onScrollDepth ? (d) => onScrollDepth(s.slot, d) : undefined,
  });

  return (
    <>
      {/* Desktop: side-by-side */}
      <div className="hidden gap-6 lg:grid lg:grid-cols-3">
        {stories.map((s) => (
          <StoryCard key={s.slot} {...cardProps(s)} />
        ))}
      </div>

      {/* Mobile: tabs */}
      <div className="lg:hidden">
        <Tabs defaultValue={stories[0]?.slot ?? "A"}>
          <TabsList className="mb-4 grid w-full grid-cols-3">
            {stories.map((s) => (
              <TabsTrigger
                key={s.slot}
                value={s.slot}
                onFocus={() => onViewed?.(s.slot)}
              >
                Story {s.slot}
                {selectedSlot === s.slot && <span className="ml-1">●</span>}
              </TabsTrigger>
            ))}
          </TabsList>
          {stories.map((s) => (
            <TabsContent key={s.slot} value={s.slot}>
              <StoryCard {...cardProps(s)} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </>
  );
}
