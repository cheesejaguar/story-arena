"use client";

const EXAMPLES = [
  {
    genre: "Sci-Fi",
    text: "A lighthouse keeper notices the stars are arranged differently each night.",
  },
  {
    genre: "Fantasy",
    text: "A retired wizard runs a tea shop that only serves customers from impossible places.",
  },
  {
    genre: "Literary",
    text: "Two strangers share a long train ride and discover they once loved the same person.",
  },
  {
    genre: "Horror",
    text: "An old answering machine plays back messages that haven't been left yet.",
  },
  {
    genre: "Romance",
    text: "A florist receives the same anonymous order every week, with one flower fewer each time.",
  },
  {
    genre: "Mystery",
    text: "A clock collector inherits a watch that runs backward — and only when no one is watching.",
  },
];

export function ExamplePrompts({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {EXAMPLES.map((ex) => (
        <button
          key={ex.text}
          type="button"
          onClick={() => onPick(ex.text)}
          className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors"
        >
          <span className="font-medium text-foreground/80">{ex.genre}</span>
          <span className="mx-1.5 opacity-40">·</span>
          <span className="line-clamp-1 max-w-[24ch] inline-block align-bottom">{ex.text}</span>
        </button>
      ))}
    </div>
  );
}
