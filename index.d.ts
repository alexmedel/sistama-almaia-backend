export {};

declare global {
  namespace Express {
    export interface Request {
      user?: {
        auth_id: string;
        email: string;
      };
      creado_por?: string;
      actualizado_por?: string;
    }
  }
}

