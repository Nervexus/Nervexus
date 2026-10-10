"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/config/site";
import { ChatIcon, CloseIcon, PhoneIcon, WhatsAppIcon } from "./icons";

export function FloatingContactBubble() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="fixed right-5 bottom-5 z-50 flex flex-col items-end gap-3 sm:right-8 sm:bottom-8"
    >
      {open && (
        <div className="w-64 border border-warm/10 bg-ink-800 shadow-card-lg">
          <p className="border-b border-warm/10 px-5 py-4 text-xs font-medium tracking-[0.1em] text-warm/50 uppercase">
            Get In Touch
          </p>
          <a
            href={siteConfig.phone.href}
            className="group flex items-center gap-3 border-b border-warm/10 px-5 py-4 text-sm text-warm transition-colors hover:bg-gold-500 hover:text-ink-950"
          >
            <PhoneIcon className="h-4 w-4 shrink-0" />
            <span>
              Call Now
              <span className="block text-xs text-warm/50 group-hover:text-ink-950/60">
                {siteConfig.phone.display}
              </span>
            </span>
          </a>
          <a
            href={`https://wa.me/${siteConfig.whatsapp.number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-5 py-4 text-sm text-warm transition-colors hover:bg-gold-500 hover:text-ink-950"
          >
            <WhatsAppIcon className="h-4 w-4 shrink-0" />
            WhatsApp Us
          </a>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Close contact options" : "Open contact options"}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-gold-500 bg-ink-950 text-gold-400 shadow-card-lg transition-colors hover:bg-ink-800"
      >
        {open ? (
          <CloseIcon className="h-5 w-5" />
        ) : (
          <ChatIcon className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
