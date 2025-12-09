"use client";

import { useState } from "react";

export default function UploadChecklistPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) {
      setError("No file selected");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-checklist", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Upload failed");
        console.error("Error details:", json.details);
      } else {
        setResult(json.items);
      }
    } catch (err: any) {
      setError("Unexpected error: " + err.message);
    }

    setLoading(false);
  }

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "20px" }}>Upload SRA Checklist</h1>

      <input
        type="file"
        accept=".xlsx,.xlsm,.xls"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <br />
      <br />

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        style={{
          padding: "10px 20px",
          backgroundColor: "#0070f3",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      <br />
      <br />

      {error && (
        <div style={{ color: "red", whiteSpace: "pre-wrap" }}>{error}</div>
      )}

      {result && (
        <div>
          <h2>Result</h2>
          <pre
            style={{
              background: "#f4f4f4",
              padding: "20px",
              borderRadius: "6px",
              overflowX: "auto",
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
