import PizZip = require("pizzip");

/**
 * Convierte marcadores **texto** en formato negrita OpenXML dentro del DOCX renderizado.
 * Procesa los archivos XML dentro del ZIP del documento Word.
 */
export function aplicarFormatoEnriquecidoDocx(zip: PizZip): void {
  const entries = Object.keys(zip.files).filter(
    (name) => name.startsWith("word/") && name.endsWith(".xml")
  );

  for (const entryName of entries) {
    const file = zip.files[entryName];
    if (file.dir) continue;

    let xml = file.asText();
    
    // 1. Evitar que el texto "justificado" se estire feo al final de los saltos de línea (<w:br/>)
    // El tabulador absorbe el espacio extra.
    xml = xml.replace(/<w:br\/>/g, '<w:tab/><w:br/>');

    // 2. Procesar los marcadores **negrita**
    const processed = aplicarFormatoNegrita(xml);

    if (processed !== xml) {
      zip.file(entryName, processed);
    }
  }
}

/**
 * Busca runs (<w:r>) cuyo texto contiene marcadores **texto** y los divide
 * en múltiples runs: normales y con formato negrita (<w:b/>).
 * Preserva las propiedades de formato originales del run.
 */
export function aplicarFormatoNegrita(xml: string): string {
  const runRegex = /<w:r\b(?:[^>]*)>([\s\S]*?)<\/w:r>/g;

  return xml.replace(runRegex, (fullMatch, runContent: string) => {
    // Solo procesar runs que tengan <w:t> con marcadores **
    const textRegex = /<w:t([^>]*)>([\s\S]*?)<\/w:t>/;
    const textMatch = runContent.match(textRegex);

    if (!textMatch || !textMatch[2].includes("**")) {
      return fullMatch;
    }

    const text = textMatch[2];

    // Extraer propiedades del run existentes
    const rPrRegex = /<w:rPr>([\s\S]*?)<\/w:rPr>/;
    const rPrMatch = runContent.match(rPrRegex);
    const rPrContent = rPrMatch ? rPrMatch[1] : "";

    // Dividir por marcadores **negrita**
    // "texto **negrita** más" → ["texto ", "negrita", " más"]
    const segments = text.split(/\*\*([\s\S]*?)\*\*/);

    let result = "";
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (segment === "") continue;

      const isBold = i % 2 === 1;

      if (isBold) {
        // Agregar <w:b/> solo si no existe ya
        const needsBold =
          !rPrContent.includes("<w:b/>") && !rPrContent.includes("<w:b ");
        const boldTags = needsBold ? "<w:b/><w:bCs/>" : "";
        // Insertamos los tags de negrita al principio del rPr para respetar el orden del esquema XML (necesario en Mac)
        const boldRPr = `<w:rPr>${boldTags}${rPrContent}</w:rPr>`;
        result += `<w:r>${boldRPr}<w:t xml:space="preserve">${segment}</w:t></w:r>`;
      } else {
        const normalRPr = rPrContent
          ? `<w:rPr>${rPrContent}</w:rPr>`
          : "";
        result += `<w:r>${normalRPr}<w:t xml:space="preserve">${segment}</w:t></w:r>`;
      }
    }

    return result;
  });
}
