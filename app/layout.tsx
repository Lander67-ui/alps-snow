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
  title: "Alps Snow — French Alps Snow Quality Scores",
  description:
    "Daily snow quality scores for 10 French Alps ski resorts. Updated every morning using live weather data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-800`}
        style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
      >
        {/* Site header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900">⛷ Alps Snow</span>
            </a>
            <nav className="flex items-center gap-5 text-sm text-slate-500">
              <a href="/" className="hover:text-slate-800 transition-colors">Resorts</a>
              <a href="/about" className="hover:text-slate-800 transition-colors">About</a>
            </nav>
          </div>
        </header>

        {/* Page content */}
        <main className="max-w-3xl mx-auto px-4 py-6 min-h-[calc(100vh-6rem)]">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 mt-12">
          <div className="max-w-3xl mx-auto px-4 py-5 flex flex-col sm:flex-row justify-between gap-2 text-xs text-slate-400">
            <span>
              Alps Snow · Weather data from{" "}
              <a
                href="https://open-meteo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-slate-600"
              >
                Open-Meteo
              </a>
            </span>
            <span>Scores are estimates. Always check local conditions before heading out.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
