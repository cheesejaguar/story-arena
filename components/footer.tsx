import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-rule/60 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-oxblood text-sm leading-none">❦</span>
          <span className="font-display text-lg italic text-ink">Story Arena</span>
          <span className="hidden text-ink-faint sm:inline">·</span>
          <span className="hidden masthead-caps text-ink-faint sm:inline">
            Published on the open web
          </span>
        </div>
        <nav className="flex items-center gap-5">
          <Link
            href="/judge"
            className="editorial-caps text-ink-muted transition-colors hover:text-oxblood"
          >
            The Bench
          </Link>
          <span className="text-ink-faint">·</span>
          <Link
            href="/results"
            className="editorial-caps text-ink-muted transition-colors hover:text-oxblood"
          >
            Standings
          </Link>
          <span className="text-ink-faint">·</span>
          <Link
            href="/about"
            className="editorial-caps text-ink-muted transition-colors hover:text-oxblood"
          >
            Colophon
          </Link>
        </nav>
      </div>
    </footer>
  );
}
