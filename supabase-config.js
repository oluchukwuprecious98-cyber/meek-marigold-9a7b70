const STUDYHUB_SUPABASE_URL =
  "https://fxynvvnmnehisxnmaavu.supabase.co";

const STUDYHUB_SUPABASE_KEY =
  "sb_publishable_LMvTfIBOuOPsms4ADYdMNQ_vvZ3soIU";

window.studyHubSupabase =
  window.supabase.createClient(
    STUDYHUB_SUPABASE_URL,
    STUDYHUB_SUPABASE_KEY
  );