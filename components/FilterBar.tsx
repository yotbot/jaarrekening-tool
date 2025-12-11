"use client";

export default function FilterBar({
  filter,
  setFilter,
}: {
  filter: string;
  setFilter: (v: "all" | "found" | "notfound") => void;
}) {
  return (
    <div className="inline-block bg-neutral-3 p-2 rounded-full">
      <div className="flex gap-3 ">
        {[
          { key: "all", label: "Alles" },
          { key: "found", label: "✔ Gevonden" },
          { key: "notfound", label: "✘ Niet gevonden" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`px-6 py-3 font-normal rounded-full uppercase font-mono text-sm cursor-pointer ${
              filter === f.key
                ? "bg-foreground text-white"
                : "bg-transparent text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
