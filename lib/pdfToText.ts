import PDFParser from "pdf2json";

export async function pdfToText(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (err: any) => {
      reject(err?.parserError || err);
    });

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      // Gebruik de juiste node voor jouw PDF:
      const pages = pdfData?.Pages || [];
      const textParts: string[] = [];

      for (const page of pages) {
        for (const textObj of page.Texts || []) {
          for (const item of textObj.R || []) {
            const decoded = decodeURIComponent(item.T);
            if (decoded.trim()) {
              // skip lege '%20'
              textParts.push(decoded);
            }
          }
        }
      }

      resolve(textParts.join(" ").replace(/\s+/g, " ").trim());
    });

    pdfParser.parseBuffer(buffer);
  });
}
