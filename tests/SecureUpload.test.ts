import type { Express } from "express";

describe("secure upload whitelist", () => {
  it("accepts common mobile audio formats for SOS", async () => {
    const { isAllowedUpload } = await import("../src/helpers/secure-upload");

    const files = [
      { originalname: "audio.m4a", mimetype: "audio/mp4" },
      { originalname: "audio.caf", mimetype: "audio/x-caf" },
      { originalname: "audio.3gp", mimetype: "audio/3gpp" },
      { originalname: "audio.webm", mimetype: "audio/webm" },
    ] as Express.Multer.File[];

    for (const file of files) {
      expect(isAllowedUpload(file)).toBe(true);
    }
  });

  it("rejects unsupported executable uploads", async () => {
    const { isAllowedUpload } = await import("../src/helpers/secure-upload");

    const file = {
      originalname: "payload.exe",
      mimetype: "application/x-msdownload",
    } as Express.Multer.File;

    expect(isAllowedUpload(file)).toBe(false);
  });

  it("reports rejected file details in error message", async () => {
    const { secureFileFilter } = await import("../src/helpers/secure-upload");

    const callback = jest.fn();
    const file = {
      fieldname: "url_image",
      originalname: "image.bin",
      mimetype: "application/octet-stream",
    } as Express.Multer.File;

    secureFileFilter!({} as any, file, callback);

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          "Tipo de archivo no permitido. field=url_image name=image.bin type=application/octet-stream",
      })
    );
  });

  it("accepts generic octet-stream for audio field", async () => {
    const { secureFileFilter } = await import("../src/helpers/secure-upload");

    const callback = jest.fn();
    const file = {
      fieldname: "url_audio",
      originalname: "audio",
      mimetype: "application/octet-stream",
    } as Express.Multer.File;

    secureFileFilter!({} as any, file, callback);

    expect(callback).toHaveBeenCalledWith(null, true);
  });
});
