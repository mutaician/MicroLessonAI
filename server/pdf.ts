import pdfParse from "pdf-parse";

const MAX_PDF_BYTES = 8 * 1024 * 1024;
const MAX_PDF_PAGES = 5;
const MAX_SOURCE_CHARS = 18_000;

export const normalizeSourceText = (text: string) =>
  text.replace(/\s+/g, " ").trim().slice(0, MAX_SOURCE_CHARS);

export const previewText = (text: string) => text.slice(0, 260);

export async function extractPdfText(file: File) {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Upload a PDF file.");
  }

  if (file.size > MAX_PDF_BYTES) {
    throw new Error("PDF is too large for this demo. Use a file under 8 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await pdfParse(buffer, { max: MAX_PDF_PAGES });
  const text = normalizeSourceText(parsed.text);

  if (text.length < 120) {
    throw new Error("Could not extract enough text from this PDF. Try a text-based PDF or paste a topic.");
  }

  return text;
}
