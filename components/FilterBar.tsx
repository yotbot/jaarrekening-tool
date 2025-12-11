"use client";

export default function FilterBar({
  filter,
  setFilter,
}: {
  filter: string;
  setFilter: (v: "all" | "found" | "notfound") => void;
}) {
  return (
    <div className="flex gap-3 mt-2">
      {[
        { key: "all", label: "Alles" },
        { key: "found", label: "✔ Gevonden" },
        { key: "notfound", label: "✘ Niet gevonden" },
      ].map((f) => (
        <button
          key={f.key}
          onClick={() => setFilter(f.key as any)}
          className={`px-3 py-1 rounded-lg border ${
            filter === f.key
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
