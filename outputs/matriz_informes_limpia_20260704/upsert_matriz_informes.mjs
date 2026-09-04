import fs from "node:fs/promises";
import postgres from "postgres";

const payloadPath = "C:/Users/USER/Documents/BE-Almaia/outputs/matriz_informes_limpia_20260704/matriz_payload.json";

const payload = JSON.parse(await fs.readFile(payloadPath, "utf8"));
const rows = [];
for (const [sheetName, data] of Object.entries(payload)) {
  const idx = Object.fromEntries(data.columns.map((column, index) => [column, index]));
  for (const row of data.rows) {
    rows.push({
      codigo_informe: row[idx.codigo_informe],
      nombre_informe: row[idx.nombre_informe],
      nombre_fisico: row[idx.nombre_fisico],
      descripcion_informe: row[idx.descripcion_informe],
      emocion: row[idx.emocion],
      primera_patologia: row[idx.primera_patologia],
      segunda_patologia: row[idx.segunda_patologia],
      variante: row[idx.variante],
      creado_por: row[idx.creado_por] ?? 0,
      actualizado_por: row[idx.actualizado_por] ?? 0,
      activo: true,
      recomendacion_almaia: row[idx.recomendacion_almaia],
      ambitos: row[idx.ambitos] ?? sheetName,
    });
  }
}

const seen = new Set();
for (const row of rows) {
  if (!row.codigo_informe) throw new Error("codigo_informe vacio");
  if (!row.nombre_fisico) throw new Error(`nombre_fisico vacio: ${row.codigo_informe}`);
  if (seen.has(row.codigo_informe)) throw new Error(`codigo_informe duplicado en payload: ${row.codigo_informe}`);
  seen.add(row.codigo_informe);
}

const backup = `matriz_informes_backup_${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)}_pre_upsert_limpio`;
if (!/^matriz_informes_backup_[0-9]{14}_pre_upsert_limpio$/.test(backup)) {
  throw new Error(`bad backup name: ${backup}`);
}

const sql = postgres({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: "require",
  max: 1,
  connect_timeout: 10,
});

const before = await sql`
  select
    count(*)::int total,
    count(*) filter (where activo = true)::int activos
  from public.matriz_informes
`;

let result;
await sql.begin(async (tx) => {
  await tx.unsafe(`create table public.${backup} as select * from public.matriz_informes`);

  await tx`
    create temporary table staging_matriz_informes_limpia (
      codigo_informe text primary key,
      nombre_informe text not null,
      nombre_fisico text not null,
      descripcion_informe text not null,
      emocion text,
      primera_patologia text,
      segunda_patologia text,
      variante bigint,
      creado_por bigint not null,
      actualizado_por bigint not null,
      activo boolean not null,
      recomendacion_almaia text,
      ambitos text
    ) on commit drop
  `;

  const batchSize = 250;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize).map((row) => [
      row.codigo_informe,
      row.nombre_informe,
      row.nombre_fisico,
      row.descripcion_informe,
      row.emocion,
      row.primera_patologia,
      row.segunda_patologia,
      row.variante,
      row.creado_por,
      row.actualizado_por,
      row.activo,
      row.recomendacion_almaia,
      row.ambitos,
    ]);
    await tx`
      insert into staging_matriz_informes_limpia (
        codigo_informe, nombre_informe, nombre_fisico, descripcion_informe,
        emocion, primera_patologia, segunda_patologia, variante,
        creado_por, actualizado_por, activo, recomendacion_almaia, ambitos
      )
      values ${tx(batch)}
    `;
  }

  await tx`
    update public.matriz_informes
    set activo = false,
        fecha_actualizacion = default
    where activo is distinct from false
  `;

  const upserted = await tx`
    with max_id as (
      select coalesce(max(matriz_informe_id), 0) as base_id
      from public.matriz_informes
    ),
    staged as (
      select
        s.*,
        mi.matriz_informe_id as existing_id,
        row_number() over (order by s.codigo_informe) as rn
      from staging_matriz_informes_limpia s
      left join public.matriz_informes mi
        on mi.codigo_informe = s.codigo_informe
    ),
    upsert as (
      insert into public.matriz_informes (
        matriz_informe_id,
        codigo_informe,
        nombre_informe,
        nombre_fisico,
        descripcion_informe,
        emocion,
        primera_patologia,
        segunda_patologia,
        variante,
        creado_por,
        actualizado_por,
        activo,
        recomendacion_almaia,
        ambitos
      )
      select
        coalesce(staged.existing_id, max_id.base_id + staged.rn),
        staged.codigo_informe,
        staged.nombre_informe,
        staged.nombre_fisico,
        staged.descripcion_informe,
        staged.emocion,
        staged.primera_patologia,
        staged.segunda_patologia,
        staged.variante,
        staged.creado_por,
        staged.actualizado_por,
        true,
        staged.recomendacion_almaia,
        staged.ambitos
      from staged
      cross join max_id
      on conflict (codigo_informe) do update
      set
        nombre_informe = excluded.nombre_informe,
        nombre_fisico = excluded.nombre_fisico,
        descripcion_informe = excluded.descripcion_informe,
        emocion = excluded.emocion,
        primera_patologia = excluded.primera_patologia,
        segunda_patologia = excluded.segunda_patologia,
        variante = excluded.variante,
        fecha_actualizacion = default,
        actualizado_por = excluded.actualizado_por,
        activo = true,
        recomendacion_almaia = excluded.recomendacion_almaia,
        ambitos = excluded.ambitos
      returning (xmax = 0) as inserted
    )
    select
      count(*)::int total_upserted,
      count(*) filter (where inserted)::int inserted,
      count(*) filter (where not inserted)::int updated
    from upsert
  `;
  result = upserted[0];
});

const after = await sql`
  select
    count(*)::int total,
    count(*) filter (where activo = true)::int activos,
    count(*) filter (where activo = true and ambitos = 'Alumno')::int activas_alumno,
    count(*) filter (where activo = true and ambitos = 'Curso')::int activas_curso,
    count(*) filter (where activo = true and ambitos = 'Nivel')::int activas_nivel,
    count(*) filter (where activo = true and ambitos = 'Colegio')::int activas_colegio,
    count(*) filter (where activo = true and nullif(trim(descripcion_informe), '') is null)::int sin_descripcion,
    count(*) filter (where activo = true and nullif(trim(recomendacion_almaia), '') is null)::int sin_recomendacion
  from public.matriz_informes
`;

const dupCodigo = await sql`
  select codigo_informe, count(*)::int total
  from public.matriz_informes
  where activo = true
  group by codigo_informe
  having count(*) > 1
`;
const dupFisico = await sql`
  select nombre_fisico, count(*)::int total
  from public.matriz_informes
  where activo = true
  group by nombre_fisico
  having count(*) > 1
`;

console.log(JSON.stringify({
  backup,
  payload_rows: rows.length,
  before: before[0],
  upsert: result,
  after: after[0],
  duplicate_codigo_informe: dupCodigo.length,
  duplicate_nombre_fisico: dupFisico.length,
}, null, 2));

await sql.end();
