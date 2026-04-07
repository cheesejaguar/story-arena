import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/40 py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6">
        <span className="font-serif text-base">Story Arena</span>
        <nav className="flex gap-6">
          <Link href="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
          <Link href="/results" className="hover:text-foreground transition-colors">
            Results
          </Link>
        </nav>
      </div>
    </footer>
  );
}
