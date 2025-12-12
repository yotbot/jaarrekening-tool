"use client";

import Link from "next/link";

export default function WaveHero() {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Soft background glows */}
      <div className="pointer-events-none absolute -top-32 left-1/2 w-[500px] h-[500px] -translate-x-1/2 rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute top-32 right-1/4 w-[300px] h-[300px] rounded-full blur-[80px]" />

      {/* CONTENT */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-16 flex flex-col gap-16">
        {/* HEADER / NAV */}
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-mono tracking-tight"
            style={{ color: "var(--theme-foreground)" }}
          >
            Jaarrekening
            <span style={{ color: "var(--theme-brand-3)" }}>Checker</span>
          </Link>
        </header>

        {/* HERO TEXT */}
        <section className="space-y-6 max-w-3xl">
          <h1
            className="text-5xl md:text-7xl font-sans font-semibold tracking-tight leading-tight"
            style={{ color: "var(--theme-foreground)" }}
          >
            Analyseer je jaarrekening sneller & slimmer met AI
          </h1>

          <p
            className="text-lg max-w-xl"
            style={{ color: "var(--theme-dark)" }}
          >
            Upload je jaarrekening en checklist en ontvang een helder overzicht
            van alle gevonden toelichtingen, risico’s en ontbrekende onderdelen.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/analysis"
              className="px-12 py-6 font-mono uppercase rounded-xl text-sm font-medium border text-background bg-foreground"
            >
              Aan de slag
            </Link>
          </div>
        </section>

        {/* FEATURE CARDS */}
        <section className="grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Upload gemakkelijk",
              body: "Ondersteunt PDF’s & Excel checklists. Geen installatie nodig.",
            },
            {
              title: "AI-gedreven analyse",
              body: "Detecteert pagina-relevantie, scores en samenvattingen.",
            },
            {
              title: "Direct inzicht",
              body: "Begrijp in één oogopslag wat wel en niet is toegelicht.",
            },
          ].map((f, i) => (
            <div key={i} className="transition">
              <div className="bg-neutral-3 p-4 flex items-center justify-center">
                <h3 className="font-sans font-semibold">{f.title}</h3>
              </div>
              <div className="p-4 border border-neutral-3">
                <p className="font-mono text-sm">{f.body}</p>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
