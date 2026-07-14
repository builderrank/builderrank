const expectedTables = [
  "reports",
  "purchases",
  "br_businesses",
  "br_job_types",
  "br_competitors",
  "br_prompts",
  "br_prompt_runs",
  "br_ai_mentions",
  "br_ai_sources",
  "br_website_events",
  "br_recommendations",
];

const expectedColumns = [
  ["reports", "business_id"],
  ["reports", "checkout_reference"],
  ["reports", "phone"],
  ["purchases", "checkout_reference"],
  ["purchases", "customer_email"],
  ["br_businesses", "owner_user_id"],
  ["br_businesses", "site_id"],
  ["br_businesses", "phone"],
  ["br_businesses", "beta_intake"],
  ["br_businesses", "tracking_status"],
  ["br_job_types", "profit_weight"],
  ["br_competitors", "website_url"],
  ["br_competitors", "notes"],
  ["br_prompts", "job_type_id"],
  ["br_prompt_runs", "answer_text"],
  ["br_prompt_runs", "completed_at"],
  ["br_ai_mentions", "rank_position"],
  ["br_ai_sources", "source_type"],
  ["br_website_events", "metadata"],
  ["br_website_events", "visitor_hash"],
  ["br_recommendations", "job_type_id"],
  ["br_recommendations", "completed_at"],
];

const expectedIndexes = [
  "reports_user_created_idx",
  "reports_business_created_idx",
  "purchases_checkout_reference_uidx",
  "br_businesses_site_id_idx",
  "br_businesses_owner_idx",
  "br_job_types_business_slug_uidx",
  "br_competitors_business_name_uidx",
  "br_prompts_business_prompt_uidx",
  "br_prompt_runs_prompt_platform_run_at_uidx",
  "br_ai_mentions_run_business_uidx",
  "br_ai_sources_run_domain_url_uidx",
  "br_website_events_site_event_received_idx",
  "br_website_events_site_source_received_idx",
  "br_recommendations_business_status_idx",
];

const expectedPolicies = [
  ["reports", "reports_select_own"],
  ["reports", "reports_insert_own"],
  ["reports", "reports_update_own"],
  ["purchases", "purchases_no_client_access"],
  ["br_businesses", "br_businesses_select_own"],
  ["br_job_types", "br_job_types_select_own"],
  ["br_competitors", "br_competitors_select_own"],
  ["br_prompts", "br_prompts_select_own"],
  ["br_recommendations", "br_recommendations_select_own"],
  ["br_website_events", "br_website_events_no_client_write"],
];

console.log("-- Builder Rank production Supabase schema verification");
console.log("-- Run this after supabase-setup.sql. Any returned row with status = missing is a launch blocker.");
console.log("");
printExpectedTables();
printExpectedColumns();
printExpectedIndexes();
printExpectedPolicies();
console.log("order by check_type, object_name;");

function printExpectedTables() {
  console.log("with expected_tables(table_name) as (");
  console.log(`  values ${expectedTables.map((table) => `('${table}')`).join(",\n         ")}`);
  console.log("),");
}

function printExpectedColumns() {
  console.log("expected_columns(table_name, column_name) as (");
  console.log(`  values ${expectedColumns.map(([table, column]) => `('${table}', '${column}')`).join(",\n         ")}`);
  console.log("),");
}

function printExpectedIndexes() {
  console.log("expected_indexes(index_name) as (");
  console.log(`  values ${expectedIndexes.map((index) => `('${index}')`).join(",\n         ")}`);
  console.log("),");
}

function printExpectedPolicies() {
  console.log("expected_policies(table_name, policy_name) as (");
  console.log(`  values ${expectedPolicies.map(([table, policy]) => `('${table}', '${policy}')`).join(",\n         ")}`);
  console.log(")");
  console.log("select");
  console.log("  'table' as check_type,");
  console.log("  expected_tables.table_name as object_name,");
  console.log("  case when tables.table_name is null then 'missing' else 'ok' end as status");
  console.log("from expected_tables");
  console.log("left join information_schema.tables tables");
  console.log("  on tables.table_schema = 'public' and tables.table_name = expected_tables.table_name");
  console.log("union all");
  console.log("select");
  console.log("  'column' as check_type,");
  console.log("  expected_columns.table_name || '.' || expected_columns.column_name as object_name,");
  console.log("  case when columns.column_name is null then 'missing' else 'ok' end as status");
  console.log("from expected_columns");
  console.log("left join information_schema.columns columns");
  console.log("  on columns.table_schema = 'public'");
  console.log("  and columns.table_name = expected_columns.table_name");
  console.log("  and columns.column_name = expected_columns.column_name");
  console.log("union all");
  console.log("select");
  console.log("  'index' as check_type,");
  console.log("  expected_indexes.index_name as object_name,");
  console.log("  case when indexes.indexname is null then 'missing' else 'ok' end as status");
  console.log("from expected_indexes");
  console.log("left join pg_indexes indexes");
  console.log("  on indexes.schemaname = 'public' and indexes.indexname = expected_indexes.index_name");
  console.log("union all");
  console.log("select");
  console.log("  'policy' as check_type,");
  console.log("  expected_policies.table_name || '.' || expected_policies.policy_name as object_name,");
  console.log("  case when policies.policyname is null then 'missing' else 'ok' end as status");
  console.log("from expected_policies");
  console.log("left join pg_policies policies");
  console.log("  on policies.schemaname = 'public'");
  console.log("  and policies.tablename = expected_policies.table_name");
  console.log("  and policies.policyname = expected_policies.policy_name");
}
