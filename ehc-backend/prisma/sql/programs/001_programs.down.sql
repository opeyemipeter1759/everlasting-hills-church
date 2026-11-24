-- Reverses 001_programs.sql. Drops only what that file created, and only by hand:
-- run it with `prisma db execute`, then delete the row for 20261124130000_programs
-- from _prisma_migrations. Destroys every program, so export them first.
BEGIN;

DROP TABLE IF EXISTS "ProgramEdition";
DROP TABLE IF EXISTS "ProgramSession";
DROP TABLE IF EXISTS "ProgramScripture";
DROP TABLE IF EXISTS "Program";

DROP TYPE IF EXISTS "ProgramAccent";
DROP TYPE IF EXISTS "ProgramScriptureStatus";
DROP TYPE IF EXISTS "ProgramNameStatus";
DROP TYPE IF EXISTS "ProgramDateStatus";
DROP TYPE IF EXISTS "ProgramFormat";
DROP TYPE IF EXISTS "ProgramType";
DROP TYPE IF EXISTS "ProgramCadence";
DROP TYPE IF EXISTS "ProgramStatus";

COMMIT;
