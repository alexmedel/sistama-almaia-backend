import { Response } from 'express';

/**
 * Formatea y envía una respuesta JSON, con un log visualmente claro.
 * @param res El objeto de respuesta de Express.
 * @param code El código de estado HTTP.
 * @param data Los datos a enviar en la respuesta.
 */
export const FormatResponse = (res: Response, code: number, data: any): void => {
  res.status(code).json(data);
};
