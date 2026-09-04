# Emociones Top Diagnosticos Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir `/api/v1/comparativa/emociones/top-diagnosticos` para que filtre por `emociones.conotacion` como fuente de verdad, deje de mentir con emociones positivas marcadas como negativas, y optimice acceso SQL para colegio/fecha/top.

**Architecture:** Mantener conteos de respuestas por tono (`peso`) pero separar ese concepto de la connotación maestra de la emoción. Introducir una capa de mapeo explícita entre `diagnostico` y `emociones`, crear una RPC nueva con nombre semánticamente correcto, y migrar endpoint a esa RPC sin romper otros consumidores de la función vieja.

**Tech Stack:** Node.js, Express, TypeScript, Supabase, PostgreSQL RPC, Jest.

---

## File Map

- Modify: `src/infrestructure/server/dashboard/dashboardEmocionesService.ts`
- Modify: `src/routes/comparativa.routes.ts`
- Modify: `tests/getAlumnoDetalle.comparativa.test.ts`
- Create: `tests/DashboardEmocionesService.topDiagnosticos.test.ts`
- Create: `docs/sql/2026-06-10_top_diagnosticos_por_connotacion_emocion.sql`
- Create: `docs/sql/2026-06-10_top_diagnosticos_por_connotacion_emocion_indexes.sql`
- Optional future hardening: `src/infrestructure/server/alumno/funciones/emocionesComparativa.ts` if normalizer gets extracted to shared helper

## Scope Decisions

- Source of truth for `conotacion` of an emotion: `public.emociones.conotacion`
- Source of truth for response tone buckets: `respuestas_posibles_has_preguntas.peso`
- Endpoint field naming must stop conflating both concepts. Preferred response field:
  - `conotacion_emocion`
- Backward-compatibility option if frontend frozen:
  - keep `conotacion` but now populate it from `emociones.conotacion`
- Do **not** mutate old RPC `top_diagnosticos_por_respuesta` until all consumers audited
- Unmapped synthetic diagnosticos like `Balance Año` / `Balance Mes` must be explicitly excluded from endpoint unless product says otherwise

## Known Data Issues To Handle

- `Calma` exists in `diagnostico`, but master emotion appears as `Tranquilidad`
- `Enojo/Rabia` exists in `diagnostico`, but master emotion appears as `Enojo`
- `Balance Año` and `Balance Mes` are in `diagnostico` category `Emoción`, but are not rows in `emociones`
- Current RPC classifies by `peso`:
  - `0 -> Positiva`
  - `1 -> Neutra`
  - `2 -> Negativa`
  That is valid for response-tone counters, not for emotion master classification

### Task 1: Lock Correct Contract With Tests

**Files:**
- Modify: `tests/getAlumnoDetalle.comparativa.test.ts`
- Create: `tests/DashboardEmocionesService.topDiagnosticos.test.ts`

- [ ] **Step 1: Extend existing normalization coverage to lock master-emotion semantics**

Add cases proving alias diagnostics resolve to master emotions by connotation:

```ts
it("normaliza alias emocionales hacia connotacion maestra", async () => {
  const respuestas = [
    { alumno_id: 1611, alumnos: { colegio_id: 0 }, preguntas: { diagnostico: "Calma" } },
    { alumno_id: 1611, alumnos: { colegio_id: 0 }, preguntas: { diagnostico: "Enojo/Rabia" } },
  ];
  const emociones = [
    { nombre: "Tranquilidad", conotacion: "Positiva" },
    { nombre: "Enojo", conotacion: "Negativa" },
  ];
  // expect Positiva + Negativa, never empty / mismatched
});
```

- [ ] **Step 2: Add service-level failing tests for endpoint semantics**

Create a focused service test file that mocks `client.rpc` and asserts:

```ts
it("rechaza respuesta con conotacion calculada por peso como si fuera connotacion de emocion", async () => {
  const rpcRows = [
    {
      diagnostico: "Alegría",
      conotacion_emocion: "Positiva",
      respuestas_positivas: 0,
      respuestas_neutras: 0,
      respuestas_negativas: 3,
    },
  ];

  // expect payload to preserve Positiva as emotion master connotation
});
```

- [ ] **Step 3: Add validation tests for query param contract**

Cover:
- `tipo=negativo`
- `tipo=positivo`
- `tipo=neutro` if enabled in API contract
- invalid `tipo`

Use explicit expectations like:

```ts
expect(FormatResponse).toHaveBeenCalledWith(
  expect.anything(),
  400,
  "Tipo requerido: 'negativo', 'positivo' o 'neutro'"
);
```

- [ ] **Step 4: Run focused tests and confirm initial failures**

Run:

```bash
npm test -- --runInBand tests/getAlumnoDetalle.comparativa.test.ts tests/DashboardEmocionesService.topDiagnosticos.test.ts
```

Expected:
- existing comparativa tests still pass or expose alias gaps
- new top-diagnosticos tests fail against current implementation

- [ ] **Step 5: Commit test scaffolding**

```bash
git add tests/getAlumnoDetalle.comparativa.test.ts tests/DashboardEmocionesService.topDiagnosticos.test.ts
git commit -m "test: lock emociones top diagnosticos contract"
```

### Task 2: Design Explicit Data Mapping In SQL

**Files:**
- Create: `docs/sql/2026-06-10_top_diagnosticos_por_connotacion_emocion.sql`

- [ ] **Step 1: Replace text-guessing with explicit diagnostic-to-emotion mapping design**

Write SQL proposal for a mapping relation. Minimal structure:

```sql
create table if not exists public.diagnostico_emocion_map (
  diagnostico_id integer primary key references public.diagnostico(diagnostico_id),
  emocion_id integer not null references public.emociones(emocion_id),
  activo boolean not null default true,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);
```

Rationale:
- `diagnostico` already drives colors
- `emociones` already drives master connotation
- map table resolves aliases and synthetic names explicitly

- [ ] **Step 2: Seed current known aliases and direct matches**

Seed script must include at least:

```sql
insert into public.diagnostico_emocion_map (diagnostico_id, emocion_id)
select d.diagnostico_id, e.emocion_id
from public.diagnostico d
join public.emociones e
  on lower(translate(d.subcategoria,'áéíóúÁÉÍÓÚ','aeiouaeiou'))
   = lower(translate(e.nombre,'áéíóúÁÉÍÓÚ','aeiouaeiou'))
where d.categoria = 'Emoción'
  and d.activo is true
  and e.activo is true
on conflict (diagnostico_id) do nothing;
```

Then add explicit alias patches:

```sql
-- Calma -> Tranquilidad
-- Enojo/Rabia -> Enojo
```

- [ ] **Step 3: Decide policy for synthetic diagnosticos**

Document one of these options in SQL comments and PR notes:
- exclude `Balance Año` / `Balance Mes` from endpoint
- or create master rows in `emociones`

Recommended now:
- exclude unmapped rows from endpoint

- [ ] **Step 4: Define new RPC with clear semantics**

Create `public.top_diagnosticos_por_connotacion_emocion(...)` with output like:

```sql
returns table (
  diagnostico text,
  conotacion_emocion text,
  total_respuestas bigint,
  respuestas_positivas bigint,
  respuestas_neutras bigint,
  respuestas_negativas bigint,
  cantidad_preguntas bigint
)
```

Core query shape:

```sql
with respuestas_base as (
  select
    d.subcategoria::text as diagnostico,
    e.conotacion as conotacion_emocion,
    case
      when r.peso = 0 then 'Positiva'
      when r.peso = 1 then 'Neutra'
      when r.peso = 2 then 'Negativa'
      else 'Sin clasificar'
    end as tono_respuesta,
    r.peso,
    p.pregunta_id
  from public.alumnos_respuestas_seleccion ars
  join public.alumnos a on a.alumno_id = ars.alumno_id
  join public.preguntas p on p.pregunta_id = ars.pregunta_id
  join public.diagnostico d on d.subcategoria = p.diagnostico and d.activo is true
  join public.diagnostico_emocion_map dem on dem.diagnostico_id = d.diagnostico_id and dem.activo is true
  join public.emociones e on e.emocion_id = dem.emocion_id and e.activo is true
  join public.respuestas_posibles_has_preguntas r
    on r.pregunta_id = ars.pregunta_id
   and r.respuesta_posible_id = ars.respuesta_posible_id
   and r.activo is true
  where ars.respondio is true
    and ars.activo is true
    and ars.tipo_concepto = 'Emociones'
    and p.tipo_concepto = 'Emociones'
    and ars.fecha_pregunta <= p_fecha
    and (p_colegio_id is null or a.colegio_id = p_colegio_id)
)
select ...
where conotacion_emocion = any(p_conotaciones)
group by diagnostico, conotacion_emocion
order by count(*) desc
limit p_limit;
```

- [ ] **Step 5: Verify SQL semantics against real data**

Run verification queries after creating function:

```sql
select *
from public.top_diagnosticos_por_connotacion_emocion(
  10,
  array['Negativa'],
  current_date,
  0
);
```

Expected:
- `Alegría` never returns with negative master connotation
- `Calma` only appears if explicitly mapped to `Tranquilidad`
- unmapped synthetic rows do not appear

- [ ] **Step 6: Commit SQL design artifacts**

```bash
git add docs/sql/2026-06-10_top_diagnosticos_por_connotacion_emocion.sql
git commit -m "docs: define emotion connotation rpc design"
```

### Task 3: Optimize Query Paths Before Switching Endpoint

**Files:**
- Create: `docs/sql/2026-06-10_top_diagnosticos_por_connotacion_emocion_indexes.sql`

- [ ] **Step 1: Add candidate indexes for filtered emotional response scans**

Document and apply candidate partial index:

```sql
create index concurrently if not exists idx_ars_emociones_top_diag
on public.alumnos_respuestas_seleccion (fecha_pregunta, alumno_id, pregunta_id, respuesta_posible_id)
where activo is true
  and respondio is true
  and tipo_concepto = 'Emociones';
```

Reason:
- current query always filters on `activo`, `respondio`, `tipo_concepto`, `fecha_pregunta`
- existing indexes start with `alumno_id`, less useful for date-driven top query

- [ ] **Step 2: Add join-support index for colegio filter**

```sql
create index concurrently if not exists idx_alumnos_activo_colegio_alumno
on public.alumnos (colegio_id, alumno_id)
where activo is true;
```

Reason:
- current plan must filter by optional `colegio_id`
- only `alumnos_pkey` exists now

- [ ] **Step 3: Keep mapping join cheap**

If `diagnostico_emocion_map` is created, add:

```sql
create unique index if not exists idx_dem_diagnostico
on public.diagnostico_emocion_map (diagnostico_id);
```

No functional index on normalized text if map table exists. Avoid per-row `lower(translate(...))` join cost in hot path.

- [ ] **Step 4: Capture explain plans before and after**

Run:

```sql
explain (analyze, buffers)
select *
from public.top_diagnosticos_por_connotacion_emocion(
  5,
  array['Negativa'],
  current_date,
  0
);
```

Success criteria:
- no seq scan on whole `alumnos_respuestas_seleccion` for common filtered case
- row counts shrink early on partial index path
- join cardinality stable

- [ ] **Step 5: Commit performance SQL artifacts**

```bash
git add docs/sql/2026-06-10_top_diagnosticos_por_connotacion_emocion_indexes.sql
git commit -m "docs: add emotion top diagnosticos index plan"
```

### Task 4: Switch Backend Endpoint To Correct RPC

**Files:**
- Modify: `src/infrestructure/server/dashboard/dashboardEmocionesService.ts`
- Modify: `src/routes/comparativa.routes.ts`

- [ ] **Step 1: Update request contract in service**

Change mapping:

```ts
const conotaciones =
  tipo === "negativo"
    ? ["Negativa"]
    : tipo === "positivo"
      ? ["Positiva"]
      : ["Neutra"];
```

Also update validation message if `neutro` will be supported.

- [ ] **Step 2: Call new RPC with semantically correct name**

Replace:

```ts
"top_diagnosticos_por_respuesta"
```

With:

```ts
"top_diagnosticos_por_connotacion_emocion"
```

- [ ] **Step 3: Keep response counters but fix connotation field**

Preferred payload:

```ts
const mappedData: IEmotionBarChart[] = data.map((item: any) => ({
  nombre: item.diagnostico,
  positivos: item.respuestas_positivas,
  negativos: item.respuestas_negativas,
  neutrales: item.respuestas_neutras,
  conotacion: item.conotacion_emocion,
}));
```

If frontend can change now, rename interface field to `conotacion_emocion`.

- [ ] **Step 4: Fix Swagger docs to match new semantics**

Update route description from:
- "tipo negativo = Negativa/Neutra"

To:
- "tipo negativo = emociones con connotacion maestra Negativa"

And describe counters as response-tone buckets, not emotion-type buckets.

- [ ] **Step 5: Run focused tests**

```bash
npm test -- --runInBand tests/DashboardEmocionesService.topDiagnosticos.test.ts tests/getAlumnoDetalle.comparativa.test.ts
```

Expected:
- all green
- no assertion expecting `Alegría` as negative master connotation

- [ ] **Step 6: Commit backend switch**

```bash
git add src/infrestructure/server/dashboard/dashboardEmocionesService.ts src/routes/comparativa.routes.ts tests/DashboardEmocionesService.topDiagnosticos.test.ts tests/getAlumnoDetalle.comparativa.test.ts
git commit -m "fix: use master emotion connotation in top diagnosticos"
```

### Task 5: Verify End-To-End Against Real Database

**Files:**
- No new files required unless capturing results in PR notes

- [ ] **Step 1: Run real SQL verification**

Check negative set:

```sql
select *
from public.top_diagnosticos_por_connotacion_emocion(5, array['Negativa'], current_date, 0);
```

Check positive set:

```sql
select *
from public.top_diagnosticos_por_connotacion_emocion(5, array['Positiva'], current_date, 0);
```

- [ ] **Step 2: Run HTTP verification locally**

```bash
curl "http://localhost:3001/api/v1/comparativa/emociones/top-diagnosticos?colegio_id=0&tipo=negativo"
curl "http://localhost:3001/api/v1/comparativa/emociones/top-diagnosticos?colegio_id=0&tipo=positivo"
```

Expected negative response:
- no `Alegría`
- no `Aceptación`
- no `Gratitud`

Expected positive response:
- may include `Alegría`, `Aceptación`, `Gratitud`
- `conotacion` always `Positiva`

- [ ] **Step 3: Regression-check old behavior consumers**

Search and validate no other code assumes:
- `tipo=negativo` means `Negativa + Neutra`
- `conotacion` mirrors response `peso`

Run:

```bash
rg -n "top_diagnosticos_por_respuesta|top-diagnosticos|conotacion" src tests
```

- [ ] **Step 4: Final verification**

Run:

```bash
npm test -- --runInBand
```

If full suite too expensive, at least run:

```bash
npm test -- --runInBand tests/DashboardEmocionesService.topDiagnosticos.test.ts tests/getAlumnoDetalle.comparativa.test.ts
```

- [ ] **Step 5: Commit verification notes**

```bash
git add .
git commit -m "test: verify emociones top diagnosticos fix"
```

## Open Questions To Resolve Before Execution

1. Should API support `tipo=neutro` explicitly? Recommended: yes.
2. Should `Balance Año` and `Balance Mes` be excluded or promoted into `emociones` master catalog? Recommended now: exclude.
3. Can response field be renamed to `conotacion_emocion` without breaking frontend? Recommended: yes if coordinated; else preserve `conotacion` but document semantics.
4. Should old RPC be left intact for backward compatibility? Recommended: yes, deprecate later.

## Success Criteria

- `Alegría`, `Aceptación`, `Gratitud` never appear as `Negativa` master connotation
- endpoint filters by `emociones.conotacion`, not by `peso`
- response counters still expose positive/neutral/negative answer distribution
- query path avoids broad scans and is explain-verified
- alias diagnostics are resolved explicitly, not by accidental text coincidence

