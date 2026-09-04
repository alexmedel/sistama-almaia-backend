import postgres from "postgres";

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

const backup = `informes_generales_backup_${new Date()
  .toISOString()
  .replace(/[-:T]/g, "")
  .slice(0, 14)}_pre_reset_pdf`;

if (!/^informes_generales_backup_[0-9]{14}_pre_reset_pdf$/.test(backup)) {
  throw new Error(`bad backup name: ${backup}`);
}

const before = await sql`
  select
    count(*)::int total,
    count(*) filter (where template_informe is not null and template_informe <> '')::int objetivo,
    count(*) filter (where template_informe is not null and template_informe <> '' and generado = true)::int objetivo_generado_true,
    count(*) filter (where template_informe is not null and template_informe <> '' and nullif(url_reporte, '') is not null)::int objetivo_con_url
  from public.informes_generales
`;

let updated = 0;
await sql.begin(async (tx) => {
  await tx.unsafe(`create table public.${backup} as select * from public.informes_generales`);
  const rows = await tx`
    update public.informes_generales
    set
      generado = false,
      url_reporte = '',
      fecha_actualizacion = now(),
      actualizado_por = 1
    where template_informe is not null
      and template_informe <> ''
    returning informe_id
  `;
  updated = rows.length;
});

const after = await sql`
  select
    count(*) filter (where template_informe is not null and template_informe <> '')::int objetivo,
    count(*) filter (where template_informe is not null and template_informe <> '' and generado = false)::int objetivo_generado_false,
    count(*) filter (where template_informe is not null and template_informe <> '' and url_reporte = '')::int objetivo_url_vacia,
    count(*) filter (where template_informe is not null and template_informe <> '' and generado = true)::int objetivo_generado_true,
    count(*) filter (where template_informe is not null and template_informe <> '' and nullif(url_reporte, '') is not null)::int objetivo_con_url
  from public.informes_generales
`;

console.log(JSON.stringify({ backup, before: before[0], updated, after: after[0] }, null, 2));

await sql.end();
