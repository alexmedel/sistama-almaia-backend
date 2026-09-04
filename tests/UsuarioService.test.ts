 
// Mocked Supabase client functions
const mockSingle = jest.fn();
const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });
const mockUpdate = jest.fn(() => ({ eq: mockUpdateEq }));
const mockEq = jest.fn(() => ({ single: mockSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));

const mockFrom = jest.fn(() => ({
  select: mockSelect,
  update: mockUpdate,
}));

import { UsuariosService } from '../src/infrestructure/server/auth/UsuarioService';
import { Request, Response } from 'express';

jest.mock('@supabase/supabase-js', () => {
  const actual = jest.requireActual('@supabase/supabase-js');
  return {
    ...actual,
    createClient: jest.fn().mockReturnValue({
      from: mockFrom,
    }),
  };
});

describe('UsuarioService Tests', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      params: {},
      supabase: {
        from: mockFrom,
      },
      creado_por: 1,
      actualizado_por: 1,
    } as any;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('generar_clave', () => {
    it('should generate clave successfully', async () => {
      // Arrange
      req.params = { id: '123' };
      req.body = { clave: '123456' };

      // Mock para actualizar clave
      mockUpdateEq.mockResolvedValue({ error: null });

      // Act
      await UsuariosService.generar_clave(req as Request, res as Response);

      // Assert
      expect(mockFrom).toHaveBeenCalledWith('usuarios');
      expect(mockUpdate).toHaveBeenCalledWith({ clave_generada: '123456' });
      expect(mockEq).toBeCalledWith('usuario_id', 123);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'clave generada con exito' });
    });

    it('should return error when clave is not provided', async () => {
      // Arrange
      req.params = { id: '123' };
      req.body = {};

      // Act
      await UsuariosService.generar_clave(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'La clave es requerida.',
      });
    });
  });
});
