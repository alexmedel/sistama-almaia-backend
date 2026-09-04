import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const xlsxPath = "C:/Users/USER/Documents/BE-Almaia/outputs/matriz_informes_limpia_20260704/matriz_informes_limpia_sin_fechas_20260704.xlsx";
const outPath = "C:/Users/USER/Documents/BE-Almaia/outputs/matriz_informes_limpia_20260704/resumen_preview.png";

const input = await FileBlob.load(xlsxPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "formula error scan",
});
console.log(errors.ndjson);

const preview = await workbook.render({
  sheetName: "Resumen",
  range: "A1:E5",
  scale: 2,
  format: "png",
});
await fs.writeFile(outPath, new Uint8Array(await preview.arrayBuffer()));
console.log(outPath);
