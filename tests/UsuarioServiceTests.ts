 
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

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    from: mockFrom,
  }),
}));

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
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('actualizar', () => {
    it('should update user information successfully', async () => {
      // Arrange
      req.params = { id: '123' };
      req.body = {
        nombre_social: 'Test User',
        email: 'test@example.com',
        rol_id: 2,
        telefono_contacto: '+1234567890',
        url_foto_perfil: 'https://example.com/avatar.jpg',
        idioma_id: 1,
        nombres: 'Test',
        apellidos: 'User',
        rut: '12345678-9',
        fecha_nacimiento: '1990-01-01'
      };

      // Mock para buscar usuario existente
      mockSingle.mockResolvedValueOnce({
        data: {
          usuario_id: 123,
          persona_id: 456,
          creado_por: 1,
          activo: true
        },
        error: null,
      });

      // Mock para buscar rol
      mockSingle.mockResolvedValueOnce({
        data: { rol_id: 2, nombre: 'Admin' },
        error: null,
      });

      // Mock para buscar persona
      mockSingle.mockResolvedValueOnce({
        data: {
          persona_id: 456,
          nombres: 'Old',
          apellidos: 'Name',
          numero_documento: 'old-rut',
          fecha_nacimiento: new Date('1980-01-01')
        },
        error: null,
      });

      // Mock para buscar idioma
      mockSingle.mockResolvedValueOnce({
        data: { idioma_id: 1, nombre: 'Español' },
        error: null,
      });

      // Mock para actualizar usuario
      mockSingle.mockResolvedValueOnce({
        data: {
          usuario_id: 123,
          nombre_social: 'Test User',
          email: 'test@example.com',
          rol_id: 2,
          telefono_contacto: '+1234567890',
          url_foto_perfil: 'https://example.com/avatar.jpg',
          idioma_id: 1,
          persona_id: 456
        },
        error: null,
      });

      // Mock para actualizar persona
      mockUpdateEq.mockResolvedValueOnce({ error: null });

      // Mock para actualizar imagen de alumno
      mockUpdateEq.mockResolvedValueOnce({ error: null });

      // Act
      await UsuariosService.actualizar(req as Request, res as Response);

      // Assert
      expect(mockFrom).toHaveBeenCalledWith('roles');
      expect(mockFrom).toHaveBeenCalledWith('usuarios');
      expect(mockFrom).toHaveBeenCalledWith('personas');
      expect(mockFrom).toHaveBeenCalledWith('idiomas');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        usuario_id: 123,
        nombre_social: 'Test User',
        email: 'test@example.com'
      }));
    });

    it('should return error when user is not found', async () => {
      // Arrange
      req.params = { id: '999' };
      req.body = {
        nombre_social: 'Test User',
        email: 'test@example.com',
        rol_id: 2,
        telefono_contacto: '+1234567890',
        url_foto_perfil: 'https://example.com/avatar.jpg',
        idioma_id: 1
      };

      // Mock para buscar usuario (no encontrado)
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: new Error('User not found'),
      });

      // Act
      await UsuariosService.actualizar(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'El usuario no existe',
      });
    });
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
      expect(mockEq).to极CalledWith('usuario_id', 123);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'clave generada con exito' });
    });

    it('should return error when clave is not provided', async () => {
      // Arrange
      req.params = { id: '123' };
      req.body = {};

      // Act
      await UsuariosService.generar极lave(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'La clave es requerida.',
      });
    });
  });
});
