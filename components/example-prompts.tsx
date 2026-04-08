"use client";

/**
 * Genre prompt cards — styled like archive file tabs from a literary magazine.
 * Each is a Roman-numeral-tagged entry with a small-caps genre label and
 * italic body text. No rounded pills; generous whitespace; ink-on-paper.
 */

type Example = { numeral: string; genre: string; text: string };

const EXAMPLES: Example[] = [
  {
    numeral: "I",
    genre: "Science Fiction",
    text: "A lighthouse keeper notices the stars are arranged differently each night.",
  },
  {
    numeral: "II",
    genre: "Fantasy",
    text: "A retired wizard runs a tea shop that only serves customers from impossible places.",
  },
  {
    numeral: "III",
    genre: "Literary",
    text: "Two strangers share a long train ride and discover they once loved the same person.",
  },
  {
    numeral: "IV",
    genre: "Horror",
    text: "An old answering machine plays back messages that haven't been left yet.",
  },
  {
    numeral: "V",
    genre: "Romance",
    text: "A florist receives the same anonymous order every week, with one flower fewer each time.",
  },
  {
    numeral: "VI",
    genre: "Mystery",
    text: "A clock collector inherits a watch that runs backward — and only when no one is watching.",
  },
];

export function ExamplePrompts({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div>
      <div className="mb-5 flex items-center gap-4">
        <span className="editorial-caps text-ink-muted">Prompts from the Archive</span>
        <span className="hairline flex-1" />
      </div>
      <ul className="grid gap-px bg-rule/60 sm:grid-cols-2 lg:grid-cols-3">
        {EXAMPLES.map((ex) => (
          <li key={ex.numeral} className="bg-paper">
            <button
              type="button"
              onClick={() => onPick(ex.text)}
              className="group flex h-full w-full flex-col gap-3 p-5 text-left transition-colors hover:bg-paper-deep focus:outline-none focus-visible:bg-paper-deep"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-display text-2xl italic font-normal leading-none text-oxblood group-hover:text-oxblood-deep">
                  {ex.numeral}
                </span>
                <span className="editorial-caps text-ink-muted">{ex.genre}</span>
              </div>
              <p className="font-serif text-[0.95rem] italic leading-snug text-ink">
                &ldquo;{ex.text}&rdquo;
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
