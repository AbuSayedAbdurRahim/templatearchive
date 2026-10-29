"use client";
import { clearLocalCaches } from "./Shell";
export function LogoutButton() {
  return <button className="btn ghost" type="submit" onClick={clearLocalCaches}>Sign out</button>;
}
