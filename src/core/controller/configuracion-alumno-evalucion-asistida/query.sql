CREATE TYPE estado_asistencia AS ENUM ('asistido', 'mixto', 'no asistido');
alter table alumnos add column asistido estado_asistencia;