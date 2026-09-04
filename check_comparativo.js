const { createClient } = require('@supabase/supabase-js');

const SUPABASE_HOST = 'https://oplzvrgmuzfraczaqkbe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wbHp2cmdtdXpmcmFjemFxa2JlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTk5ODE5NSwiZXhwIjoyMDcxNTc0MTk1fQ.wcgObzdr24-MHM75B554ZC45TKyMS14wXLDaGtRnjvI';

const client = createClient(SUPABASE_HOST, SUPABASE_KEY);
const colegioId = 0;

async function main() {
  // 1. Qué devuelve el endpoint actual (ano_escolar de alumnos_cursos)
  const { data: cursosAnios } = await client
    .from('alumnos_cursos')
    .select('ano_escolar, alumnos!inner(colegio_id)')
    .eq('activo', true)
    .eq('alumnos.colegio_id', colegioId)
    .not('ano_escolar', 'is', null);
  const aniosCursos = [...new Set(cursosAnios?.map(r => r.ano_escolar))].sort();
  console.log('[alumnos_cursos.ano_escolar] Años:', aniosCursos);

  // 2. Años REALES con datos en respuestas (emociones)
  const { data: respEmociones } = await client
    .from('alumnos_respuestas_seleccion')
    .select('fecha_pregunta, alumnos!inner(colegio_id)')
    .eq('tipo_concepto', 'Emociones')
    .eq('activo', true)
    .eq('respondio', true)
    .eq('alumnos.colegio_id', colegioId);
  const aniosEmociones = [...new Set(respEmociones?.map(r => String(r.fecha_pregunta).slice(0, 4)))].sort();
  console.log('[respuestas emociones] Años con datos:', aniosEmociones);

  // 3. Meses con datos en 2026 (para AlmaIA)
  const { data: resp2026 } = await client
    .from('alumnos_respuestas_seleccion')
    .select('fecha_pregunta, alumnos!inner(colegio_id)')
    .eq('tipo_concepto', 'Emociones')
    .eq('activo', true)
    .eq('respondio', true)
    .eq('alumnos.colegio_id', colegioId)
    .gte('fecha_pregunta', '2026-01-01')
    .lte('fecha_pregunta', '2026-12-31');
  const meses2026 = [...new Set(resp2026?.map(r => String(r.fecha_pregunta).slice(5, 7)))].sort();
  console.log('[2026] Meses con datos emociones:', meses2026);

  // 4. Patologías - años con datos
  const { data: respPat } = await client
    .from('alumnos_respuestas_seleccion')
    .select('fecha_pregunta, alumnos!inner(colegio_id)')
    .eq('tipo_concepto', 'Patologias')
    .eq('activo', true)
    .eq('respondio', true)
    .eq('alumnos.colegio_id', colegioId);
  const aniosPat = [...new Set(respPat?.map(r => String(r.fecha_pregunta).slice(0, 4)))].sort();
  console.log('[respuestas patologias] Años con datos:', aniosPat);

  // 5. Alertas - años con datos
  const { data: alertas } = await client
    .from('alumnos_alertas')
    .select('fecha_generada, alumnos!inner(colegio_id)')
    .eq('activo', true)
    .eq('alumnos.colegio_id', colegioId);
  const aniosAlertas = [...new Set(alertas?.map(r => String(r.fecha_generada).slice(0, 4)))].sort();
  console.log('[alertas] Años con datos:', aniosAlertas);
  
  console.log('\n--- Conclusión ---');
  console.log('Los filtros deben basarse en fecha_pregunta de las respuestas, NO en ano_escolar de cursos.');
  console.log('Años correctos para mostrar:', aniosEmociones);
}

main().catch(console.error);
