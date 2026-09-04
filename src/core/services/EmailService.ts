 
import nodemailer from "nodemailer";

interface EmailTemplate {
  subject: string;
  html: string;
}

interface EmailData {
  
  [key: string]: any;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Validar que todas las variables estén definidas
    const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD } = process.env;

    if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASSWORD) {
      throw new Error(
        "Faltan variables de entorno necesarias para el envío de correo."
      );
    }

    this.transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: parseInt(EMAIL_PORT, 10),
      secure: EMAIL_PORT === "465",
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
    });

    // Verificación de conexión al iniciar
    this.transporter.verify((error, success) => {
      if (error) {
        console.error("Error al verificar el transporter:", error);
      } else {
        console.log("Servidor de correo listo para enviar mensajes:", success);
      }
    });
  }

  async enviarEmail(
    destinatarios: string[],
    template: EmailTemplate,
    data: EmailData = {}
  ): Promise<boolean> {
    try {
      const subject = this.procesarTemplate(template.subject, data);
      const html = this.procesarTemplate(template.html, data);
      const from = process.env.EMAIL_FROM;
      const to = destinatarios.join(",");

      const mailOptions = {
        from,
        to,
        subject,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);

      return true;
    } catch (error: any) {
      console.error("Error al enviar email:", error.message || error);
      return false;
    }
  }

  async enviarNotificacionAlerta(
    alertaData: EmailData,
    destinatarios: string[]
  ): Promise<boolean> {
    const template: EmailTemplate = {
      subject: `⚠ Nueva alerta registrada en Alma: {{tipo}}`,
      html: `
      <p>Hola equipo,</p>

      <p>Se ha registrado una nueva alerta (<strong>{{codigo}}</strong>) de tipo <strong>{{tipo}}</strong> en la plataforma Alma.</p>

      <p>🔔 <strong>Es fundamental que esta situación sea gestionada a la brevedad posible.</strong></p>

      <p>Puedes revisar y atender esta alerta ingresando al sistema en el siguiente enlace:</p>

      <p>👉 <a href="{{enlace}}" target="_blank">Acceder a Alma</a></p>

      <p><em>(Asegúrate de tener los permisos correspondientes para visualizar esta alerta.)</em></p>

      <br/>

      <p>Gracias por tu compromiso y rápida acción.</p>
    `,
    };

    const data = {
      ...alertaData,
      tipo: alertaData.tipo || "GENERAL",
      codigo: alertaData.codigo || "N/A",
      enlace: alertaData.enlace || "https://app.almaia.cl",
    };

    return this.enviarEmail(destinatarios, template, data);
  }

  async enviarEmailRegistro(
    email: string,
    datosUsuario: EmailData
  ): Promise<boolean> {
    const template: EmailTemplate = {
      subject: "Bienvenido a Almaia - Registro Exitoso",
      html: `
        <h2>¡Bienvenido a Almaia!</h2>
        <p>Tu registro ha sido exitoso.</p>
        <p>Datos de tu cuenta:</p>
        <ul>
          <li>Email: {{email}}</li>
          <li>Fecha de registro: {{fecha}}</li>
        </ul>
      `,
    };

    const data = {
      ...datosUsuario,
      email,
      fecha: new Date().toLocaleDateString(),
    };

    return this.enviarEmail([email], template, data);
  }
  async enviarEmailRestorePassword(
    email: string,
    authPass: string
    // datosUsuario: EmailData
  ): Promise<boolean> {
    const template: EmailTemplate = {
      subject: "Almaia - Restablecer tu contraseña",
      html: `
        <h2>¡🔐 Bienvenido a ALMAIA!</h2>
        <p>Has solicitado restablecer tu contraseña.
Copia el siguiente código de autorización y úsalo en la app para continuar 🛠️</p>
        <b>🧾 Datos de tu cuenta:</b>
        <ul>
          <li>📧 Solicitado por: {{email}}</li>
          <li>🗓️ Fecha de solicitud: {{fecha}}</li>
          <li>🔑 Código de autorización: <b> {{authPass}} </b> <br/>  ⚠️ No compartas este código con nadie.
                  Si no realizaste esta solicitud, puedes ignorar este mensaje. 
                  Saludos. Equipo de AlmaIA 👋🏻.
          </li> 
          <link href="https://nextjs.org/"/>
        </ul>
      `,
    };

    const data = {
      // ...datosUsuario,
      email,
      authPass,
      fecha: new Date().toLocaleDateString(),
    };

    return this.enviarEmail([email], template, data);
  }

  private procesarTemplate(template: string, data: EmailData): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return data[key] !== undefined ? String(data[key]) : `{{${key}}}`;
    });
  }
}
