"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function SearchBox({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("q") ?? "") === q) return;
      const next = new URLSearchParams(params.toString());
      if (q) next.set("q", q); else next.delete("q");
      next.delete("page");
      router.replace(`/templates?${next}`);
    }, 250);
    return () => clearTimeout(t);
  }, [q, params, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") { e.preventDefault(); ref.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <input ref={ref} className="search" type="search" value={q} onChange={(e) => setQ(e.target.value)}
      placeholder="Search templates  ( / )" aria-label="Search templates" autoFocus={autoFocus} />
  );
}
