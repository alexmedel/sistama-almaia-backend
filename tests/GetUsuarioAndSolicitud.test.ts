const mockAdminSingle = jest.fn();
const mockSolicitudSingle = jest.fn();
const mockUpdateUserById = jest.fn();

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table: string) => {
      if (table === "view_auth_users") {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: mockAdminSingle,
            })),
          })),
        };
      }

      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: mockSolicitudSingle,
            })),
          })),
        })),
      };
    }),
  })),
}));

jest.mock("../src/helpers/supabase-client", () => ({
  client: {
    auth: {
      admin: {
        updateUserById: mockUpdateUserById,
      },
    },
  },
}));

describe("getUsuarioAndSolicitud", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminSingle.mockResolvedValue({
      data: { id: "auth-user-id" },
      error: null,
    });
    mockUpdateUserById.mockResolvedValue({ error: null });
  });

  it("rejects expired password reset codes before changing the password", async () => {
    const { getUsuarioAndSolicitud } = await import(
      "../src/infrestructure/server/auth/funciones/AuthServicesFuntion.ts/getUsuarioAndSolicitud"
    );
    mockSolicitudSingle.mockResolvedValue({
      data: {
        authorization_pass: "123456",
        used_pass: false,
        created_at: new Date(Date.now() - 16 * 60 * 1000).toISOString(),
      },
      error: null,
    });

    const result = await getUsuarioAndSolicitud(
      "user@example.com",
      "123456",
      "NewPassword!2026"
    );

    expect(result).toBeNull();
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });
});
