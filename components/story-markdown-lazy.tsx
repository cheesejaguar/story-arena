"use client";

import dynamic from "next/dynamic";

/**
 * Markdown parsing is only needed once a story has finished streaming. Keep
 * react-markdown + remark-gfm out of the initial bundle so the live view
 * paints faster; the fallback is plain prose, which is what the streaming
 * card shows anyway.
 */
export const StoryMarkdownLazy = dynamic(
  () => import("./story-markdown").then((mod) => mod.StoryMarkdown),
  {
    loading: () => (
      <div className="space-y-2" aria-hidden>
        <div className="h-4 w-full animate-pulse rounded bg-paper-deep" />
        <div className="h-4 w-[92%] animate-pulse rounded bg-paper-deep" />
        <div className="h-4 w-[85%] animate-pulse rounded bg-paper-deep" />
      </div>
    ),
  },
);
