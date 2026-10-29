import { login } from "@/lib/actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const msg = sp.error === "not_authorized" ? "This account is not allowed to use the archive." : sp.error ? "Email or password is incorrect." : null;
  return (
    <main id="main" className="login">
      <h1>Sign in</h1>
      {msg && <p className="notice error" role="alert">{msg}</p>}
      <form action={login} className="stack">
        <label>Email<input name="email" type="email" autoComplete="username" required /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
        <button className="btn primary" type="submit">Sign in</button>
      </form>
    </main>
  );
}
