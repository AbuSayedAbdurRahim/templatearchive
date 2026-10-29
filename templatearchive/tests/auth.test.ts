import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ redirect: (to: string) => { throw new Error(`REDIRECT:${to}`); } }));
const state = { user: null as null | { id: string }, admin: false };
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.admin ? { user_id: "u" } : null }) }) }) }),
  }),
}));

import { requireOwner } from "@/lib/auth";

describe("requireOwner", () => {
  it("redirects unauthenticated visitors to login", async () => {
    state.user = null;
    await expect(requireOwner()).rejects.toThrow("REDIRECT:/login");
  });
  it("rejects signed-in users who are not listed admins", async () => {
    state.user = { id: "u" }; state.admin = false;
    await expect(requireOwner()).rejects.toThrow("REDIRECT:/login?error=not_authorized");
  });
  it("allows the listed admin", async () => {
    state.user = { id: "u" }; state.admin = true;
    await expect(requireOwner()).resolves.toBeTruthy();
  });
});
