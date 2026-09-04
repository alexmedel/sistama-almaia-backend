 
// Mocked Supabase client functions
const mockSingle = jest.fn();
const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockInsert = jest.fn().mockReturnThis();
const mockFrom = jest.fn().mockReturnValue({
  select: mockSelect,
  insert: mockInsert,
});

const mockSignUp = jest.fn();
const mockAuth = {
  signUp: mockSignUp,
};

jest.mock('@supabase/supabase-js', () => {
  const actual = jest.requireActual('@supabase/supabase-js');
  return {
    ...actual,
    createClient: jest.fn().mockReturnValue({
      from: mockFrom,
      auth: mockAuth,
    }),
  };
});

import { UsuariosService } from '../src/infrestructure/server/auth/UsuarioService';
import { Request, Response } from 'express';

describe('UsuarioService Guardar Tests', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {
        nombre_social: 'Test User',
        email: 'soporte@almaia.cl',
        encripted_password: 'TestPassword!2026',
        rol_id: 1,
        telefono_contacto: '123456789',
        url_foto_perfil: 'http://example.com/profile.jpg',
        persona_id: 1,
        idioma_id: 1,
      },
      supabase: {
        from: mockFrom,
        auth: mockAuth,
      },
      creado_por: 1,
      actualizado_por: 1,
    } as any;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Reset mocks to a default successful state before each test
    mockSignUp.mockResolvedValue({
      data: { user: { id: 'some-uuid' } },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: { id: 1 }, error: null });
    // Mock the insert call from DataService
    mockInsert.mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [req.body], error: null }),
    });
  });

  it('should create a user successfully', async () => {
    // Arrange
    // Mocks are set in beforeEach

    // Act
    await UsuariosService.guardar(req as Request, res as Response);

    // Assert
    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'soporte@almaia.cl',
      password: 'TestPassword!2026',
    });
    expect(mockFrom).toHaveBeenCalledWith('roles');
    expect(mockFrom).toHaveBeenCalledWith('personas');
    expect(mockFrom).toHaveBeenCalledWith('idiomas');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'soporte@almaia.cl' })
    );
  });

  it('should return 400 if Supabase auth sign up fails', async () => {
    // Arrange
    mockSignUp.mockResolvedValue({ data: null, error: { message: 'Auth error' } });

    // Act
    await UsuariosService.guardar(req as Request, res as Response);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Auth error' });
  });

  it('should return 500 if validation fails', async () => {
    // Arrange
    delete (req.body as any).email; // Make validation fail

    // Act
    await UsuariosService.guardar(req as Request, res as Response);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.any(Object)); // Expecting an error object
    expect((res.json as any).mock.calls[0][0].errorInfo.message).toContain('email'); // Check for validation error message
  });

  it('should return 500 if rol_id does not exist', async () => {
    // Arrange
    // Make only the 'roles' check fail
    mockFrom.mockImplementationOnce((tableName: string) => {
      expect(tableName).toBe('roles');
      return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) };
    })

    // Act
    await UsuariosService.guardar(req as Request, res as Response);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errorInfo: expect.objectContaining({ message: 'El rol no existe' }) }));
  });

  it('should return 500 if persona_id does not exist', async () => {
    // Arrange
    // Chain mock implementations to control the flow
    mockFrom
      .mockImplementationOnce(() => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: 1 }, error: null }) }) }) })) // roles check
      .mockImplementationOnce((tableName: string) => { // personas check
        expect(tableName).toBe('personas');
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) };
      });

    // Act
    await UsuariosService.guardar(req as Request, res as Response);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errorInfo: expect.objectContaining({ message: 'La persona no existe' }) }));
  });

  it('should return 500 if idioma_id does not exist', async () => {
    // Arrange
    mockFrom
      .mockImplementationOnce(() => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: 1 }, error: null }) }) }) })) // roles
      .mockImplementationOnce(() => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: 1 }, error: null }) }) }) })) // personas
      .mockImplementationOnce((tableName: string) => { // idiomas
        expect(tableName).toBe('idiomas');
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) };
      });

    // Act
    await UsuariosService.guardar(req as Request, res as Response);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errorInfo: expect.objectContaining({ message: 'El nivel educativo no existe' }) }));
  });
});
