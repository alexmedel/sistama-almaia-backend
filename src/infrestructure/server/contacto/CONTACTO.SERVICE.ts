 
import { Request, Response } from "express";
import Joi from "joi";
import { EmailService } from "../../../core/services/EmailService";

const ContactoAlmaiachema = Joi.object({
    nombre: Joi.string().max(100).required(),
    email: Joi.string().max(100),
    telefono: Joi.string().max(50).required(),
    to: Joi.string().max(100)
});

const ContactoAlmaiachemaSoporte = Joi.object({
    nombre: Joi.string().max(100).required(),
    email: Joi.string().max(100).required(),
    asunto: Joi.string().max(200),
    mensaje: Joi.string().max(200),
});
export const CONTACTO_SERVICES = {
    async contactoAlmaia(req: Request, res: Response) {
        try {
            const { value, error } = ContactoAlmaiachema.validate(req.body)
            if (error) {
                throw new Error("Campos requeridos (nombre, telefono, email)");
            }
            const { nombre, telefono, email, to } = req.body
            new EmailService().enviarEmail(
                to ? [to] : ["dxgabalt@gmail.com", "alexmedel@almaia.cl", "contacto@almaia.cl", "crivas@almaia.cl", "soporte@almaia.cl"],
                {
                    subject: "Nuevo contacto desde el sitio web AlmaIA",
                    html: `
                 <h2>¡🔐 CONTACTO RECIBIDO!</h2>
                <p>Hemos recibido un nuevo contacto 📲</p>
                <b>🧾 Datos del contacto:</b>
                <ul>
                <li>📛 Nombre: {{nombre}}</li>
                <li>📧 Correo electronico: {{email}}</li>
                <li>📱 Telefono: {{telefono}}</li> 
                <li>🗓️ Fecha: {{fecha}}</li>
                <link href="https://nextjs.org/"/>
                </ul>
                `
                }, { nombre, telefono, email, fecha: new Date().toLocaleDateString() })
            res.json({ message: "Contacto enviado" });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    },
    async contactoAlmaiaSoporte(req: Request, res: Response) {
        try {
            const { value, error } = ContactoAlmaiachemaSoporte.validate(req.body)
            if (error) {
                throw new Error("Campos requeridos (nombre, email, asunto, mensaje)");
            }
            const { nombre, email, asunto, mensaje } = req.body
            new EmailService().enviarEmail(
                ["soporte@almaia.cl"],
                {
                    subject: "Nuevo contacto desde el sitio web AlmaIA",
                    html: `
                 <h2>¡🔐 SOPORTE ASUNTO RECIBIDO!</h2>
                <p>Hemos recibido un nuevo asunto 📲</p>
                <b>🧾 Datos del contacto:</b>
                <ul>
                <li>📛 Nombre: {{nombre}}</li>
                <li>📧 Correo electronico: {{email}}</li>
                <li>🚀 Asunto: {{asunto}}</li>
                <li>📝 Mensaje: {{mensaje}}</li>
                <li>🗓️ Fecha: {{fecha}}</li>
                <link href="https://nextjs.org/"/>
                </ul>
                `
                }, { nombre, email, asunto, mensaje, fecha: new Date().toLocaleDateString() })
            res.json({ message: "Contacto enviado" });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    },

};
