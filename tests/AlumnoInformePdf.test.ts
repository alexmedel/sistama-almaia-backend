import { AlumnoInformePdfService } from "../src/infrestructure/server/informes/AlumnoInformePdfService";
import { mapearDetalleAlumnoPdf } from "../src/infrestructure/server/informes/AlumnoInformePdfService";
import { renderAlumnoInformeHtml } from "../src/infrestructure/server/informes/pdf/templates/alumnoInformeHtml";

describe("AlumnoInformePdf", () => {
  test("renderAlumnoInformeHtml escapes dynamic text and keeps report sections", () => {
    const html = renderAlumnoInformeHtml({
      alumno: "<script>alert(1)</script>",
      curso: "4A",
      periodo: "Mayo 2026",
      analisis_diagnostico: "Diagnostico <b>privado</b>",
      analisis_recomendaciones: "Recomendacion",
      patologia: "Patologia",
      logoDataUri: "data:image/jpeg;base64,abc",
    });

    expect(html).toContain("INFORME PSICOEMOCIONAL MENSUAL");
    expect(html).toContain("Datos del estudiante");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("Diagnostico &lt;b&gt;privado&lt;/b&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  test("renderAlumnoInformeHtml renders markdown bold markers as strong text", () => {
    const html = renderAlumnoInformeHtml({
      alumno: "Ana",
      curso: "4A",
      periodo: "Mayo 2026",
      analisis_diagnostico: "**Consejo:** usar rutina",
      analisis_recomendaciones: "- **Cierre:** conversar",
    });

    expect(html).toContain("<strong>Consejo:</strong> usar rutina");
    expect(html).toContain("- <strong>Cierre:</strong> conversar");
    expect(html).not.toContain("**Consejo:**");
  });

  test("AlumnoInformePdfService builds a PDF response from report data", async () => {
    const pdfBuffer = Buffer.from("pdf");
    const renderer = {
      render: jest.fn().mockResolvedValue(pdfBuffer),
    };
    const dataSource = {
      obtenerDetalleParaPdf: jest.fn().mockResolvedValue({
        alumno_informe_id: 42,
        alumno: "Ana Torres",
        curso: "4A",
        periodo: "Mayo 2026",
        analisis_diagnostico: "Buen periodo.",
        analisis_recomendaciones: "Mantener rutina.",
        patologia: "",
      }),
      obtenerLogoAlumnoDataUri: jest
        .fn()
        .mockResolvedValue("data:image/jpeg;base64,logo"),
    };

    const response = await AlumnoInformePdfService.generarPdfAlumno(42, {
      dataSource,
      renderer,
    });

    expect(response.pdfBuffer).toBe(pdfBuffer);
    expect(response.filename).toBe("informe_alumno_42.pdf");
    expect(renderer.render).toHaveBeenCalledWith(
      expect.stringContaining("Ana Torres"),
      expect.objectContaining({ format: "Letter" })
    );
  });

  test("AlumnoInformePdfService still renders when optional logo cannot be loaded", async () => {
    const renderer = {
      render: jest.fn().mockResolvedValue(Buffer.from("pdf")),
    };
    const dataSource = {
      obtenerDetalleParaPdf: jest.fn().mockResolvedValue({
        alumno_informe_id: 7,
        alumno: "Ana Torres",
        curso: "4A",
        periodo: "Mayo 2026",
        analisis_diagnostico: "Buen periodo.",
        analisis_recomendaciones: "Mantener rutina.",
        patologia: "",
      }),
      obtenerLogoAlumnoDataUri: jest.fn().mockRejectedValue(new Error("logo")),
    };

    const response = await AlumnoInformePdfService.generarPdfAlumno(7, {
      dataSource,
      renderer,
    });

    expect(response.filename).toBe("informe_alumno_7.pdf");
    expect(renderer.render).toHaveBeenCalledWith(
      expect.stringContaining("brand-text"),
      expect.any(Object)
    );
  });

  test("AlumnoInformePdfService uses no-data template when template_informe indicates missing period info", async () => {
    const renderer = {
      render: jest.fn().mockResolvedValue(Buffer.from("pdf")),
    };
    const dataSource = {
      obtenerDetalleParaPdf: jest.fn().mockResolvedValue({
        alumno_informe_id: 8,
        alumno: "Ana Torres",
        curso: "4A",
        periodo: "Mayo 2026",
        analisis_diagnostico: "",
        analisis_recomendaciones: "",
        patologia: "",
        template_informe:
          "No existe suficiente informaciÃ³n del periodo para generar el informe.",
        alerta_emociones: true,
        alerta_patologica: false,
        alerta_neurodivergencia: true,
      }),
      obtenerLogoAlumnoDataUri: jest.fn().mockResolvedValue(undefined),
    };

    await AlumnoInformePdfService.generarPdfAlumno(8, {
      dataSource,
      renderer,
    });

    expect(renderer.render).toHaveBeenCalledWith(
      expect.stringContaining("no se cuenta con informacion suficiente"),
      expect.any(Object)
    );
  });

  test("mapearDetalleAlumnoPdf uses the same flattened fields produced by the cron RPC", () => {
    const detalle = mapearDetalleAlumnoPdf({
      alumno_informe_id: 99,
      nombres: "Martina",
      apellidos: "Rojas",
      nombre_curso: "5B",
      periodo: "mayo 2026",
      descripcion_informe: "Diagnostico desde RPC",
      recomendacion_almaia: "Recomendacion desde RPC",
      alerta_neurodivergencia: true,
    });

    expect(detalle).toMatchObject({
      alumno_informe_id: 99,
      alumno: "Martina Rojas",
      curso: "5B",
      periodo: "mayo 2026",
      analisis_diagnostico: "Diagnostico desde RPC",
      analisis_recomendaciones: "Recomendacion desde RPC",
      patologia: "Se observan señales que pueden orientar a una Neurodivergencia",
      alerta_neurodivergencia: true,
    });
  });

  test("Supabase data source calls the on-demand PDF RPC by report id", async () => {
    jest.resetModules();
    const rpc = jest.fn().mockResolvedValue({
      data: [
        {
          alumno_informe_id: 55,
          nombres: "Martina",
          apellidos: "Rojas",
          nombre_curso: "5B",
          periodo: "Mayo 2026",
          descripcion_informe: "Diagnostico",
          recomendacion_almaia: "Recomendacion",
          alerta_neurodivergencia: false,
        },
      ],
      error: null,
    });

    jest.doMock("../src/core/services/supabaseClient", () => ({
      SupabaseClientService: jest.fn().mockImplementation(() => ({
        getClient: () => ({ rpc }),
      })),
    }));

    const { AlumnoInformePdfDataSourceSupabase } = await import(
      "../src/infrestructure/server/informes/AlumnoInformePdfService"
    );

    const detalle =
      await AlumnoInformePdfDataSourceSupabase.obtenerDetalleParaPdf(55);

    expect(rpc).toHaveBeenCalledWith("consultar_informe_alumno_pdf", {
      p_alumno_informe_id: 55,
    });
    expect(detalle.alumno).toBe("Martina Rojas");
  });
});

