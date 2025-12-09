import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { randomUUID } from "crypto";
import path from "path";

export async function POST(req: Request) {
  const data = await req.formData();
  const file = data.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  // file opslaan
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = `${randomUUID()}.xlsm`;
  const filepath = path.join("/tmp", filename);

  await writeFile(filepath, buffer);

  // python script uitvoeren
  const python = "/usr/bin/python3"; // of "python3"
  const script = "convert_checklist.py";

  return new Promise((resolve) => {
    execFile(python, [script, filepath], (error, stdout, stderr) => {
      if (error) {
        resolve(
          NextResponse.json({ error: stderr.toString() }, { status: 500 })
        );
        return;
      }

      try {
        const json = JSON.parse(stdout);
        resolve(NextResponse.json({ data: json }));
      } catch (e) {
        resolve(
          NextResponse.json({ error: "JSON parse error" }, { status: 500 })
        );
      }
    });
  });
}
