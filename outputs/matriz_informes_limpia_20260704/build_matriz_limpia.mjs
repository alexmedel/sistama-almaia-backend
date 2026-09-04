import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "C:/Users/USER/Documents/BE-Almaia/outputs/matriz_informes_limpia_20260704";
const payloadPath = path.join(outputDir, "matriz_payload.json");
const outputPath = path.join(outputDir, "matriz_informes_limpia_sin_fechas_20260704.xlsx");

function colName(index) {
  let n = index + 1;
  let name = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

const payload = JSON.parse(await fs.readFile(payloadPath, "utf8"));
const workbook = Workbook.create();

const summary = workbook.worksheets.add("Resumen");
summary.showGridLines = false;
summary.getRange("A1:E1").values = [["Ambito", "Filas", "Columnas", "Activo true", "Notas"]];
const summaryRows = Object.entries(payload).map(([sheetName, data]) => [
  sheetName,
  data.rows.length,
  data.columns.length,
  data.rows.filter((row) => row[data.columns.indexOf("activo")] === true).length,
  "Sin matriz_informe_id, fecha_creacion, fecha_actualizacion",
]);
summary.getRangeByIndexes(1, 0, summaryRows.length, 5).values = summaryRows;
summary.getRange("A1:E1").format = {
  fill: "#1F4E78",
  font: { bold: true, color: "#FFFFFF" },
};
summary.getRange("A1:E5").format.borders = { preset: "all", style: "thin", color: "#D9E2F3" };
summary.getRange("A:E").format.autofitColumns();
summary.freezePanes.freezeRows(1);

for (const [sheetName, data] of Object.entries(payload)) {
  const sheet = workbook.worksheets.add(sheetName);
  sheet.showGridLines = false;

  const matrix = [data.columns, ...data.rows];
  const lastCol = colName(data.columns.length - 1);
  const lastRow = matrix.length;
  sheet.getRangeByIndexes(0, 0, matrix.length, data.columns.length).values = matrix;

  const header = sheet.getRange(`A1:${lastCol}1`);
  header.format = {
    fill: "#1F4E78",
    font: { bold: true, color: "#FFFFFF" },
    wrapText: true,
  };
  sheet.freezePanes.freezeRows(1);

  const used = sheet.getRange(`A1:${lastCol}${lastRow}`);
  used.format.borders = { preset: "inside", style: "thin", color: "#E7EEF8" };

  const descIdx = data.columns.indexOf("descripcion_informe");
  const recIdx = data.columns.indexOf("recomendacion_almaia");
  for (const idx of [descIdx, recIdx]) {
    if (idx >= 0) {
      const column = sheet.getRange(`${colName(idx)}:${colName(idx)}`);
      column.format.columnWidth = 70;
      column.format.wrapText = true;
    }
  }
  for (const idx of [data.columns.indexOf("codigo_informe"), data.columns.indexOf("nombre_fisico")]) {
    if (idx >= 0) {
      sheet.getRange(`${colName(idx)}:${colName(idx)}`).format.columnWidth = 18;
    }
  }
  sheet.getRange("A:M").format.autofitColumns();
  if (descIdx >= 0) sheet.getRange(`${colName(descIdx)}:${colName(descIdx)}`).format.columnWidth = 70;
  if (recIdx >= 0) sheet.getRange(`${colName(recIdx)}:${colName(recIdx)}`).format.columnWidth = 70;
  sheet.getRange(`A2:${lastCol}${lastRow}`).format.rowHeight = 48;
}

const inspect = await workbook.inspect({
  kind: "sheet,table",
  maxChars: 4000,
  tableMaxRows: 5,
  tableMaxCols: 8,
  tableMaxCellChars: 80,
});
console.log(inspect.ndjson);

await fs.mkdir(outputDir, { recursive: true });
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);
console.log(outputPath);
