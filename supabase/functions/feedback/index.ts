const webhookUrl = "https://discord.com/api/webhooks/1473065432880775179/i2kwPxElK6jr-jJiTUrRr4vPmC0m6MFnBYiEbGzTHuoThO5bbdnrkHrFpypFXB9-NG4D";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const BLOCKED_TERMS = ["hitler", "nigga", "nigger", "heil", "nazis", "nazi"];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }
  const name = body?.name?.trim?.() ?? "";
  const message = body?.message?.trim?.() ?? "";

  if (!name || !message) {
    return new Response(JSON.stringify({ error: "Name and message are required." }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }

  if (BLOCKED_TERMS.some((t) => name.toLowerCase().includes(t))) {
    return new Response(JSON.stringify({ error: "Invalid name." }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }

  const safeName = name.slice(0, 256);
  const safeMessage = message.slice(0, 1000);

  const payload = {
    username: "Website Feedback",
    embeds: [{
      title: "New feedback",
      color: 10247679,
      fields: [
        { name: "Name", value: safeName, inline: false },
        { name: "Message", value: safeMessage, inline: false },
      ],
      timestamp: new Date().toISOString(),
    }],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return new Response(JSON.stringify({ error: "Failed to send feedback." }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json", ...corsHeaders } });
});
