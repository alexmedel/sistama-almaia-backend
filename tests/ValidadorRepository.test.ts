const maybeSingle = jest.fn();
const eq = jest.fn(() => ({ maybeSingle }));
const select = jest.fn(() => ({ eq }));
const from = jest.fn(() => ({ select }));

jest.mock("../src/core/services/supabaseAdmin", () => ({
  SupabaseAdminService: jest.fn().mockImplementation(() => ({
    getClient: () => ({ from }),
  })),
}));

describe("ValidadorRepository", () => {
  beforeEach(() => {
    from.mockClear();
    select.mockClear();
    eq.mockClear();
    maybeSingle.mockReset();
  });

  it("uses the admin client for alumno validation so RLS does not hide the logged-in user", async () => {
    maybeSingle.mockResolvedValue({
      data: { alumno_id: 1741, persona_id: 900033 },
      error: null,
    });

    const { default: ValidadorRepository } = await import(
      "../src/repos/rol_validador/validadorRepository"
    );

    const result = await new ValidadorRepository().alumno(900033);

    expect(from).toHaveBeenCalledWith("alumnos");
    expect(select).toHaveBeenCalledWith(
      "alumno_id,persona_id,colegio_id,email,url_foto_perfil,activo,perfil_completado,is_blocked"
    );
    expect(eq).toHaveBeenCalledWith("persona_id", 900033);
    expect(result).toEqual({ alumno_id: 1741, persona_id: 900033 });
  });

  it("returns null instead of throwing when the validator row does not exist", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });

    const { default: ValidadorRepository } = await import(
      "../src/repos/rol_validador/validadorRepository"
    );

    await expect(new ValidadorRepository().alumno(123)).resolves.toBeNull();
  });
});
