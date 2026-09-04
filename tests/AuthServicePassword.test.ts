 
import { AuthService } from '../src/infrestructure/server/auth/AuthService';
import { Request, Response } from 'express';

// Mock the entire supabase-js module
jest.mock('@supabase/supabase-js', () => {
  const actual = jest.requireActual('@supabase/supabase-js');
  const mockSignInWithPassword = jest.fn();
  const mockAdminUpdateUserById = jest.fn();
  const mockFrom = jest.fn();
  
  return {
    ...actual,
    createClient: jest.fn().mockImplementation((url: string, key: string) => {
      if (key === process.env.SUPABASE_PASSWORD_ADMIN) {
        return {
          auth: {
            signInWithPassword: mockSignInWithPassword,
            admin: {
              updateUserById: mockAdminUpdateUserById,
            },
          },
          from: mockFrom,
        };
      }
      return {
        auth: {
          signInWithPassword: mockSignInWithPassword,
        },
        from: mockFrom,
      };
    }),
  };
});

// Mock EmailService
jest.mock('../src/core/services/EmailService', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    enviarEmailRestorePassword: jest.fn(),
  })),
}));

// Mock nanoid
jest.mock('nanoid', () => ({
  nanoid: jest.fn().mockReturnValue('test-auth-code'),
}));

// Import the actual supabase module to get the mocked functions
import { createClient } from '@supabase/supabase-js';

describe('AuthService - Password Tests', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let mockSignInWithPassword: jest.Mock;
  let mockAdminUpdateUserById: jest.Mock;
  let mockFrom: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked functions
    const adminClient = createClient('', process.env.SUPABASE_PASSWORD_ADMIN || '');
    mockSignInWithPassword = adminClient.auth.signInWithPassword as jest.Mock;
    mockAdminUpdateUserById = adminClient.auth.admin.updateUserById as jest.Mock;
    mockFrom = adminClient.from as jest.Mock;

    req = {
      body: {},
      user: {
        auth_id: 'user-auth-id-123',
        email: 'test@example.com',
      },
      ip: '127.0.0.1',
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Setup chained method mocks
    mockFrom.mockReturnThis();
  });

  describe('updatePassword', () => {
    it('should update password successfully when current password is correct', async () => {
      // Arrange
      req.body = {
        currentPassword: 'currentPass123',
        newPassword: 'newPass456',
      };

      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      });

      mockAdminUpdateUserById.mockResolvedValue({ data: { id: 'user-id' }, error: null });

      // Act
      await AuthService.updatePassword(req as Request, res as Response);

      // Assert
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'currentPass123',
      });
      expect(mockAdminUpdateUserById).toHaveBeenCalledWith('user-auth-id-123', {
        password: 'newPass456',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Contraseña actualizada correctamente',
        data: { id: 'user-id' },
      });
    });

    it('should return error when current password is incorrect', async () => {
      // Arrange
      req.body = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPass456',
      };

      mockSignInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      // Act
      await AuthService.updatePassword(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error al actualizar la contraseña',
        error: 'Contraseña incorrecta',
      });
    });
  });

  // Simple test for other methods to verify they exist
  describe('Method existence', () => {
    it('should have solicitar_cambio_password method', () => {
      expect(AuthService.solicitar_cambio_password).toBeDefined();
    });

    it('should have RestorePassword method', () => {
      expect(AuthService.RestorePassword).toBeDefined();
    });

    it('should have updatePassword_By_ClaveDinamica method', () => {
      expect(AuthService.updatePassword_By_ClaveDinamica).toBeDefined();
    });
  });
});
