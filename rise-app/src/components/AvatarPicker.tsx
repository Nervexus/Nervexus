"use client";

import { useRef } from "react";
import { CameraIcon, PersonIcon } from "./icons";

const AVATAR_DIM = 256;

export function AvatarPicker({
  value,
  onChange,
  size = 88,
}: {
  value: string | null;
  onChange: (dataUrl: string) => void;
  size?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = AVATAR_DIM;
        canvas.height = AVATAR_DIM;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const scale = Math.max(AVATAR_DIM / img.width, AVATAR_DIM / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (AVATAR_DIM - w) / 2, (AVATAR_DIM - h) / 2, w, h);
        onChange(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => inputRef.current?.click()}
        aria-label="Change profile picture"
        className="flex items-center justify-center overflow-hidden rounded-full glass"
        style={{ width: size, height: size }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <PersonIcon className="h-8 w-8 text-muted" />
        )}
      </button>
      <span className="pointer-events-none absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-ink">
        <CameraIcon className="h-3.5 w-3.5" />
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
