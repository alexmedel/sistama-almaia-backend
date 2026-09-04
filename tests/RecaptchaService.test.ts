describe("RecaptchaService", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it("uses only the server-side RECAPTCHA_SECRET when verifying tokens", async () => {
    process.env.RECAPTCHA_SECRET = "server-secret";
    process.env.NEXT_PUBLIC_RECAPTCHA_SECRET = "public-secret";

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, score: 0.9, action: "login" }),
    });

    const { RecaptchaService } = await import(
      "../src/infrestructure/server/auth/RecaptchaService"
    );

    await expect(
      RecaptchaService.verifyToken("captcha-token", "127.0.0.1")
    ).resolves.toEqual({ success: true, score: 0.9, action: "login" });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://www.google.com/recaptcha/api/siteverify",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
    );

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const body = options.body as URLSearchParams;
    expect(body.get("secret")).toBe("server-secret");
    expect(body.get("secret")).not.toBe("public-secret");
    expect(body.get("response")).toBe("captcha-token");
    expect(body.get("remoteip")).toBe("127.0.0.1");
  });

  it("fails closed when RECAPTCHA_SECRET is missing", async () => {
    delete process.env.RECAPTCHA_SECRET;
    process.env.NEXT_PUBLIC_RECAPTCHA_SECRET = "public-secret";

    const { RecaptchaService } = await import(
      "../src/infrestructure/server/auth/RecaptchaService"
    );

    await expect(RecaptchaService.verifyToken("captcha-token")).resolves.toEqual({
      success: false,
      "error-codes": ["missing-secret"],
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
