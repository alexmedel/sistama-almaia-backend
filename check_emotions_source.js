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

async function checkEmotionsSource() {
  try {
    console.log("1. Counting responses in alumnos_respuestas_seleccion...");
    const { count: countSel, error: errSel } = await supabase
      .from("alumnos_respuestas_seleccion")
      .select("*", { count: "exact", head: true });
      
    if (errSel) console.error("Error counting alumnos_respuestas_seleccion:", errSel);
    else console.log("Total in alumnos_respuestas_seleccion:", countSel);
    
    console.log("2. Counting responses in encuestas_respuestas...");
    const { count: countEnc, error: errEnc } = await supabase
      .from("encuestas_respuestas")
      .select("*", { count: "exact", head: true });
      
    if (errEnc) console.error("Error counting encuestas_respuestas:", errEnc);
    else console.log("Total in encuestas_respuestas:", countEnc);

    // Let's check some records of alumnos_respuestas_seleccion
    console.log("\n3. Sample from alumnos_respuestas_seleccion:");
    const { data: sampleSel, error: errSampleSel } = await supabase
      .from("alumnos_respuestas_seleccion")
      .select("alumno_id, pregunta_id, respuesta_posible_id, fecha_pregunta, tipo_concepto, activo, respondio")
      .limit(5);
    console.log(sampleSel);

    // Let's see which questions are in alumnos_respuestas_seleccion
    console.log("\n4. Grouping alumnos_respuestas_seleccion by pregunta_id...");
    // Let's query a sample of records first to count in JS since group by is not directly supported in PostgREST unless via RPC
    const { data: allSel, error: errAllSel } = await supabase
      .from("alumnos_respuestas_seleccion")
      .select("pregunta_id, tipo_concepto")
      .limit(100);
    
    if (allSel) {
      const counts = {};
      allSel.forEach(row => {
        counts[row.pregunta_id] = (counts[row.pregunta_id] || 0) + 1;
      });
      console.log("Pregunta ID distribution (sample):", counts);
    }

    // Let's query the table 'preguntas' to see what columns it has
    console.log("\n5. Checking columns in 'preguntas' table...");
    const defs = JSON.parse(fs.readFileSync("schema_definitions.json", "utf8"));
    if (defs.preguntas) {
      console.log("Preguntas properties:", Object.keys(defs.preguntas.properties));
    }
    
    // Let's fetch some questions
    const { data: preguntas, error: errPreg } = await supabase
      .from("preguntas")
      .select("pregunta_id, texto, tipo_pregunta_id, activo")
      .limit(10);
    console.log("Preguntas:", preguntas);

    // Let's perform a manual join from alumnos_respuestas_seleccion to check why no records return by grade
    console.log("\n6. Simulating the join by grade for one active school...");
    // Let's get Colegio 13 (Colegio 1) which had general responses
    const targetColegioId = 13;
    
    // Fetch all alumnos in Colegio 13
    const { data: alumnos, error: errAl } = await supabase
      .from("alumnos")
      .select("alumno_id, persona_id, colegio_id")
      .eq("colegio_id", targetColegioId);
      
    console.log(`Found ${alumnos ? alumnos.length : 0} alumnos in Colegio ${targetColegioId}`);
    
    if (alumnos && alumnos.length > 0) {
      const alumnoIds = alumnos.map(a => a.alumno_id);
      
      // Let's fetch their courses from alumnos_cursos
      const { data: alCursos, error: errAlCur } = await supabase
        .from("alumnos_cursos")
        .select("alumno_id, curso_id, ano_escolar, activo")
        .in("alumno_id", alumnoIds);
        
      console.log(`Found ${alCursos ? alCursos.length : 0} student-course mappings in alumnos_cursos`);
      console.log("Sample mappings:", alCursos ? alCursos.slice(0, 5) : []);
      
      // Fetch responses for these alumnos
      const { data: resps, error: errResps } = await supabase
        .from("alumnos_respuestas_seleccion")
        .select("alumno_id, respuesta_posible_id, fecha_pregunta")
        .in("alumno_id", alumnoIds);
        
      console.log(`Found ${resps ? resps.length : 0} responses in alumnos_respuestas_seleccion for these students`);
      console.log("Sample responses:", resps ? resps.slice(0, 5) : []);
      
      // If we have responses and course mappings, let's see if any alumno_id overlaps!
      if (alCursos && resps) {
        const courseStudentIds = new Set(alCursos.map(ac => ac.alumno_id));
        const responseStudentIds = new Set(resps.map(r => r.alumno_id));
        const intersection = [...responseStudentIds].filter(id => courseStudentIds.has(id));
        console.log(`Intersection of student IDs in alumnos_cursos and responses: ${intersection.length} students`);
        console.log("Overlapping student IDs:", intersection.slice(0, 10));
      }
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

checkEmotionsSource();
