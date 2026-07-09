-- Substitui o snapshot de insights em UMA transação: nunca deixa a tabela vazia se o insert falhar.
create or replace function vm_replace_insights(_rows jsonb)
returns integer language plpgsql security definer as $$
declare n integer;
begin
  delete from vm_viral_insights;
  insert into vm_viral_insights (scope, insight_type, payload)
  select r->>'scope', r->>'insight_type', r->'payload'
  from jsonb_array_elements(_rows) as r;
  get diagnostics n = row_count;
  return n;
end;
$$;
