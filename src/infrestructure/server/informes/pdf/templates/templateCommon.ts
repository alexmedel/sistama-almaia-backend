export type LogoData = {
  logoDataUri?: string;
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderInlineFormatting(value: string): string {
  const escaped = escapeHtml(value);
  return escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

export function renderMultiline(value: string): string {
  return (value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${renderInlineFormatting(line)}</p>`)
    .join("");
}

export function renderBrandLogo(logoDataUri?: string): string {
  return logoDataUri
    ? `<img class="brand-logo" src="${escapeHtml(logoDataUri)}" alt="AlmaIA" />`
    : `<div class="brand-text">Alma<span>IA</span></div>`;
}

export const BASE_STYLES = `
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
      font-family: Arial, Calibri, sans-serif;
      font-size: 11pt;
      line-height: 1.22;
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

    .field {
      margin: 0 0 0.08in;
    }

    .label {
      font-weight: 700;
    }

    .analysis {
      text-align: justify;
      font-family: Arial, Calibri, sans-serif;
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
      margin-top: 0.48in;
      page-break-inside: avoid;
    }

    .signature-title {
      margin: 0 0 0.06in;
    }

    .signature-team {
      margin: 0;
      font-weight: 700;
    }

    .disclaimer {
      margin-top: 0.24in;
      font-weight: 700;
      text-align: left;
    }
`;

export const DISCLAIMER_TEXT =
  "Importante : Este informe no constituye un diagnostico clinico ni una ficha medica. Es un reporte psicoemocional mensual con fines educativos. En caso de requerir atencion especializada, el colegio se pondra en contacto con usted.";
