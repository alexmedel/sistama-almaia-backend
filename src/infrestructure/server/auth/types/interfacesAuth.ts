export interface ValidateLoginType {
  isEmail: boolean;
  identifier: string;
  password: string;
}

export interface AuthErrorType {
  isSend: boolean;
  tipo_auditoria_id: number;
  colegio_id: number;
  usuario_id: number;
  fecha: string;
  descripcion: string;
  modulo_afectado: string;
  accion_realizada: string;
  ip_origen: string;
  referencia_id: number;
  model: string;
  
}