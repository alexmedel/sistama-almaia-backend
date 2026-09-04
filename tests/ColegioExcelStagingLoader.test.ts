import ExcelJS from "exceljs";
import { ColegioExcelStagingLoader } from "../src/core/services/ColegioExcelStagingLoader";
import { ValidationError } from "../src/helpers/ErrorResponse";

async function buildWorkbookBuffer(rows: string[][]) {
  const workbook = new ExcelJS.Workbook();
  const alumnos = workbook.addWorksheet("Alumnos");

  alumnos.addRow([
    "RUT",
    "NOMBRE",
    "APELLIDOS",
    "CURSO",
    "EMAIL",
    "RUT_APODERADO_1",
    "NOMBRE_APODERADO_1",
    "APELLIDO_APODERADO_1",
    "EMAIL_APODERADO_1",
  ]);
  rows.forEach((row) => alumnos.addRow(row));

  return workbook.xlsx.writeBuffer();
}

describe("ColegioExcelStagingLoader", () => {
  it("rejects duplicated emails in the Excel before creating staging rows", async () => {
    const sql = jest.fn() as any;
    const loader = new ColegioExcelStagingLoader(sql);
    const buffer = await buildWorkbookBuffer([
      [
        "11111111-1",
        "Alumno",
        "Uno",
        "1A",
        "duplicado@almaia.cl",
        "21111111-1",
        "Apoderado",
        "Uno",
        "apoderado1@almaia.cl",
      ],
      [
        "12222222-2",
        "Alumno",
        "Dos",
        "1A",
        "DUPLICADO@almaia.cl",
        "22222222-2",
        "Apoderado",
        "Dos",
        "apoderado2@almaia.cl",
      ],
    ]);

    await expect(
      loader.load({
        buffer: Buffer.from(buffer),
        originalname: "colegio.xlsx",
      } as Express.Multer.File)
    ).rejects.toMatchObject({
      name: "ValidationError",
      message: "Excel contiene correos duplicados. Corrige el archivo antes de cargar staging.",
    } satisfies Partial<ValidationError>);

    expect(sql).not.toHaveBeenCalled();
  });

  it("rejects the same email used by an alumno and apoderado in the same row", async () => {
    const sql = jest.fn() as any;
    const loader = new ColegioExcelStagingLoader(sql);
    const buffer = await buildWorkbookBuffer([
      [
        "11111111-1",
        "Alumno",
        "Uno",
        "1A",
        "persona@almaia.cl",
        "21111111-1",
        "Apoderado",
        "Uno",
        "persona@almaia.cl",
      ],
    ]);

    await expect(
      loader.load({
        buffer: Buffer.from(buffer),
        originalname: "colegio.xlsx",
      } as Express.Multer.File)
    ).rejects.toMatchObject({
      name: "ValidationError",
      message: "Excel contiene correos duplicados. Corrige el archivo antes de cargar staging.",
    } satisfies Partial<ValidationError>);

    expect(sql).not.toHaveBeenCalled();
  });
});
