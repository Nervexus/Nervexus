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
      <div className="flex flex-col items-center rounded-2xl border border-brass-500/20 bg-brass-500/5 px-8 py-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brass-500 text-navy-950">
          <CheckIcon className="h-7 w-7" />
        </span>
        <h3 className="mt-5 font-display text-2xl font-bold text-navy-950">
          Thanks — your request is in!
        </h3>
        <p className="mt-2 max-w-sm text-navy-900/65">
          A member of the {siteConfig.name} team will be in touch shortly. For
          anything urgent, call us directly.
        </p>
        <a
          href={siteConfig.phone.href}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-navy-950 px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-navy-900"
        >
          <PhoneIcon className="h-4 w-4 text-brass-400" />
          {siteConfig.phone.display}
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-5 rounded-2xl border border-navy-900/8 bg-white p-6 shadow-card-lg sm:grid-cols-2 sm:p-8"
    >
      <div className="sm:col-span-1">
        <label htmlFor="name" className="text-sm font-semibold text-navy-900">
          Full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="mt-1.5 w-full rounded-lg border border-navy-900/15 bg-white px-3.5 py-2.5 text-navy-950 outline-none transition-colors focus:border-brass-500 focus:ring-2 focus:ring-brass-500/20"
          placeholder="Jane Smith"
        />
      </div>

      <div className="sm:col-span-1">
        <label htmlFor="phone" className="text-sm font-semibold text-navy-900">
          Phone number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          className="mt-1.5 w-full rounded-lg border border-navy-900/15 bg-white px-3.5 py-2.5 text-navy-950 outline-none transition-colors focus:border-brass-500 focus:ring-2 focus:ring-brass-500/20"
          placeholder="07123 456789"
        />
      </div>

      <div className="sm:col-span-1">
        <label
          htmlFor="postcode"
          className="text-sm font-semibold text-navy-900"
        >
          Postcode
        </label>
        <input
          id="postcode"
          name="postcode"
          type="text"
          required
          autoComplete="postal-code"
          className="mt-1.5 w-full rounded-lg border border-navy-900/15 bg-white px-3.5 py-2.5 text-navy-950 outline-none transition-colors focus:border-brass-500 focus:ring-2 focus:ring-brass-500/20"
          placeholder="SO14 5XX"
        />
      </div>

      <div className="sm:col-span-1">
        <label
          htmlFor="jobType"
          className="text-sm font-semibold text-navy-900"
        >
          Job type
        </label>
        <select
          id="jobType"
          name="jobType"
          required
          defaultValue=""
          className="mt-1.5 w-full rounded-lg border border-navy-900/15 bg-white px-3.5 py-2.5 text-navy-950 outline-none transition-colors focus:border-brass-500 focus:ring-2 focus:ring-brass-500/20"
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
        <label
          htmlFor="message"
          className="text-sm font-semibold text-navy-900"
        >
          Tell us a bit about the job
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="mt-1.5 w-full resize-none rounded-lg border border-navy-900/15 bg-white px-3.5 py-2.5 text-navy-950 outline-none transition-colors focus:border-brass-500 focus:ring-2 focus:ring-brass-500/20"
          placeholder="E.g. a few slates came off in the recent storm and there's a leak in the back bedroom..."
        />
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          className="w-full rounded-full bg-brass-500 px-6 py-3.5 text-base font-semibold text-navy-950 shadow-card transition-colors hover:bg-brass-600 sm:w-auto"
        >
          Get My Free Quote
        </button>
        <p className="mt-3 text-xs text-navy-900/50">
          No obligation. We usually reply within one working day.
        </p>
      </div>
    </form>
  );
}
