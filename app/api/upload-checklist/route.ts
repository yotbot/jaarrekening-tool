import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { spawn } from "child_process";

export const runtime = "nodejs"; // Node-API routes

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // --- Save uploaded file to /tmp ---
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempPath = path.join("/tmp", `checklist-${Date.now()}.xlsx`);
    await writeFile(tempPath, buffer);

    // --- Run Python script ---
    const pythonPath = "python3"; // or "python" depending on your system
    const scriptPath = path.join(process.cwd(), "python/convert_checklist.py");

    const pythonProcess = spawn(pythonPath, [scriptPath, tempPath]);

    let output = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    const exitCode: number = await new Promise((resolve) => {
      pythonProcess.on("close", resolve);
    });

    // Delete uploaded temp file
    await unlink(tempPath);

    if (exitCode !== 0) {
      return NextResponse.json(
        { error: "Python script failed", details: errorOutput },
        { status: 500 }
      );
    }

    // --- Parse JSON output from python ---
    let json;
    try {
      json = JSON.parse(output);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON output from Python", output },
        { status: 500 }
      );
    }

    return NextResponse.json({ items: json }, { status: 200 });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json(
      { error: "Server error", details: String(error) },
      { status: 500 }
    );
  }
}
