import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req: Request) => {
  if (req.method === "GET") {
    const { data } = await supabase
      .from("status")
      .select("message, updated_at")
      .order("id", { ascending: true })
      .limit(1)
      .single();

    return new Response(
      JSON.stringify({ message: data?.message ?? "Available", updated_at: data?.updated_at ?? null }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
    );
  }

  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method === "POST") {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response("Unauthorized", { status: 401 });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response("Unauthorized", { status: 401 });

    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return new Response("Missing message", { status: 400 });
    }

    const { error } = await supabase
      .from("status")
      .update({ message: message.slice(0, 280), updated_at: new Date().toISOString() })
      .eq("id", 1);

    if (error) throw error;
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  }

  return new Response("Method not allowed", { status: 405 });
});
