import {
  BASE_STYLES,
  DISCLAIMER_TEXT,
  escapeHtml,
  renderBrandLogo,
} from "./templateCommon";

export type AlumnoNoDataInformePdfData = {
  nombre: string;
  curso: string;
  periodo: string;
  notas_emociones: string;
  notas_patologias: string;
  notas_neurodivergencia: string;
  logoDataUri?: string;
};

export function renderAlumnoNoDataInformeHtml(
  data: AlumnoNoDataInformePdfData
): string {
  const logo = renderBrandLogo(data.logoDataUri);

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Informe psicoemocional mensual</title>
  <style>
${BASE_STYLES}
    .student-data {
      margin-bottom: 0.2in;
    }

    .notes {
      margin-top: 0.12in;
    }

    .notes p {
      margin: 0 0 0.08in;
    }

    .notes ul {
      margin: 0.02in 0 0.14in 0.26in;
      padding: 0;
    }

    .notes li {
      margin: 0 0 0.05in;
    }

    .tips {
      margin-top: 0.1in;
    }

    .tips p {
      margin: 0 0 0.09in;
      text-align: justify;
    }

    .tips ol {
      margin: 0.02in 0 0.16in 0.26in;
      padding: 0;
    }

    .tips li {
      margin: 0 0 0.08in;
      padding-left: 0.04in;
      text-align: justify;
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="header">${logo}</header>
    <h1>INFORME PSICOEMOCIONAL MENSUAL</h1>

    <section class="student-data">
      <h2>Datos del estudiante</h2>
      <p class="field"><span class="label">Nombre del Estudiante:</span> ${escapeHtml(data.nombre)}</p>
      <p class="field"><span class="label">Curso:</span> ${escapeHtml(data.curso)}</p>
      <p class="field"><span class="label">Periodo evaluado:</span> ${escapeHtml(data.periodo)}</p>
    </section>

    <section>
      <h2>Análisis emocional del periodo</h2>
      <div class="analysis">
        <p>En el periodo evaluado no se cuenta con información suficiente para elaborar un informe completo.</p>
      </div>
    </section>

    <section class="notes">
      <p><strong>Notas:</strong></p>
      <ul>
        <li><strong>Emociones:</strong> ${escapeHtml(data.notas_emociones)}</li>
        <li><strong>Patologías:</strong> ${escapeHtml(data.notas_patologias)}</li>
        <li><strong>Neurodivergencia:</strong> ${escapeHtml(data.notas_neurodivergencia)}</li>
      </ul>
    </section>

    <section class="tips">
      <p><strong>Para obtener un análisis más preciso y apoyar mejor a su hijo(a), le recomendamos:</strong></p>
      <ol>
        <li><strong>Motivar la participación diaria:</strong> Invite a su hijo(a) a registrar cómo se siente al iniciar la jornada escolar.</li>
        <li><strong>Incorporarlo como rutina:</strong> Puede integrarse en la mañana antes de clases, igual que lavarse los dientes o preparar la mochila.</li>
        <li><strong>Conversar sobre emociones:</strong> Use la app como una excusa para hablar en familia sobre cómo se sienten y normalizar la expresión emocional.</li>
        <li><strong>Acompañamiento inicial:</strong> Al inicio, acompáñelo(a) en el registro para generar confianza en el uso de la aplicación.</li>
        <li><strong>Revisar juntos el impacto:</strong> Muéstrele que sus registros ayudan a que el colegio y la familia lo apoyen mejor.</li>
      </ol>
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
