import {
  BASE_STYLES,
  DISCLAIMER_TEXT,
  escapeHtml,
  renderBrandLogo,
  renderMultiline,
} from "./templateCommon";

export type NivelInformePdfData = {
  nivel: string;
  periodo: string;
  cuerpo: string;
  recomendaciones: string;
  neurodivergencias?: string;
  logoDataUri?: string;
};

export function renderNivelInformeHtml(data: NivelInformePdfData): string {
  const logo = renderBrandLogo(data.logoDataUri);
  const neurodivergencias = data.neurodivergencias?.trim()
    ? `<section class="alert-section">${renderMultiline(data.neurodivergencias)}</section>`
    : "";

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Informe psicoemocional mensual nivel</title>
  <style>
${BASE_STYLES}
    .general-data {
      margin-bottom: 0.2in;
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="header">${logo}</header>
    <h1>INFORME PSICOEMOCIONAL MENSUAL</h1>
    <h1>${escapeHtml(data.nivel)}</h1>

    <section class="general-data">
      <h2>Datos Generales</h2>
      <p class="field"><span class="label">Nivel:</span> ${escapeHtml(data.nivel)}</p>
      <p class="field"><span class="label">Periodo evaluado:</span> ${escapeHtml(data.periodo)}</p>
    </section>

    <section>
      <h2>Analisis emocional del periodo</h2>
      <div class="analysis">
        ${renderMultiline(data.cuerpo)}
        ${renderMultiline(data.recomendaciones)}
      </div>
      ${neurodivergencias}
    </section>

    <section class="signature">
      <p class="signature-title">Firma Profesional</p>
      <p class="signature-team">Equipo Psicologico AlmaIA</p>
    </section>

    <p class="disclaimer">${DISCLAIMER_TEXT}</p>
  </main>
</body>
</html>`;
}
