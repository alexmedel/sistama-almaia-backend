import {
  BASE_STYLES,
  DISCLAIMER_TEXT,
  escapeHtml,
  renderBrandLogo,
  renderMultiline,
} from "./templateCommon";

export type ColegioInformePdfData = {
  colegio: string;
  periodo: string;
  cuerpo: string;
  recomendaciones: string;
  neurodivergencia?: string;
  logoDataUri?: string;
};

export function renderColegioInformeHtml(data: ColegioInformePdfData): string {
  const logo = renderBrandLogo(data.logoDataUri);
  const neurodivergencia = data.neurodivergencia?.trim()
    ? `<section class="alert-section">${renderMultiline(data.neurodivergencia)}</section>`
    : "";

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Informe psicoemocional mensual colegio</title>
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
    <h1>INFORME PSICOEMOCIONAL MENSUAL COLEGIO</h1>

    <section class="general-data">
      <h2>Datos Generales</h2>
      <p class="field"><span class="label">Nivel:</span> ${escapeHtml(data.colegio)}</p>
      <p class="field"><span class="label">Periodo evaluado:</span> ${escapeHtml(data.periodo)}</p>
    </section>

    <section>
      <h2>Panorama General</h2>
      <div class="analysis">
        ${renderMultiline(data.cuerpo)}
        ${renderMultiline(data.recomendaciones)}
      </div>
      ${neurodivergencia}
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
