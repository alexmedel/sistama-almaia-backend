import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(process.env.SUPABASE_HOST!, process.env.SUPABASE_PASSWORD_ADMIN!,
  { auth: { autoRefreshToken: false, persistSession: false } });

const renombrar = [
  { id: "1f2c5ffe-a42e-48a4-9ad0-d0e808be9811", email: "thomas.paredes5106@almaia.cl" },
  { id: "27ec417a-f866-4b78-b0e7-d1023cba32df", email: "simn.veas2247@almaia.cl" },
  { id: "0efe644f-eda2-4386-9f1e-e76f3d0133e7", email: "emilia.oyarzn9055@almaia.cl" },
  { id: "c8da23f6-99b4-414b-8987-a1934a12d0f0", email: "antonella.miranda1282@almaia.cl" },
  { id: "77cc7b05-dbe8-4ba5-8fb3-4eaa9ea5afbb", email: "alexander.argandoa6238@almaia.cl" },
  { id: "193e451a-6d37-4183-8bfa-ba93f6084f56", email: "cristopher.briones5573@almaia.cl" },
  { id: "9c92317f-249e-432a-976c-cb43e57da047", email: "manuel.painenao3996@almaia.cl" },
  { id: "3e532154-7e9a-405e-a524-711a212e261d", email: "ignacia.zapata9619@almaia.cl" },
  { id: "107553a5-d2c5-49f9-a110-10267b00a9bc", email: "martina.gonzlez3760@almaia.cl" },
  { id: "8ff56b78-3749-41e2-81b2-a71fd2424898", email: "iselaine.simeon7187@almaia.cl" },
  // 1952 (Jara Vidal) fuera hasta confirmar con el colegio
];
const borrar = ["2923c269-b11a-4501-8611-133045c9f752"]; // Gmail sobrante de Álvaro

(async () => {
  for (const a of renombrar) {
    const { error } = await admin.auth.admin.updateUserById(a.id, { email: a.email, email_confirm: true });
    console.log(error ? `❌ ${a.email}: ${error.message}` : `✅ ${a.email}`);
  }
  for (const id of borrar) {
    const { error } = await admin.auth.admin.deleteUser(id);
    console.log(error ? `❌ delete ${id}: ${error.message}` : `🗑️ ${id}`);
  }
})();