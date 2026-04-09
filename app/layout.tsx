import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Alps Snow — French Alps Snow Quality",
  description:
    "Search any French Alps ski resort to see today's snow quality score and the upcoming forecast.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-800`}
        style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
      >
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="max-w-4xl mx-auto px-4 h-13 flex items-center justify-between" style={{ height: "52px" }}>
            <a href="/" className="flex items-center gap-2 shrink-0">
              <span className="text-[17px] font-bold tracking-tight text-slate-900">⛷ Alps Snow</span>
            </a>
            <nav className="flex items-center gap-6 text-sm text-slate-500">
              <a href="/" className="hover:text-slate-800 transition-colors">Home</a>
              <a href="/ranking" className="hover:text-slate-800 transition-colors">Ranking</a>
              <a href="/about" className="hover:text-slate-800 transition-colors">About</a>
            </nav>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8 min-h-[calc(100vh-52px-68px)]">
          {children}
        </main>

        <footer className="border-t border-slate-200 mt-16">
          <div className="max-w-4xl mx-auto px-4 py-5 flex flex-col sm:flex-row justify-between gap-2 text-xs text-slate-400">
            <span>
              Alps Snow · Weather from{" "}
              <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
                Open-Meteo
              </a>
            </span>
            <span>Scores are estimates. Always check local conditions.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
