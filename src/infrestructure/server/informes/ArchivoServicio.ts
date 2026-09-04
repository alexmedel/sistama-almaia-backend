
import fs from "fs";
import path from "path";
const topdf = require("docx2pdf-converter");
// import { exec } from "child_process";
// import fs from "fs";
// import path from "path";


export const ArchivoServicio = {

    async convertirDocxAPdf(docxBuffer: Buffer): Promise<Buffer> {
    const tempDocxPath = path.join(__dirname, `temp_${Date.now()}.docx`);
    const tempPdfPath = tempDocxPath.replace(/\.docx$/, ".pdf");

    try {
      // Escribir el archivo .docx temporalmente
      fs.writeFileSync(tempDocxPath, docxBuffer);

      // Convertir el archivo .docx a PDF
      await topdf.convert(tempDocxPath, tempPdfPath);

      // Leer el archivo PDF generado
      const pdfBuffer = fs.readFileSync(tempPdfPath);

      // Eliminar archivos temporales
      fs.unlinkSync(tempDocxPath);
      fs.unlinkSync(tempPdfPath);

      return pdfBuffer;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al convertir .docx a PDF: ${error.message}`);
      } else {
        throw new Error("Error al convertir .docx a PDF: Error desconocido");
      }
    }
  },

    // uso libre office para que funcione deberia tener la herramienta instala en mi computadora
//   async convertirDocxAPdf(docxBuffer: Buffer): Promise<Buffer> {
//     const tempDocxPath = path.join(__dirname, `temp_${Date.now()}.docx`);
//     const tempPdfPath = tempDocxPath.replace(/\.docx$/, ".pdf");

//     fs.writeFileSync(tempDocxPath, docxBuffer);

//     return new Promise((resolve, reject) => {
//       exec(`soffice --headless --convert-to pdf --outdir ${path.dirname(tempDocxPath)} ${tempDocxPath}`, (error) => {
//         if (error) {
//           reject(new Error(`Error al convertir .docx a PDF: ${error.message}`));
//           return;
//         }

//         try {
//           const pdfBuffer = fs.readFileSync(tempPdfPath);
//           fs.unlinkSync(tempDocxPath);
//           fs.unlinkSync(tempPdfPath);
//           resolve(pdfBuffer);
//         } catch (readError) {
//           reject(new Error(`Error al leer el archivo PDF generado: ${readError instanceof Error ? readError.message : 'Error desconocido'}`));
//         }
//       });
//     });
//   },
};