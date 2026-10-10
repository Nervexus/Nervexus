import { siteConfig } from "@/config/site";
import { QuoteForm } from "./QuoteForm";

export function QuoteSection() {
  return (
    <section id="quote" className="bg-cream py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-5 lg:gap-20">
          <div className="lg:col-span-2">
            <p className="text-xs font-medium tracking-[0.2em] text-brass-600 uppercase">
              Get In Touch
            </p>
            <h2 className="mt-5 font-display text-4xl text-navy-950 sm:text-5xl">
              Get your free, no-obligation quote
            </h2>
            <p className="mt-5 text-lg font-light text-navy-900/60">
              Tell us a little about the job and we&apos;ll get back to you —
              usually the same working day. Prefer to talk it through? Call{" "}
              {siteConfig.town} direct.
            </p>
            <a
              href={siteConfig.phone.href}
              className="mt-8 inline-block font-display text-2xl text-navy-950"
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
