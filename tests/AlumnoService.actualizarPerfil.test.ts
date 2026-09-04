 
const mockFrom = jest.fn();

jest.mock("@supabase/supabase-js", () => ({
  AuthApiError: class AuthApiError extends Error {},
  createClient: jest.fn().mockReturnValue({
    from: mockFrom,
  }),
}));

jest.mock("chalk", () => ({
  green: { bold: jest.fn((value) => value) },
  yellow: { bold: jest.fn((value) => value) },
  red: { bold: jest.fn((value) => value) },
}));

import { Request, Response } from "express";
import { AlumnosService } from "../src/infrestructure/server/alumno/AlumnoService";

describe("AlumnosService.actualizarPerfil", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {
        nombre_social: "a".repeat(51),
      },
      user: {
        usuario_id: 1,
        auth_id: "auth-id",
      },
      actualizado_por: 1,
    } as any;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("returns 400 when profile update validation fails", async () => {
    await AlumnosService.actualizarPerfil(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error:
        '"nombre_social" length must be less than or equal to 50 characters long',
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
