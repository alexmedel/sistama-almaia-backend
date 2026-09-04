import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { ColegioExcelStagingLoader } from "./src/core/services/ColegioExcelStagingLoader";

// Load dotenv
dotenv.config();

const supabaseUrl = process.env.SUPABASE_HOST!;
const supabaseKey = process.env.SUPABASE_PASSWORD_ADMIN!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Loading Excel into Staging...");
  
  const excelPath = path.join(__dirname, "Colegio_Demo_Carga.xlsx");
  const buffer = fs.readFileSync(excelPath);

  const loader = new ColegioExcelStagingLoader({
    supabaseClient: supabase
  });

  const fileMock = {
    buffer,
    originalname: "Colegio_Demo_Carga.xlsx",
    fieldname: "file",
    encoding: "7bit",
    mimetype: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: buffer.length,
    stream: null as any,
    destination: "",
    filename: "",
    path: ""
  } as any;

  const result = await loader.load(fileMock);
  console.log("\n✅ Carga Staging Exitosa!");
  console.log("Resultado:", JSON.stringify(result, null, 2));
}

run().catch((error) => {
  console.error("❌ Error running loader:", error);
});
