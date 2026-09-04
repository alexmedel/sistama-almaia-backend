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

const noDataMessage = "No existe suficiente información del periodo para generar el informe.";
const backup = `alumnos_informes_backup_${new Date()
  .toISOString()
  .replace(/[-:T]/g, "")
  .slice(0, 14)}_pre_reset_pdf`;

if (!/^alumnos_informes_backup_[0-9]{14}_pre_reset_pdf$/.test(backup)) {
  throw new Error(`bad backup name: ${backup}`);
}

const before = await sql`
  select
    count(*)::int total,
    count(*) filter (where template_informe <> ${noDataMessage})::int objetivo,
    count(*) filter (where template_informe <> ${noDataMessage} and generado = true)::int objetivo_generado_true,
    count(*) filter (where template_informe <> ${noDataMessage} and nullif(url_reporte, '') is not null)::int objetivo_con_url
  from public.alumnos_informes
`;

let updated = 0;
await sql.begin(async (tx) => {
  await tx.unsafe(`create table public.${backup} as select * from public.alumnos_informes`);
  const rows = await tx`
    update public.alumnos_informes
    set
      generado = false,
      url_reporte = '',
      fecha_actualizacion = now(),
      actualizado_por = 1
    where template_informe <> ${noDataMessage}
    returning alumno_informe_id
  `;
  updated = rows.length;
});

const after = await sql`
  select
    count(*) filter (where template_informe <> ${noDataMessage})::int objetivo,
    count(*) filter (where template_informe <> ${noDataMessage} and generado = false)::int objetivo_generado_false,
    count(*) filter (where template_informe <> ${noDataMessage} and url_reporte = '')::int objetivo_url_vacia,
    count(*) filter (where template_informe <> ${noDataMessage} and generado = true)::int objetivo_generado_true,
    count(*) filter (where template_informe <> ${noDataMessage} and nullif(url_reporte, '') is not null)::int objetivo_con_url
  from public.alumnos_informes
`;

console.log(JSON.stringify({ backup, before: before[0], updated, after: after[0] }, null, 2));

await sql.end();
