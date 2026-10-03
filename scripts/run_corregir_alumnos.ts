import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(process.env.SUPABASE_HOST!, process.env.SUPABASE_PASSWORD_ADMIN!,
  { auth: { autoRefreshToken: false, persistSession: false } });

const arreglos = [
  { id: "026e6703-3f66-455e-b225-772966793483", email: "amanda.donoso3172@almaia.cl" },
  { id: "6f9652f7-3853-4d81-8d99-98b0ba64d767", email: "camilo.rodriguez1255@almaia.cl" },
  { id: "61f1b005-0cdc-45a7-9899-5ddb6a08daa6", email: "josefina.calqun6737@almaia.cl" },
  { id: "0098c599-9688-4da6-b7a5-7ddfe6b01b82", email: "trinidad.pino7382@almaia.cl" },
  { id: "f978dfb7-3f27-440e-9d29-83fbacf73cde", email: "trinidad.bahamondes4447@almaia.cl" },
  // Mateo Aldecua: ver nota abajo, solo después de borrar la cuenta 95d6f499
  { id: "d5d27836-cb83-4345-927e-1e21bccbb72f", email: "mateo.aldecua8234@almaia.cl" },
];

(async () => {
  for (const a of arreglos) {
    const { error } = await admin.auth.admin.updateUserById(a.id, { email: a.email, email_confirm: true });
    console.log(error ? `❌ ${a.email}: ${error.message}` : `✅ ${a.email}`);
  }
})();