"use client";

export type ExamplePrompt = {
  id: string;
  text: string;
  /** Small label under the number, e.g. "r/WritingPrompts". */
  source: string;
};

export function ExamplePrompts({
  prompts,
  heading,
  onPick,
}: {
  prompts: ExamplePrompt[];
  heading: string;
  onPick: (text: string) => void;
}) {
  return (
    <div>
      <div className="mb-5 flex items-center gap-4">
        <span className="editorial-caps text-ink-muted">{heading}</span>
        <span className="hairline flex-1" />
      </div>
      <ul className="grid gap-px bg-rule/60 sm:grid-cols-2 lg:grid-cols-3">
        {prompts.map((prompt, index) => (
          <li key={prompt.id} className="bg-paper">
            <button
              type="button"
              onClick={() => onPick(prompt.text)}
              className="group flex h-full w-full flex-col gap-3 p-5 text-left transition-colors hover:bg-paper-deep focus:outline-none focus-visible:bg-paper-deep"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-display text-2xl italic font-normal leading-none text-oxblood group-hover:text-oxblood-deep">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="editorial-caps text-ink-muted">{prompt.source}</span>
              </div>
              <p className="font-serif text-[0.95rem] italic leading-snug text-ink">
                &ldquo;{prompt.text}&rdquo;
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
