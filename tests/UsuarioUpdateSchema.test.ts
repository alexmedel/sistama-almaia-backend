import { UsuarioUpdateSchema } from "../src/infrestructure/server/alumno/shema/UsuarioUpdateSchema";

describe("UsuarioUpdateSchema", () => {
  it("accepts empty nombre_social when updating profile", () => {
    const { error } = UsuarioUpdateSchema.validate({ nombre_social: "" });

    expect(error).toBeUndefined();
  });

  it("accepts null nombre_social when updating profile", () => {
    const { error } = UsuarioUpdateSchema.validate({ nombre_social: null });

    expect(error).toBeUndefined();
  });

  it("accepts empty url_foto_perfil when removing profile photo", () => {
    const { error } = UsuarioUpdateSchema.validate({ url_foto_perfil: "" });

    expect(error).toBeUndefined();
  });

  it("accepts null url_foto_perfil when removing profile photo", () => {
    const { error } = UsuarioUpdateSchema.validate({ url_foto_perfil: null });

    expect(error).toBeUndefined();
  });

  it("rejects nombre_social longer than 50 characters", () => {
    const { error } = UsuarioUpdateSchema.validate({
      nombre_social: "a".repeat(51),
    });

    expect(error?.details[0].message).toContain(
      '"nombre_social" length must be less than or equal to 50 characters long'
    );
  });
});
