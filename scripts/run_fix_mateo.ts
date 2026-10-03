import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(process.env.SUPABASE_HOST!, process.env.SUPABASE_PASSWORD_ADMIN!,
  { auth: { autoRefreshToken: false, persistSession: false } });

(async () => {
  const del = await admin.auth.admin.deleteUser("95d6f499-e64c-4710-a6c0-9ea21459205c");
  console.log(del.error ? `❌ delete: ${del.error.message}` : "🗑️ duplicado borrado");
  if (del.error) return;

  const upd = await admin.auth.admin.updateUserById("d5d27836-cb83-4345-927e-1e21bccbb72f", {
    email: "mateo.aldecua8234@almaia.cl",
    password: "almaia2025",
    email_confirm: true,
  });
  console.log(upd.error ? `❌ update: ${upd.error.message}` : "✅ mateo.aldecua8234@almaia.cl");
})();