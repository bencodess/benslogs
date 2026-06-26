import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === "GET") {
    const { data: status } = await supabase
      .from("status")
      .select("message, updated_at")
      .order("id", { ascending: true })
      .limit(1)
      .single();

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const { count: weekViews } = await supabase
      .from("page_views")
      .select("*", { count: "exact", head: true })
      .gte("viewed_at", weekStart.toISOString());

    const { count: totalViews } = await supabase
      .from("page_views")
      .select("*", { count: "exact", head: true });

    return new Response(
      JSON.stringify({
        message: status?.message ?? "Available",
        updated_at: status?.updated_at ?? null,
        views_this_week: weekViews ?? 0,
        views_total: totalViews ?? 0,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  if (req.method === "POST") {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { body = {}; }

    if (body.action === "track") {
      const page = typeof body.page === "string" ? body.page.slice(0, 200) : "/";
      await supabase.from("page_views").insert({ page, viewed_at: new Date().toISOString() });
      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const { message } = body;
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Missing message" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const { error } = await supabase
      .from("status")
      .update({ message: message.slice(0, 280), updated_at: new Date().toISOString() })
      .eq("id", 1);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json", ...corsHeaders } });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } });
});
