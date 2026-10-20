"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fieldsForTemplate } from "@/lib/memories/templates";
import type { FieldSpec, HomeSettings, MemoryRecord } from "@/lib/memories/types";

export type EditorTarget =
  | { kind: "memory"; memory: MemoryRecord }
  | { kind: "home"; home: HomeSettings; memories: MemoryRecord[] };

interface EditorStatus {
  editor: boolean;
  configured: boolean;
  storage: boolean;
}

type FormValues = Record<string, string | boolean>;

const HOME_FIELDS: FieldSpec[] = [
  { key: "title", label: "Title", kind: "text" },
  { key: "subtitle", label: "Subtitle", kind: "text" },
  { key: "togetherSince", label: "Together since", kind: "date", help: "Used for the day counter." },
  { key: "footer", label: "Last line on the page", kind: "text" },
];

const memoryToForm = (memory: MemoryRecord): FormValues => {
  const values: FormValues = {};
  fieldsForTemplate(memory.template).forEach((field) => {
    const raw = field.key in memory ? memory[field.key as keyof MemoryRecord] : memory.extras[field.key];
    if (field.kind === "toggle") {
      values[field.key] = Boolean(raw);
    } else if (Array.isArray(raw)) {
      values[field.key] = raw.join("\n");
    } else {
      values[field.key] = typeof raw === "string" ? raw : "";
    }
  });
  return values;
};

const formToMemory = (memory: MemoryRecord, values: FormValues) => {
  const extras: Record<string, string | string[]> = {};
  const payload: Record<string, unknown> = {};
  fieldsForTemplate(memory.template).forEach((field) => {
    const value = values[field.key];
    const isExtra = !(field.key in memory) || field.key === "extras";
    const converted =
      field.kind === "list" && typeof value === "string"
        ? value.split("\n").map((line) => line.trim()).filter(Boolean)
        : value;
    if (isExtra) {
      extras[field.key] = converted as string | string[];
    } else {
      payload[field.key] = converted;
    }
  });
  return { ...payload, extras };
};

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[15px] text-[#1f1a17] shadow-inner outline-none transition focus:border-[#c2456b] focus:ring-2 focus:ring-[#c2456b]/20";

function Field({
  field,
  value,
  onChange,
}: {
  field: FieldSpec;
  value: string | boolean;
  onChange: (value: string | boolean) => void;
}) {
  if (field.kind === "toggle") {
    return (
      <label className="flex items-center gap-3 rounded-xl bg-black/[0.03] px-3 py-2.5 text-sm text-[#1f1a17]">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 accent-[#c2456b]"
        />
        {field.label}
      </label>
    );
  }

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-[#6b5b52]">{field.label}</span>
      {field.kind === "textarea" || field.kind === "list" ? (
        <textarea
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
          rows={field.kind === "list" ? 5 : 6}
          placeholder={field.placeholder}
          className={`${inputClass} min-h-[7rem] resize-y leading-relaxed`}
        />
      ) : field.kind === "select" ? (
        <select value={String(value)} onChange={(event) => onChange(event.target.value)} className={inputClass}>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.kind === "date" ? "date" : field.kind === "url" ? "url" : "text"}
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          className={inputClass}
        />
      )}
      {field.help ? <span className="mt-1 block text-xs leading-5 text-[#8a7a70]">{field.help}</span> : null}
    </label>
  );
}

const request = async (url: string, init: RequestInit) => {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string } & Record<string, unknown>;
  if (!response.ok) {
    throw new Error(data.error ?? `Something went wrong (${response.status}).`);
  }
  return data;
};

export function EditorDock({
  target,
  storageMessage,
  tone = "light",
}: {
  target: EditorTarget;
  storageMessage?: string;
  tone?: "light" | "dark";
}) {
  const router = useRouter();
  const [status, setStatus] = useState<EditorStatus | null>(null);
  const [open, setOpen] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [values, setValues] = useState<FormValues>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    let cancelled = false;
    fetch("/api/editor", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: EditorStatus | null) => {
        if (!cancelled && data) {
          setStatus(data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const openEditor = () => {
    setError("");
    setSaved(false);
    setValues(target.kind === "memory" ? memoryToForm(target.memory) : { ...target.home });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const unlock = () =>
    run(async () => {
      await request("/api/editor", { method: "POST", body: JSON.stringify({ passcode }) });
      setPasscode("");
      setStatus((current) => (current ? { ...current, editor: true } : current));
    });

  const lockEditing = () =>
    run(async () => {
      await request("/api/editor", { method: "DELETE" });
      setStatus((current) => (current ? { ...current, editor: false } : current));
      setOpen(false);
    });

  const save = () =>
    run(async () => {
      if (target.kind === "memory") {
        await request(`/api/memories/${target.memory.slug}`, {
          method: "PUT",
          body: JSON.stringify(formToMemory(target.memory, values)),
        });
      } else {
        await request("/api/home", { method: "PUT", body: JSON.stringify(values) });
      }
      setSaved(true);
      router.refresh();
    });

  const removeMemory = () => {
    if (target.kind !== "memory") {
      return;
    }
    const { memory } = target;
    const question = memory.builtIn
      ? "Put this memory's words back to how they were originally written?"
      : `Delete "${memory.title}" for good?`;
    if (!window.confirm(question)) {
      return;
    }
    void run(async () => {
      await request(`/api/memories/${memory.slug}`, { method: "DELETE" });
      if (memory.builtIn) {
        setOpen(false);
        router.refresh();
      } else {
        router.push("/");
        router.refresh();
      }
    });
  };

  const toggleHidden = (memory: MemoryRecord) =>
    run(async () => {
      await request(`/api/memories/${memory.slug}`, {
        method: "PUT",
        body: JSON.stringify({ ...formToMemory(memory, memoryToForm(memory)), hidden: !memory.hidden }),
      });
      router.refresh();
    });

  const createMemory = () =>
    run(async () => {
      const data = (await request("/api/memories", {
        method: "POST",
        body: JSON.stringify({ title: newTitle, startDate: newDate }),
      })) as { memory?: MemoryRecord };
      if (data.memory) {
        router.push(`/memories/${data.memory.slug}` as Route);
      }
    });

  const fields = target.kind === "memory" ? fieldsForTemplate(target.memory.template) : HOME_FIELDS;
  const buttonTone =
    tone === "dark"
      ? "border-white/20 bg-black/40 text-white hover:bg-black/60"
      : "border-black/10 bg-white/80 text-[#3d2a24] hover:bg-white";

  return (
    <>
      <button
        type="button"
        onClick={openEditor}
        aria-label="Edit this page"
        className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-[60] grid h-11 w-11 place-items-center rounded-full border shadow-lg backdrop-blur transition hover:scale-105 ${buttonTone}`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z" />
          <path d="M13.5 6.5l4 4" />
        </svg>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] flex justify-end bg-black/30 backdrop-blur-[2px]" onClick={() => setOpen(false)}>
          <aside
            onClick={(event) => event.stopPropagation()}
            className="flex h-full w-full max-w-md flex-col bg-[#fbf8f4] font-sans text-[#1f1a17] shadow-2xl [color-scheme:light] sm:rounded-l-3xl"
          >
            <header className="flex items-center justify-between border-b border-black/5 px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c2456b]">Edit mode</p>
                <h2 className="text-lg font-semibold">
                  {target.kind === "memory" ? target.memory.title : "The collection"}
                </h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full px-3 py-1 text-sm text-[#6b5b52] hover:bg-black/5">
                Close
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {!status ? (
                <p className="text-sm text-[#6b5b52]">Checking…</p>
              ) : !status.configured ? (
                <p className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  Editing is switched off. Add an <code>EDITOR_PASSCODE</code> environment variable to turn it on.
                </p>
              ) : !status.editor ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void unlock();
                  }}
                  className="space-y-3"
                >
                  <p className="text-sm leading-6 text-[#6b5b52]">Enter the editing passcode to change words, dates, songs and photo albums.</p>
                  <input
                    type="password"
                    value={passcode}
                    onChange={(event) => setPasscode(event.target.value)}
                    placeholder="Passcode"
                    autoFocus
                    className={inputClass}
                  />
                  <button
                    type="submit"
                    disabled={busy || !passcode}
                    className="w-full rounded-full bg-[#1f1a17] px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-40"
                  >
                    {busy ? "Checking…" : "Unlock editing"}
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  {!status.storage || storageMessage ? (
                    <p className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                      {storageMessage ?? "Saving needs the Supabase environment variables to be set."}
                    </p>
                  ) : null}

                  <div className="space-y-4">
                    {fields.map((field) => (
                      <Field
                        key={field.key}
                        field={field}
                        value={values[field.key] ?? (field.kind === "toggle" ? false : "")}
                        onChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))}
                      />
                    ))}
                  </div>

                  {target.kind === "memory" && (target.memory.edited || !target.memory.builtIn) ? (
                    <button
                      type="button"
                      onClick={removeMemory}
                      disabled={busy}
                      className="text-sm text-[#a3322b] underline-offset-4 hover:underline"
                    >
                      {target.memory.builtIn ? "Restore the original words" : "Delete this memory"}
                    </button>
                  ) : null}

                  {target.kind === "home" ? (
                    <>
                      <section className="space-y-3 rounded-2xl border border-black/5 bg-white p-4">
                        <h3 className="text-sm font-semibold">Add a new memory</h3>
                        <p className="text-xs leading-5 text-[#8a7a70]">
                          New memories start as a keepsake page with a scratch-card surprise. Pick its colours, story and album once it&apos;s created.
                        </p>
                        <input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="What happened?" className={inputClass} />
                        <input type="date" value={newDate} onChange={(event) => setNewDate(event.target.value)} className={inputClass} />
                        <button
                          type="button"
                          onClick={() => void createMemory()}
                          disabled={busy || !newTitle.trim()}
                          className="w-full rounded-full bg-[#c2456b] px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-40"
                        >
                          Create memory
                        </button>
                      </section>

                      <section className="space-y-2">
                        <h3 className="text-sm font-semibold">Memories</h3>
                        {target.memories.map((memory) => (
                          <div key={memory.slug} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm">
                            <a href={`/memories/${memory.slug}`} className="truncate hover:underline">
                              {memory.title}
                            </a>
                            <button
                              type="button"
                              onClick={() => void toggleHidden(memory)}
                              disabled={busy}
                              className="shrink-0 rounded-full border border-black/10 px-3 py-1 text-xs text-[#6b5b52] hover:bg-black/5"
                            >
                              {memory.hidden ? "Hidden · show" : "Shown · hide"}
                            </button>
                          </div>
                        ))}
                      </section>
                    </>
                  ) : null}
                </div>
              )}
            </div>

            {status?.editor ? (
              <footer className="space-y-2 border-t border-black/5 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
                {error ? <p className="text-sm text-[#a3322b]">{error}</p> : null}
                {saved ? <p className="text-sm text-[#3c7a4a]">Saved.</p> : null}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void save()}
                    disabled={busy}
                    className="flex-1 rounded-full bg-[#1f1a17] px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-40"
                  >
                    {busy ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void lockEditing()}
                    disabled={busy}
                    className="rounded-full border border-black/10 px-4 py-2.5 text-sm text-[#6b5b52] hover:bg-black/5"
                  >
                    Lock
                  </button>
                </div>
              </footer>
            ) : error ? (
              <p className="px-5 pb-6 text-sm text-[#a3322b]">{error}</p>
            ) : null}
          </aside>
        </div>
      ) : null}
    </>
  );
}
