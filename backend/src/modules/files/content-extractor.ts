import fs from "node:fs/promises";
import { CanvasFactory } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

export interface ExtractedResult {
  text: string | null;
  meta: Record<string, unknown>;
}

const MAX_TEXT_LENGTH = 50_000;

export const extractFileContent = async (
  filePath: string,
  mimeType: string,
): Promise<ExtractedResult> => {
  const meta: Record<string, unknown> = {};
  let text: string | null = null;

  try {
    if (mimeType === "application/pdf") {
      const buffer = await fs.readFile(filePath);
      const parser = new PDFParse({ data: buffer, CanvasFactory });
      const [parsedText, info] = await Promise.all([
        parser.getText().catch(() => null),
        parser.getInfo().catch(() => null),
      ]);

      if (parsedText?.text) {
        text = parsedText.text;
      }
      if (info) {
        meta.pages = info.total;
        meta.title = info.info?.Title || null;
        meta.author = info.info?.Author || null;
      }
    } else if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else if (
      mimeType === "application/vnd.ms-excel" ||
      mimeType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      const workbook = XLSX.read(await fs.readFile(filePath), { type: "buffer" });
      meta.sheets = workbook.SheetNames;
      text = workbook.SheetNames.map((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
          return `## ${sheetName}`;
        }
        return `## ${sheetName}\n${XLSX.utils.sheet_to_csv(sheet)}`;
      }).join("\n\n");
    } else if (
      mimeType.startsWith("text/") ||
      mimeType === "application/json"
    ) {
      const content = await fs.readFile(filePath, "utf-8");
      text = content;
    }
  } catch (error) {
    console.error(`Failed to extract content for file ${filePath}:`, error);
    meta.extractionError = error instanceof Error ? error.message : "Failed to extract text";
  }


  if (text) {
    text = text.trim();
    if (text.length > MAX_TEXT_LENGTH) {
      text = text.slice(0, MAX_TEXT_LENGTH) + "\n\n[Content truncated...]";
    }
  }

  return {
    text: text || null,
    meta,
  };
};
