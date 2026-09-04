// helpers/ErrorHandler.ts
import { Response } from 'express';
import { AuthApiError } from '@supabase/supabase-js';

export interface ErrorResponse {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export enum ErrorCodes {
  // Autenticación
  AUTH_FAILED = 'AUTH_FAILED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Validación
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Base de datos
  DATABASE_ERROR = 'DATABASE_ERROR',
  USER_EXISTS = 'USER_EXISTS',
  
  // Archivo/Upload
  FILE_ERROR = 'FILE_ERROR',
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  
  // Sistema
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Password Reset
  INVALID_RESET_CODE = 'INVALID_RESET_CODE',
  CODE_EXPIRED = 'CODE_EXPIRED',
  CODE_ALREADY_USED = 'CODE_ALREADY_USED',
}

export class CustomError extends Error {
  public code: string;
  public statusCode: number;
  public details?: any;

  constructor(code: string, message: string, statusCode: number = 400, details?: any) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends CustomError {
  constructor(message: string, details?: any) {
    super(ErrorCodes.VALIDATION_ERROR, message, 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string, details?: any) {
    super(ErrorCodes.AUTH_FAILED, message, 401, details);
    this.name = 'AuthenticationError';
  }
}

export class DatabaseError extends CustomError {
  constructor(message: string, details?: any) {
    super(ErrorCodes.DATABASE_ERROR, message, 500, details);
    this.name = 'DatabaseError';
  }
}

export class FileError extends CustomError {
  constructor(message: string, details?: any) {
    super(ErrorCodes.FILE_ERROR, message, 400, details);
    this.name = 'FileError';
  }
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Método principal para manejar cualquier error y enviarlo como respuesta HTTP
   */
  public handleError(error: unknown, res: Response, context?: string): void {
    const errorInfo = this.parseError(error);
    this.logError(errorInfo, context);

    res.status(errorInfo.statusCode).json({ errorInfo, context });
  }

  /**
   * Parsea cualquier tipo de error y lo convierte a un formato estándar
   */
  private parseError(error: unknown): {
    code: string;
    message: string;
    statusCode: number;
    details?: any;
  } {
    // Error personalizado
    if (error instanceof CustomError) {
      return {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        details: error.details
      };
    }

    // Error de Supabase Auth
    if (error instanceof AuthApiError) {
      return this.handleSupabaseAuthError(error);
    }

    // Error estándar de JavaScript
    if (error instanceof Error) {
      return this.handleStandardError(error);
    }

    // Error desconocido
    return {
      code: ErrorCodes.INTERNAL_ERROR,
      message: 'Error interno del servidor',
      statusCode: 500,
      details: { originalError: String(error) }
    };
  }

  /**
   * Maneja errores específicos de Supabase Auth
   */
  private handleSupabaseAuthError(error: AuthApiError): {
    code: string;
    message: string;
    statusCode: number;
    details?: any;
  } {
    const errorMap: Record<string, { code: string; message: string; statusCode: number }> = {
      'invalid_credentials': {
        code: ErrorCodes.INVALID_CREDENTIALS,
        message: 'Credenciales incorrectas',
        statusCode: 401
      },
      'user_not_found': {
        code: ErrorCodes.USER_NOT_FOUND,
        message: 'Usuario no encontrado',
        statusCode: 404
      },
      'email_address_invalid': {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Formato de email inválido',
        statusCode: 400
      },
      'signup_disabled': {
        code: ErrorCodes.SERVICE_UNAVAILABLE,
        message: 'Registro de usuarios deshabilitado',
        statusCode: 503
      },
      'user_already_exists': {
        code: ErrorCodes.USER_EXISTS,
        message: 'El usuario ya existe',
        statusCode: 409
      },
      'weak_password': {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'La contraseña es muy débil',
        statusCode: 400
      }
    };

    const mapped = errorMap[error.message] ;
    if (mapped) {
      return {
        ...mapped,
        details: { supabaseError: error.message }
      };
    }

    return {
      code: ErrorCodes.AUTH_FAILED,
      message: 'Error de autenticación',
      statusCode: 401,
      details: { supabaseError: error.message }
    };
  }

  /**
   * Maneja errores estándar de JavaScript
   */
  private handleStandardError(error: Error): {
    code: string;
    message: string;
    statusCode: number;
    details?: any;
  } {
    // Detectar tipos comunes de errores por el mensaje
    const message = error.message.toLowerCase();

    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('obligatorio') ||
      message.includes('obligatorios') ||
      message.includes('debe ser') ||
      message.includes('debe proporcionar')
    ) {
      return {
        code: ErrorCodes.VALIDATION_ERROR,
        message: error.message,
        statusCode: 400
      };
    }

    if (message.includes('not found') || message.includes('no encontrado')) {
      return {
        code: ErrorCodes.USER_NOT_FOUND,
        message: error.message,
        statusCode: 404
      };
    }

    if (message.includes('unauthorized') || message.includes('no autorizado')) {
      return {
        code: ErrorCodes.UNAUTHORIZED,
        message: error.message,
        statusCode: 403
      };
    }

    if (message.includes('database') || message.includes('connection')) {
      return {
        code: ErrorCodes.DATABASE_ERROR,
        message: 'Error de base de datos',
        statusCode: 500,
        details: { originalMessage: error.message }
      };
    }

    // Error genérico
    return {
      code: ErrorCodes.INTERNAL_ERROR,
      message: error.message || 'Error interno del servidor',
      statusCode: 500
    };
  }

  /**
   * Envía la respuesta de error HTTP
   */
  private sendErrorResponse(res: Response, errorInfo: {
    code: string;
    message: string;
    statusCode: number;
    details?: any;
  }): void {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: errorInfo.code,
        message: errorInfo.message,
        ...(errorInfo.details && { details: errorInfo.details })
      },
      timestamp: new Date().toISOString()
    };

    res.status(errorInfo.statusCode).json(response);
  }

  /**
   * Registra el error para debugging
   */
  private logError(errorInfo: {
    code: string;
    message: string;
    statusCode: number;
    details?: any;
  }, context?: string): void {
    const logLevel = errorInfo.statusCode >= 500 ? 'error' : 'warn';
    
    console[logLevel](`[ERROR-HANDLER] ${context || 'Unknown context'}`, {
      code: errorInfo.code,
      message: errorInfo.message,
      statusCode: errorInfo.statusCode,
      details: errorInfo.details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Métodos de conveniencia para errores comunes
   */
  public static throwValidationError(message: string, details?: any): never {
    throw new ValidationError(message, details);
  }

  public static throwAuthError(message: string, details?: any): never {
    throw new AuthenticationError(message, details);
  }

  public static throwDatabaseError(message: string, details?: any): never {
    throw new DatabaseError(message, details);
  }

  public static throwFileError(message: string, details?: any): never {
    throw new FileError(message, details);
  }

  public static throwCustomError(code: string, message: string, statusCode: number = 400, details?: any): never {
    throw new CustomError(code, message, statusCode, details);
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();
