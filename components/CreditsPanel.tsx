"use client";

import { SimbaAvatar } from "@/components/SimbaAvatar";

export function CreditsPanel({
  title,
  message,
  onClose,
}: {
  title: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-4 md:p-6">
      <div className="panel-paper flex max-h-[calc(100%-2rem)] w-full max-w-full flex-col rounded-[30px] border border-white/12 px-5 py-6 md:max-w-2xl md:px-8 md:py-10">
        <div className="flex items-center gap-3">
          <SimbaAvatar className="h-11 w-11 shrink-0 md:h-12 md:w-12" />
          <p className="text-xs uppercase tracking-[0.3em] text-lantern-red/80">
            From Simba
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-4 pt-3 pb-safe">
          <h2 className="text-2xl font-semibold text-text-ink md:text-4xl">{title}</h2>
          <p className="mt-6 whitespace-pre-line text-base leading-8 text-text-ink/90 md:text-lg md:leading-9">
            {message}
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-text-ink px-6 py-3 font-semibold text-paper-cream transition hover:scale-[1.02] sm:w-auto"
          >
            Back to the Shrine
          </button>
        </div>
      </div>
    </div>
  );
}
