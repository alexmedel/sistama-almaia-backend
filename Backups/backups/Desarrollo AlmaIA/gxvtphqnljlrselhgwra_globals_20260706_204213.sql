--
-- PostgreSQL database cluster dump
--

-- Started on 2026-07-06 20:44:07

\restrict Bra3gK7aBZkcuLpMFAISiOlvp90XRhkmDvWKs2s4qKGxhDFUR2ZPNQUEDr0oJ7q

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE anon;
ALTER ROLE anon WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE authenticated;
ALTER ROLE authenticated WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE authenticator;
ALTER ROLE authenticator WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:JX2m94EM8kYXimEvC7KUpQ==$vERGat1WX36GfAbPPLvagi1Z1XWjn6E10tnbWy8lYJk=:914XtNctZhZXljButbxVQlbstD0IIzKjjC4LCMPyBGY=';
CREATE ROLE dashboard_user;
ALTER ROLE dashboard_user WITH NOSUPERUSER INHERIT CREATEROLE CREATEDB NOLOGIN REPLICATION NOBYPASSRLS;
CREATE ROLE pgbouncer;
ALTER ROLE pgbouncer WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:nh1y0JelUh4jADLV1aNLSQ==$mF+7JfWaoSUSJaOrSlr7ZIdCNbjX+nLpUiLIUo8UUzs=:fqq1Ay6wkHJE6jZGuEIm1GmzJJN9Sx2KTWPvF3W/dHE=';
CREATE ROLE postgres;
ALTER ROLE postgres WITH NOSUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:e5x3YfVqlcsa0tbtccXimA==$CkcNY2PXGN110DER5EnJw0E9am1MBLsMV8UC3+fOiFw=:33UJvH+Fi/Pizz+shgcW4FvmxEoDowY9jKSjHXzIF7E=';
CREATE ROLE service_role;
ALTER ROLE service_role WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION BYPASSRLS;
CREATE ROLE supabase_admin;
ALTER ROLE supabase_admin WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:uLPah+I+TYVWA5X2ejP9OA==$T5kUm5QA6QR0WuxmSNTduwFGts0XD/MflnguRkxALNM=:n56DUldh8CehTbf1+Q/A/ebcP2M5MAKuxjhgN7dqREM=';
CREATE ROLE supabase_auth_admin;
ALTER ROLE supabase_auth_admin WITH NOSUPERUSER NOINHERIT CREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:TJncAy7GiQvUP/vlkmKIbw==$AWzPuTCIEzIIiUty7haW02dLksOImMpVhoSqe+vg8sk=:Uo8TEFOsin6BpoxNZzpWafDNMCPITMjlbtStUVSkrgM=';
CREATE ROLE supabase_read_only_user;
ALTER ROLE supabase_read_only_user WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:10NRrti2nHK1sNVgCpIIfQ==$bgYcMF2NBvpJpkdzaRVb2M5XbO4mrqgPSkCMmaA7Cmg=:FrWWC8pr1vBvhRT8FyZVy6QhRf/bmiVZL7zdBW8yigk=';
CREATE ROLE supabase_realtime_admin;
ALTER ROLE supabase_realtime_admin WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE supabase_replication_admin;
ALTER ROLE supabase_replication_admin WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN REPLICATION NOBYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:Yrw4n0Nd9HZ71suKcBzVLA==$HyXaUPuNXWpWglaGruDiqMEV3dbPRGyWJ+B03VgpGpU=:ZXeaxH6LPflj9X/JZfnXb7TZiNCLdvFTanBld1JO1IQ=';
CREATE ROLE supabase_storage_admin;
ALTER ROLE supabase_storage_admin WITH NOSUPERUSER NOINHERIT CREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:DPWp7fp5vxyWtutJcOVHzg==$WbbBxCmDdOwDBjsukbFFexuxl5YFMFuFul2yrtXTG0w=:WeV/Q7x+T8kgHBLf+pvO0N/trqmmHr6bTYwSv+0b5Vg=';

--
-- User Configurations
--

--
-- User Config "anon"
--

ALTER ROLE anon SET statement_timeout TO '3s';

--
-- User Config "authenticated"
--

ALTER ROLE authenticated SET statement_timeout TO '8s';

--
-- User Config "authenticator"
--

ALTER ROLE authenticator SET session_preload_libraries TO 'safeupdate';
ALTER ROLE authenticator SET statement_timeout TO '8s';
ALTER ROLE authenticator SET lock_timeout TO '8s';

--
-- User Config "postgres"
--

ALTER ROLE postgres SET search_path TO E'\\$user', 'public', 'extensions';

--
-- User Config "supabase_admin"
--

ALTER ROLE supabase_admin SET search_path TO '$user', 'public', 'auth', 'extensions';
ALTER ROLE supabase_admin SET log_statement TO 'none';

--
-- User Config "supabase_auth_admin"
--

ALTER ROLE supabase_auth_admin SET search_path TO 'auth';
ALTER ROLE supabase_auth_admin SET idle_in_transaction_session_timeout TO '60000';
ALTER ROLE supabase_auth_admin SET log_statement TO 'none';

--
-- User Config "supabase_storage_admin"
--

ALTER ROLE supabase_storage_admin SET search_path TO 'storage';
ALTER ROLE supabase_storage_admin SET log_statement TO 'none';


--
-- Role memberships
--

GRANT anon TO authenticator;
GRANT anon TO postgres WITH ADMIN OPTION;
GRANT authenticated TO authenticator;
GRANT authenticated TO postgres WITH ADMIN OPTION;
GRANT authenticator TO postgres WITH ADMIN OPTION;
GRANT authenticator TO supabase_storage_admin;
GRANT pg_monitor TO postgres WITH ADMIN OPTION;
GRANT pg_monitor TO supabase_read_only_user;
GRANT pg_read_all_data TO postgres WITH ADMIN OPTION;
GRANT pg_read_all_data TO supabase_read_only_user;
GRANT pg_signal_backend TO postgres WITH ADMIN OPTION;
GRANT service_role TO authenticator;
GRANT service_role TO postgres WITH ADMIN OPTION;
GRANT supabase_realtime_admin TO postgres;






\unrestrict Bra3gK7aBZkcuLpMFAISiOlvp90XRhkmDvWKs2s4qKGxhDFUR2ZPNQUEDr0oJ7q

-- Completed on 2026-07-06 20:44:10

--
-- PostgreSQL database cluster dump complete
--

