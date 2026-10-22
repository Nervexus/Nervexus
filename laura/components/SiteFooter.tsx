/** Layer 3: fixed footer, mix-blend-difference. The outer wrapper is
 * pointer-events-none (it's a status line, not a click target) but still
 * contains a literal `document.write` script for the year -- a source
 * quirk carried over on purpose. It's safe here only because this <script>
 * tag is part of the server-rendered HTML and runs once, inline, while the
 * browser is still parsing the initial document -- document.write after
 * that point would blow away the page, so this pattern must never be
 * reused inside a client-rendered effect. */
export function SiteFooter() {
  return (
    <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mix-blend-difference">
      <div className="flex items-center justify-between px-6 py-6 font-mono text-[11px] text-neutral-500 sm:px-10">
        <span suppressHydrationWarning>
          &copy;{" "}
          <script
            dangerouslySetInnerHTML={{ __html: "document.write(new Date().getFullYear())" }}
          />{" "}
          Laura
        </span>
        <span>personal assistant</span>
      </div>
    </footer>
  );
}
