// Mocked Supabase client functions
const mockSignInWithPassword = jest.fn();
const mockSingle = jest.fn();
const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });
const mockUpdate = jest.fn(() => ({ eq: mockUpdateEq }));
const mockEq = jest.fn(() => ({ single: mockSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));

const mockFrom = jest.fn(() => ({
  select: mockSelect,
  update: mockUpdate,
}));

import { AuthService } from '../src/infrestructure/server/auth/AuthService';
import { Request, Response } from 'express';
import { AuditoriaesService } from '../src/infrestructure/server/auth/AuditoriaService';

jest.mock('@supabase/supabase-js', () => {
  const actual = jest.requireActual('@supabase/supabase-js');
  return {
    ...actual,
    createClient: jest.fn().mockReturnValue({
      auth: {
        signInWithPassword: mockSignInWithPassword,
      },
      from: mockFrom,
    }),
  };
});

// Mock AuditoriaesService
jest.mock('../src/infrestructure/server/auth/AuditoriaService', () => ({
  AuditoriaesService: {
    guardar: jest.fn(),
  },
}));

describe('AuthService', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {
        email: 'test@example.com',
        password: 'password',
      },
      ip: '127.0.0.1',
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('login', () => {
    it('should return a token and save audit on successful login', async () => {
      // Arrange
      mockSignInWithPassword.mockResolvedValue({
        data: {
          session: {
            access_token: 'test_token',
          },
          user: { id: 'user-id-123' },
        },
        error: null,
      });

      mockSingle.mockResolvedValue({
        data: { usuario_id: 1, intentos_inicio_sesion: 2 },
        error: null,
      });

      // Act
      await AuthService.login(req as Request, res as Response);

      // Assert
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
      expect(mockFrom).toHaveBeenCalledWith('usuarios');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('usuario_id'));
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('intentos_inicio_sesion'));

      expect(mockEq).toHaveBeenCalledWith('email', 'test@example.com');

      // Check that login attempts are incremented and other fields are set
      expect(mockUpdate).toHaveBeenCalledWith({
        intentos_inicio_sesion: 3, // 2 + 1 = 3
        ultimo_inicio_sesion: expect.any(Date),
        fecha_actualizacion: expect.any(Date),
        activo: true,
      });

      expect(mockUpdateEq).toHaveBeenCalledWith('usuario_id', 1);

      expect(AuditoriaesService.guardar).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ token: 'test_token' });
    });

    it('should handle authentication failure', async () => {
      // Arrange
      const authError = new Error('Invalid credentials');
      mockSignInWithPassword.mockResolvedValue({
        data: null,
        error: authError,
      });

      // Act
      await AuthService.login(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Credenciales incorrectas:",
        error: 'error',
      });
    });
  });
});
