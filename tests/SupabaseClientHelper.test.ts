const mockCreateClient = jest.fn();

jest.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
}));

describe("supabase client helper", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.SUPABASE_HOST = "https://example.supabase.co";
    process.env.SUPABASE_PASSWORD = "anon-key";
    process.env.SUPABASE_PASSWORD_ADMIN = "service-key";
  });

  it("uses the anon key instead of the service role key", async () => {
    mockCreateClient.mockReturnValue({});

    await import("../src/helpers/supabase-client");

    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key"
    );
    expect(mockCreateClient).not.toHaveBeenCalledWith(
      "https://example.supabase.co",
      "service-key"
    );
  });
});

describe("SupabaseClientService", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.SUPABASE_HOST = "https://example.supabase.co";
    process.env.SUPABASE_PASSWORD = "anon-key";
    process.env.SUPABASE_PASSWORD_ADMIN = "service-key";
  });

  it("uses the anon key instead of the service role key", async () => {
    mockCreateClient.mockReturnValue({});

    const { SupabaseClientService } = await import(
      "../src/core/services/supabaseClient"
    );

    new SupabaseClientService();

    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key",
      expect.any(Object)
    );
    expect(mockCreateClient).not.toHaveBeenCalledWith(
      "https://example.supabase.co",
      "service-key",
      expect.any(Object)
    );
  });
});
