const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.SUPABASE_HOST;
const supabaseKey = process.env.SUPABASE_PASSWORD_ADMIN;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIds() {
  try {
    console.log("Consultando respuestas 1677 y 1678...");
    
    const { data: respuestas, error } = await supabase
      .from("encuestas_respuestas")
      .select("*")
      .in("encuesta_respuesta_id", [1677, 1678]);

    if (error) throw error;
    console.log("Respuestas encontradas:", JSON.stringify(respuestas, null, 2));

    // Ver si hay más respuestas con destinatario_id = 0
    const { count, error: errCount } = await supabase
      .from("encuestas_respuestas")
      .select("*", { count: "exact", head: true })
      .eq("destinatario_id", 0);

    if (errCount) throw errCount;
    console.log(`Cantidad total de respuestas con destinatario_id = 0: ${count}`);

  } catch (err) {
    console.error(err);
  }
}

checkIds();
