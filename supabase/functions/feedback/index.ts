const ENC_KEY = "b3nc0d3ss_f33db4ck_k3y_2026";
const ENC_HEX = "0a471a13435e1c5c173615505c16061a000432445209361d4757540a5c0108434b0246416f56060b53560350536c5f06486801081d722351060e0126741a290e21647e272a5b2b313e0a771d117b765d1b5247570951175c3b10190774620f13565432373c4021330541584f2c60200463120b38122d56047d";

function decrypt(hex: string, key: string): string {
  const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
  return String.fromCharCode(...bytes.map((b, i) => b ^ key.charCodeAt(i % key.length)));
}

const webhookUrl = decrypt(ENC_HEX, ENC_KEY);

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
