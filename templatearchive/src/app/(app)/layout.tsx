import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { logout } from "@/lib/actions";
import { ThemeToggle } from "@/components/Shell";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireOwner();
  const s = await getSettings();
  return (
    <>
      <header className="top">
        <Link href="/" className="brand">{s.siteName}</Link>
        <nav aria-label="Main">
          <Link href="/templates">Templates</Link>
          <Link href="/templates/new">New</Link>
          <Link href="/admin">Admin</Link>
        </nav>
        <div className="top-right">
          <ThemeToggle />
          <form action={logout}><LogoutButton /></form>
        </div>
      </header>
      <main id="main" className="page">{children}</main>
    </>
  );
}
