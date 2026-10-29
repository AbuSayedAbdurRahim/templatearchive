"use client";
import { useState } from "react";
import { markUsed } from "@/lib/actions";

export function CopyButton({ id, content, label = "Copy" }: { id: string; content: string; label?: string }) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(content); // exact string, no trimming or re-encoding
      setState("ok");
      void markUsed(id);
    } catch {
      setState("fail");
    }
    setTimeout(() => setState("idle"), 1800);
  }
  return (
    <button type="button" className="btn primary" onClick={copy} aria-live="polite">
      {state === "ok" ? "Copied" : state === "fail" ? "Copy failed" : label}
    </button>
  );
}
