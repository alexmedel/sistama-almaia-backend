import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { fixDocxBuffer } from "../../../../helpers/platillasxml";
import { aplicarFormatoEnriquecidoDocx } from "../../../../helpers/formatoEnriquecido";

export const PlantillaServicio = {
  async procesarPlantilla(templateBuffer: Buffer, datos: Record<string, any>): Promise<Buffer> {
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render(datos);

    const outputZip = doc.getZip();
    aplicarFormatoEnriquecidoDocx(outputZip);

    return outputZip.generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });
  },

  async corregirPlantilla(templateBuffer: Buffer): Promise<Buffer> {
    return await fixDocxBuffer(templateBuffer);
  },
};