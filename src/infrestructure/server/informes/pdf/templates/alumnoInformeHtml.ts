export type AlumnoInformePdfData = {
  alumno: string;
  curso: string;
  periodo: string;
  analisis_diagnostico: string;
  analisis_recomendaciones: string;
  patologia?: string;
  logoDataUri?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInlineFormatting(value: string): string {
  const escaped = escapeHtml(value);
  return escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function renderMultiline(value: string): string {
  return (value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${renderInlineFormatting(line)}</p>`)
    .join("");
}

export function renderAlumnoInformeHtml(data: AlumnoInformePdfData): string {
  const patologia = data.patologia?.trim()
    ? `<section class="alert-section">${renderMultiline(data.patologia)}</section>`
    : "";

  const logo = data.logoDataUri
    ? `<img class="brand-logo" src="${escapeHtml(data.logoDataUri)}" alt="AlmaIA" />`
    : `<div class="brand-text">Alma<span>IA</span></div>`;

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Informe psicoemocional mensual</title>
  <style>
    @page {
      size: Letter;
      margin: 1in 1.25in;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      color: #000;
      font-family: Calibri, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.28;
      background: #fff;
    }

    .page {
      position: relative;
      min-height: 9in;
    }

    .header {
      height: 0.55in;
      display: flex;
      align-items: flex-start;
      margin-bottom: 0.18in;
    }

    .brand-logo {
      width: 1.2in;
      height: auto;
      display: block;
    }

    .brand-text {
      font-size: 24pt;
      font-weight: 700;
      color: #8c8c8c;
      font-style: italic;
    }

    .brand-text span {
      color: #55a4ee;
      font-style: normal;
    }

    h1 {
      margin: 0 0 0.26in;
      text-align: center;
      font-size: 14pt;
      line-height: 1.15;
      font-weight: 700;
      color: #000;
    }

    h2 {
      margin: 0.16in 0 0.08in;
      color: #4f81bd;
      font-size: 13pt;
      line-height: 1.2;
      font-weight: 700;
      page-break-after: avoid;
    }

    .student-data {
      margin-bottom: 0.2in;
    }

    .field {
      margin: 0 0 0.08in;
    }

    .label {
      font-weight: 400;
    }

    .analysis {
      text-align: justify;
      font-family: Cambria, Georgia, serif;
    }

    .analysis p,
    .alert-section p {
      margin: 0 0 0.14in;
    }

    .alert-section {
      margin-top: 0.14in;
      font-family: Calibri, Arial, sans-serif;
    }

    .signature {
      margin-top: 0.32in;
    }

    .signature-title {
      margin: 0 0 0.06in;
    }

    .signature-team {
      margin: 0;
      font-weight: 700;
    }

    .disclaimer {
      margin-top: 0.36in;
      font-weight: 700;
      text-align: left;
    }

  </style>
</head>
<body>
  <main class="page">
    <header class="header">${logo}</header>
    <div class="content">
      <h1>INFORME PSICOEMOCIONAL MENSUAL</h1>

      <section class="student-data">
        <h2>Datos del estudiante</h2>
        <p class="field"><span class="label">Nombre del Estudiante:</span> ${escapeHtml(data.alumno)}</p>
        <p class="field"><span class="label">Curso:</span> ${escapeHtml(data.curso)}</p>
        <p class="field"><span class="label">Periodo evaluado:</span> ${escapeHtml(data.periodo)}</p>
      </section>

      <section>
        <h2>Análisis emocional del periodo</h2>
        <div class="analysis">
          ${renderMultiline(data.analisis_diagnostico)}
          ${renderMultiline(data.analisis_recomendaciones)}
        </div>
        ${patologia}
      </section>

      <section class="signature">
        <p class="signature-title">Firma Profesional</p>
        <p class="signature-team">Equipo Psicológico AlmaIA</p>
      </section>

      <p class="disclaimer">Importante : Este informe no constituye un diagnóstico clínico ni una ficha médica. Es un reporte psicoemocional mensual con fines educativos. En caso de requerir atención especializada, el colegio se pondrá en contacto con usted.</p>
    </div>
  </main>
</body>
</html>`;
}
