const SUPABASE_URL = "https://bvdcqmybakputxltncio.supabase.co";
const SUPABASE_KEY = "sb_publishable_xDfvu8gFMjMLlIBil3sHTg_wZJPJlzj";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function garantirLogin() {
  const { data } = await db.auth.getSession();
  if (!data.session) await db.auth.signInAnonymously();
}
