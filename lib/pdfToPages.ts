// lib/pdfToPages.ts

import PDFParser from "pdf2json";

export async function pdfToPages(
  buffer: Buffer
): Promise<{ page: number; text: string }[]> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (err: any) => {
      reject(err?.parserError || err);
    });

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      const pages = pdfData?.Pages || [];
      const result: { page: number; text: string }[] = [];

      pages.forEach((page: any, index: number) => {
        const parts: string[] = [];

        for (const textObj of page.Texts || []) {
          for (const item of textObj.R || []) {
            const text = decodeURIComponent(item.T).trim();
            if (text) parts.push(text);
          }
        }

        result.push({
          page: index + 1,
          text: parts.join(" ").replace(/\s+/g, " ").trim(),
        });
      });

      resolve(result);
    });

    pdfParser.parseBuffer(buffer);
  });
}
