import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders a story's markdown output with typography that matches the
 * literary-quarterly theme. All headings use the display face (Cormorant)
 * and preserve italic treatment; paragraphs inherit the body serif set on
 * the parent `.story-prose` container.
 *
 * Used by the blind compare card, the live-streaming compare view, the
 * permalink compare page, and the admin run-detail page — so styling
 * tweaks made here propagate everywhere.
 */
export function StoryMarkdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
        h1: ({ children }) => (
          <h1 className="font-display text-2xl italic font-normal leading-tight mt-6 mb-4 first:mt-0 text-ink">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="font-display text-xl italic font-normal leading-tight mt-5 mb-3 first:mt-0 text-ink">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="font-display text-lg italic font-normal leading-tight mt-4 mb-2 first:mt-0 text-ink">
            {children}
          </h3>
        ),
        strong: ({ children }) => (
          <strong className="font-medium text-ink">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-oxblood/50 pl-5 my-5 italic text-ink-muted">
            {children}
          </blockquote>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-6 my-4 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-6 my-4 space-y-1">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        hr: () => (
          <div className="my-6 flex items-center justify-center gap-4">
            <span className="h-px flex-1 bg-rule" />
            <span className="text-oxblood text-xs leading-none">❦</span>
            <span className="h-px flex-1 bg-rule" />
          </div>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            className="text-oxblood underline underline-offset-2 decoration-[1px] hover:text-oxblood-deep"
          >
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code className="font-mono text-[0.85em] bg-paper-deep px-1 py-0.5 rounded">
            {children}
          </code>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
