-- supabase/migrations/0043_replace_insights_safeupdate.sql
-- vm_replace_insights (0009) nunca tinha sido aplicada neste projeto; ao aplicar em 06/09/2026
-- o ETL caiu em "DELETE requires a WHERE clause": o projeto roda com pg_safeupdate, que barra
-- DELETE sem WHERE mesmo dentro de função security definer. `where true` é a forma canônica de
-- dizer "sim, a tabela inteira" para o guard. Corpo idêntico ao da 0009 fora disso.
create or replace function vm_replace_insights(_rows jsonb)
returns integer language plpgsql security definer as $$
declare n integer;
begin
  delete from vm_viral_insights where true;
  insert into vm_viral_insights (scope, insight_type, payload)
  select r->>'scope', r->>'insight_type', r->'payload'
  from jsonb_array_elements(_rows) as r;
  get diagnostics n = row_count;
  return n;
end;
$$;
