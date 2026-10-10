import { siteConfig } from "@/config/site";
import { PhoneIcon, WhatsAppIcon } from "./icons";

export function StickyMobileBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex gap-px border-t border-navy-900/10 bg-cream/95 shadow-[0_-4px_16px_rgba(15,27,45,0.08)] backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden">
      <a
        href={siteConfig.phone.href}
        className="flex flex-1 items-center justify-center gap-2 bg-navy-950 py-3.5 text-sm font-semibold text-cream"
      >
        <PhoneIcon className="h-4 w-4" />
        Call Now
      </a>
      <a
        href={`https://wa.me/${siteConfig.whatsapp.number}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-1 items-center justify-center gap-2 bg-[#25D366] py-3.5 text-sm font-semibold text-white"
      >
        <WhatsAppIcon className="h-4 w-4" />
        WhatsApp
      </a>
    </div>
  );
}
