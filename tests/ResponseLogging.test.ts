import { Response } from "express";

describe("FormatResponse logging", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("does not log full response payloads", async () => {
    const { FormatResponse } = await import("../src/helpers/Response");
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    const payload = {
      message: "ok",
      data: {
        alumno: {
          nombre: "Jonathan Alumno",
          email: "jonathanalumno@almaia.cl",
        },
      },
    };

    FormatResponse(res, 200, payload);

    expect(console.log).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(payload);
  });
});
