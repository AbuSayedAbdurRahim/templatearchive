"use client";
import { useEffect, useState } from "react";

export function OnlineStatus() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return online ? null : <div className="offline-bar" role="status">You are offline. Private content needs a connection.</div>;
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.dataset.theme === "dark"), []);
  return (
    <button type="button" className="btn ghost" aria-label="Toggle dark mode" onClick={() => {
      const next = dark ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch { /* ignore */ }
      setDark(!dark);
    }}>{dark ? "Light" : "Dark"}</button>
  );
}

/** Registers the service worker and offers an update when a new version is waiting. */
export function SwRegister() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      const check = () => { if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting); };
      check();
      reg.addEventListener("updatefound", () => reg.installing?.addEventListener("statechange", check));
    }).catch(() => undefined);
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (!reloaded) { reloaded = true; location.reload(); } });
  }, []);
  return waiting ? (
    <div className="offline-bar" role="status">
      A new version is ready.{" "}
      <button className="btn" onClick={() => waiting.postMessage("SKIP_WAITING")}>Refresh</button>
    </div>
  ) : null;
}

export function clearLocalCaches() {
  if ("caches" in window) caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => undefined);
}
