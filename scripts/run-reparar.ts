import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { repararCorruptos } from "./repararCorruptos"; // ajusta según la tabla de arriba

const admin = createClient(
  process.env.SUPABASE_HOST!,
  process.env.SUPABASE_PASSWORD_ADMIN!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const dryRun = !process.argv.includes("--apply");
const limiteArg = process.argv.find((a) => a.startsWith("--limite="));
const limite = limiteArg ? Number(limiteArg.split("=")[1]) : undefined;

repararCorruptos(admin, process.env.CLAVE_UNIVERSAL ?? "almaia2025", {
  dryRun,
  limite,
})
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
