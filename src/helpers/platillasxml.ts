import AdmZip from "adm-zip";

/**
 * Extrae los "runs" de texto de un archivo XML de Word.
 * @param xml Contenido XML del archivo.
 * @returns Lista de objetos con información sobre los "runs".
 */
export function extractRunsFromXml(xml: string) {
  const re = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
  const matches: {
    start: number;
    end: number;
    pre: string;
    text: string;
    post: string;
    full: string;
  }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const full = m[0];
    const pre = full.match(/^<w:t[^>]*>/)![0];
    const post = "</w:t>";
    matches.push({
      start: m.index,
      end: m.index + full.length,
      pre,
      text: m[1],
      post,
      full,
    });
  }
  return matches;
}

/**
 * Encuentra todas las etiquetas (tags) en un texto.
 * @param text Texto donde buscar las etiquetas.
 * @returns Lista de etiquetas encontradas.
 */
export function findAllTagsInText(text: string) {
  const tags: string[] = [];
  const re = /\{\{\s*([\s\S]*?)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) tags.push(m[1]);
  return tags;
}

/**
 * Verifica si un nombre de etiqueta es válido.
 * @param name Nombre de la etiqueta.
 * @returns `true` si el nombre es válido, `false` en caso contrario.
 */
export function isValidTagName(name: string) {
  return /^[A-Za-z0-9_]+$/.test(name);
}

/**
 * Corrige un archivo `.docx` para unir "runs" divididos y validar etiquetas.
 * @param inputBuffer Buffer del archivo `.docx`.
 * @returns Buffer corregido del archivo `.docx`.
 */
export async function fixDocxBuffer(inputBuffer: Buffer): Promise<Buffer> {
  const zip = new AdmZip(inputBuffer);
  const entries = zip
    .getEntries()
    .filter(
      (e) => e.entryName.startsWith("word/") && e.entryName.endsWith(".xml")
    );

  for (const entry of entries) {
    const xml = entry.getData().toString("utf8");
    const runs = extractRunsFromXml(xml);
    if (runs.length === 0) continue;

    let out = "";
    let lastIndex = 0;

    // Recorremos runs y unimos secuencias que forman tags incompletos
    let i = 0;
    while (i < runs.length) {
      const run = runs[i];

      // Condition to start collecting: run contains '{' or '}' or we are not sure
      if (run.text.includes("{") || run.text.includes("}")) {
        // start collecting from i until the collected text has balanced occurrences of '{{' and '}}'
        let collected = run.text;
        const collectedStart = run.start;
        let collectedEnd = run.end;
        let j = i + 1;
        // counts
        const countOpen = (s: string) => (s.match(/\{\{/g) || []).length;
        const countClose = (s: string) => (s.match(/\}\}/g) || []).length;

        // If already balanced (rare), we process normally, else extend
        while (
          countOpen(collected) !== countClose(collected) &&
          j < runs.length
        ) {
          collected += runs[j].text;
          collectedEnd = runs[j].end;
          j++;
        }

        // If after collecting we have at least one balanced tag, we will merge runs i..(j-1)
        if (
          countOpen(collected) === countClose(collected) &&
          countOpen(collected) > 0
        ) {
          // copiar desde lastIndex hasta start de run i
          out += xml.slice(lastIndex, runs[i].start);

          // Construir nuevo run: usar pre de first run y post del último run de la secuencia
          const newRunText = runs
            .slice(i, j)
            .map((r) => r.text)
            .join("");
          const newRun = `${runs[i].pre}${newRunText}${runs[j - 1].post}`;
          out += newRun;
          lastIndex = collectedEnd;
          i = j; // saltamos los runs ya combinados
          continue;
        } else {
          // no se ha podido balancear: simplemente copiar el run tal cual
          out += xml.slice(lastIndex, run.end);
          lastIndex = run.end;
          i++;
          continue;
        }
      } else {
        // run normal: copiar hasta el final del run
        out += xml.slice(lastIndex, run.end);
        lastIndex = run.end;
        i++;
      }
    }

    out += xml.slice(lastIndex); // resto del archivo

    // validar nombres de tags en el archivo corregido
    const allTags = findAllTagsInText(out);
    const invalidTags: { entry: string; tag: string }[] = [];
    for (const tag of allTags) {
      const clean = tag.trim();
      if (!isValidTagName(clean))
        invalidTags.push({ entry: entry.entryName, tag: clean });
    }
    if (invalidTags.length > 0) {
      const msg = invalidTags.map((t) => `${t.entry} -> '${t.tag}'`).join("\n");
      throw new Error(
        `Se encontraron tags con caracteres inválidos en ${entry.entryName}:\n${msg}\nUsa sólo letras ASCII, números y guion bajo (_).`
      );
    }

    // reemplazar solo si hay diferencias
    if (out !== xml) {
      zip.updateFile(entry.entryName, Buffer.from(out, "utf8"));
    } else {
      // Si no hubo cambios, validar tags igualmente (para detectar acentos)
      const allTagsOrig = findAllTagsInText(xml);
      for (const tag of allTagsOrig) {
        if (!isValidTagName(tag.trim())) {
          throw new Error(
            `Tag inválido en ${entry.entryName}: "{{${tag}}}". Usa sólo [A-Za-z0-9_].`
          );
        }
      }
    }
  }

  return zip.toBuffer();
}