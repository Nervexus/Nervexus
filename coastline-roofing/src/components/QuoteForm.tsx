"use client";

import { useState, type FormEvent } from "react";
import { siteConfig } from "@/config/site";
import { CheckIcon, PhoneIcon } from "./icons";

const jobTypes = [
  "Roof repair",
  "New roof",
  "Flat roof",
  "Guttering & fascias",
  "Chimney work",
  "Emergency repair",
  "Not sure / other",
];

const fieldClasses =
  "mt-2 w-full rounded-none border-0 border-b border-warm/20 bg-transparent px-0 py-2.5 text-warm outline-none transition-colors placeholder:text-warm/35 focus:border-gold-500";

const labelClasses =
  "text-xs font-medium tracking-[0.1em] text-warm/50 uppercase";

export function QuoteForm() {
  const [submitted, setSubmitted] = useState(false);

  // NOTE: this is a static demo — there is no backend wired up, so
  // submitting just shows a thank-you message. Before this goes live for a
  // real client, replace handleSubmit with a real request (an API route, a
  // server action, or a service like Formspree) that emails/stores the lead.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center border-t border-gold-500/40 bg-gold-500/5 px-8 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold-500 text-gold-500">
          <CheckIcon className="h-5 w-5" />
        </span>
        <h3 className="mt-6 font-display text-2xl text-warm">
          Thanks — your request is in
        </h3>
        <p className="mt-3 max-w-sm font-light text-warm/60">
          A member of the {siteConfig.name} team will be in touch shortly. For
          anything urgent, call us directly.
        </p>
        <a
          href={siteConfig.phone.href}
          className="mt-8 inline-flex items-center gap-2 border border-warm px-6 py-3 text-xs font-medium tracking-[0.12em] text-warm uppercase transition-colors hover:bg-warm hover:text-ink-950"
        >
          <PhoneIcon className="h-4 w-4" />
          {siteConfig.phone.display}
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2"
    >
      <div className="sm:col-span-1">
        <label htmlFor="name" className={labelClasses}>
          Full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className={fieldClasses}
          placeholder="Jane Smith"
        />
      </div>

      <div className="sm:col-span-1">
        <label htmlFor="phone" className={labelClasses}>
          Phone number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          className={fieldClasses}
          placeholder="07123 456789"
        />
      </div>

      <div className="sm:col-span-1">
        <label htmlFor="postcode" className={labelClasses}>
          Postcode
        </label>
        <input
          id="postcode"
          name="postcode"
          type="text"
          required
          autoComplete="postal-code"
          className={fieldClasses}
          placeholder="SO14 5XX"
        />
      </div>

      <div className="sm:col-span-1">
        <label htmlFor="jobType" className={labelClasses}>
          Job type
        </label>
        <select
          id="jobType"
          name="jobType"
          required
          defaultValue=""
          className={fieldClasses}
        >
          <option value="" disabled>
            Select a job type
          </option>
          {jobTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="message" className={labelClasses}>
          Tell us a bit about the job
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          className={`${fieldClasses} resize-none`}
          placeholder="E.g. a few slates came off in the recent storm and there's a leak in the back bedroom..."
        />
      </div>

      <div className="sm:col-span-2 mt-4">
        <button
          type="submit"
          className="w-full bg-gold-500 px-8 py-4 text-xs font-medium tracking-[0.14em] text-ink-950 uppercase transition-colors hover:bg-gold-600 sm:w-auto"
        >
          Get My Free Quote
        </button>
        <p className="mt-4 text-xs text-warm/45">
          No obligation. We usually reply within one working day.
        </p>
      </div>
    </form>
  );
}
