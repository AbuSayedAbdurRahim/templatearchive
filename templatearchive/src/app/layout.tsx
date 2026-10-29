import type { Metadata, Viewport } from "next";
import { OnlineStatus, SwRegister } from "@/components/Shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Template Archive",
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Archive", statusBarStyle: "default" },
};
export const viewport: Viewport = { themeColor: "#1d4b5c", width: "device-width", initialScale: 1 };

const themeScript = `try{var t=localStorage.getItem("theme");if(!t&&matchMedia("(prefers-color-scheme: dark)").matches)t="dark";if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <OnlineStatus />
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
