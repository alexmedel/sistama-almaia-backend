describe("HTTP error mapping", () => {
  it("maps invalid upload type to 400", async () => {
    const { mapHttpError } = await import("../src/helpers/http-error-response");

    expect(
      mapHttpError(
        new Error(
          'Tipo de archivo no permitido. field=url_audio name=audio type=application/octet-stream'
        )
      )
    ).toEqual({
      status: 400,
      body: {
        message:
          "Tipo de archivo no permitido. field=url_audio name=audio type=application/octet-stream",
      },
    });
  });

  it("maps unknown errors to 500", async () => {
    const { mapHttpError } = await import("../src/helpers/http-error-response");

    expect(mapHttpError(new Error("boom"))).toEqual({
      status: 500,
      body: { message: "Error interno del servidor" },
    });
  });
});
