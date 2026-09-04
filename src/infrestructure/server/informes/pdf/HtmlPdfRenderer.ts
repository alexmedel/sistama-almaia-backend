import { chromium } from "playwright";

export type PdfRenderOptions = {
  format?: "Letter" | "A4";
};

export interface PdfRenderer {
  render(html: string, options?: PdfRenderOptions): Promise<Buffer>;
}

export const HtmlPdfRenderer: PdfRenderer = {
  async render(html: string, options: PdfRenderOptions = {}) {
    const browser = await chromium.launch({
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle" });
      const pdf = await page.pdf({
        format: options.format || "Letter",
        printBackground: true,
        preferCSSPageSize: true,
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  },
};
