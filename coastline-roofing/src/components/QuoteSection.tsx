import { siteConfig } from "@/config/site";
import { QuoteForm } from "./QuoteForm";

export function QuoteSection() {
  return (
    <section id="quote" className="bg-cream py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5 lg:gap-16">
          <div className="lg:col-span-2">
            <p className="text-sm font-semibold uppercase tracking-wider text-brass-600">
              Get In Touch
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy-950 sm:text-4xl">
              Get your free, no-obligation quote
            </h2>
            <p className="mt-4 text-lg text-navy-900/65">
              Tell us a little about the job and we&apos;ll get back to you —
              usually the same working day. Prefer to talk it through? Call{" "}
              {siteConfig.town} direct.
            </p>
            <a
              href={siteConfig.phone.href}
              className="mt-6 inline-flex items-center gap-2 text-lg font-bold text-navy-950"
            >
              {siteConfig.phone.display}
            </a>
          </div>

          <div className="lg:col-span-3">
            <QuoteForm />
          </div>
        </div>
      </div>
    </section>
  );
}
