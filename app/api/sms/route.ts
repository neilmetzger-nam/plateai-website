import { NextRequest, NextResponse } from "next/server";

const FREE_LIMIT = 3;

function twimlResponse(message: string, mediaUrl?: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>
    ${mediaUrl ? `<Media>${mediaUrl}</Media>` : ""}
    <Body>${message}</Body>
  </Message>
</Response>`;
}

function xmlReply(twiml: string) {
  return new NextResponse(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

async function kvGet(key: string): Promise<string | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json() as { result: string | null };
  return data.result;
}

async function kvIncr(key: string): Promise<number> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return 1;
  const res = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json() as { result: number };
  return data.result;
}

async function kvSet(key: string, value: string): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  await fetch(`${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function notifyLead(phone: string, type: string) {
  console.log(`LEAD [${type}]: ${phone}`);
  fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "https://getplateai.com"}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, type, timestamp: new Date().toISOString() }),
  }).catch(() => {});
}


async function alertNeil(from: string, beforeUrl: string, afterUrl: string, dishName: string) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT = process.env.NEIL_TELEGRAM_CHAT_ID;
  const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_TOKEN_VAL = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER;

  // Store pending approval in KV
  await kvSet(`plateai:pending:${from}`, JSON.stringify({ beforeUrl, afterUrl, dishName, timestamp: new Date().toISOString() }));

  // 1. Telegram message with before/after
  if (TELEGRAM_TOKEN && TELEGRAM_CHAT) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT,
        text: `📸 *New PlateAI Request*\nCustomer: ${from}\nDish: ${dishName}\n\nBefore: ${beforeUrl}\nAfter: ${afterUrl}\n\nReply *APPROVE ${from}* or *REJECT ${from}*`,
        parse_mode: "Markdown"
      })
    }).catch(() => {});
  }

  // 2. Phone call via Twilio
  if (TWILIO_SID && TWILIO_TOKEN_VAL && TWILIO_FROM) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">Hey Neil, this is Dave. You have a new PlateAI image request from a customer. The dish is ${dishName}. Please check Telegram to approve or reject.</Say></Response>`;
    const body = new URLSearchParams({ To: "+17032972632", From: TWILIO_FROM, Twiml: twiml }).toString();
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Calls.json`, {
      method: "POST",
      headers: { "Authorization": "Basic " + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN_VAL}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
      body
    }).catch(() => {});
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const params = new URLSearchParams(body);

    const from = params.get("From") || "";
    const messageBody = (params.get("Body") || "").trim().toLowerCase();
    const numMedia = params.get("NumMedia") || "0";
    const mediaUrl = params.get("MediaUrl0") || "";

    console.log(`SMS from ${from}: "${messageBody}" (${numMedia} media)`);

    // YES reply handler
    if (numMedia === "0" && (messageBody === "yes" || messageBody === "yes!")) {
      await kvSet(`plateai:intent:${from}`, "signup");
      await notifyLead(from, "wants_signup");
      const paymentLink = "https://getplateai.com/#pricing";
      return xmlReply(twimlResponse(
        `🎉 You're in!\n\nGet unlimited AI food photos for $29/mo:\n${paymentLink}\n\nTakes 2 minutes. Cancel anytime.`
      ));
    }

    // No photo
    if (numMedia === "0") {
      return xmlReply(twimlResponse(
        "Hi! Send us a photo of any dish and we'll enhance it for you. 📸\n\nFree for your first 3 photos."
      ));
    }

    // Rate limiting
    const usageKey = `plateai:usage:${from}`;
    const usageRaw = await kvGet(usageKey);
    const usage = usageRaw ? parseInt(usageRaw) : 0;

    if (usage >= FREE_LIMIT) {
      await notifyLead(from, "limit_hit");
      return xmlReply(twimlResponse(
        `You've used all ${FREE_LIMIT} free enhancements! 🎉\n\nReply YES to unlock unlimited photos for just $29/mo. No contracts, cancel anytime.`
      ));
    }

    const newCount = await kvIncr(usageKey);
    if (newCount === 1) await notifyLead(from, "new_user");
    const remaining = FREE_LIMIT - newCount;

    // Download image from Twilio
    const authHeader = "Basic " + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
    const imageRes = await fetch(mediaUrl, { headers: { Authorization: authHeader } });
    if (!imageRes.ok) return xmlReply(twimlResponse("We're having trouble downloading that photo. Please try again!"));

    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
    const contentType = params.get("MediaContentType0") || "image/jpeg";
    const dataUri = `data:${contentType};base64,${imageBuffer.toString("base64")}`;

    // OpenAI vision analysis
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: `You are a food photography expert. Analyze this restaurant food photo and return JSON only:
{"dishName":"name","cuisine":"type","ingredients":["key ingredients"],"heroDetail":"the most visually appealing element (e.g. glistening glaze, steam, vibrant sauce)"}` },
          { role: "user", content: [{ type: "text", text: "Analyze this food photo." }, { type: "image_url", image_url: { url: dataUri, detail: "low" } }] },
        ],
        temperature: 0.5,
        max_tokens: 500,
      }),
    });

    if (!openaiRes.ok) return xmlReply(twimlResponse("We couldn't identify a dish in that photo. Please send a clear photo of a single menu item."));

    const openaiData = await openaiRes.json() as { choices: { message: { content: string } }[] };
    const rawContent = openaiData.choices?.[0]?.message?.content ?? "{}";

    let analysis: { dishName: string; cuisine: string; enhancementPrompt: string };
    try {
      analysis = JSON.parse(rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
    } catch {
      return xmlReply(twimlResponse("We couldn't identify a dish in that photo. Please send a clear photo of a single menu item."));
    }

    if (!analysis.dishName || !analysis.enhancementPrompt) {
      return xmlReply(twimlResponse("We couldn't identify a dish in that photo. Please send a clear photo of a single menu item."));
    }

    console.log(`Dish: ${analysis.dishName} (${analysis.cuisine})`);

    // Upload to Fal storage
    const FAL_KEY = process.env.FAL_AI_API_KEY!;
    const initRes = await fetch("https://rest.alpha.fal.ai/storage/upload/initiate", {
      method: "POST",
      headers: { "Authorization": `Key ${FAL_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content_type: contentType, file_name: "dish.jpg" })
    });
    const initData = await initRes.json() as { file_url: string; upload_url: string };
    await fetch(initData.upload_url, { method: "PUT", headers: { "Content-Type": contentType }, body: imageBuffer });

    // Enhance with Fal.ai
    // Nano Banana 2 (Google Imagen 3) — keeps the item, enhances the setting
    const falRes = await fetch("https://fal.run/fal-ai/nano-banana-2/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Key ${FAL_KEY}` },
      body: JSON.stringify({
        prompt: `Product hero shot. Keep this exact ${analysis.dishName} unchanged — same item, same ingredients, same presentation. Place it on a clean dark surface with dramatic soft studio lighting from above, rich warm tones, shallow depth of field, beautiful bokeh background. Close up tight on the dish. Commercial menu photography quality. Vibrant colors, appetizing, magazine worthy.`,
        image_urls: [initData.file_url],
        aspect_ratio: "auto"
      }),
    });

    const falText = await falRes.text();
    console.log("Fal response:", falRes.status, falText.substring(0, 200));
    if (!falRes.ok) return xmlReply(twimlResponse("We're having trouble enhancing that photo. Please try again!"));

    let falData: { images?: { url: string; file_name?: string }[] } = {};
    try { falData = JSON.parse(falText); } catch { /* */ }

    const enhancedUrl = falData.images?.[0]?.url;
    if (!enhancedUrl) return xmlReply(twimlResponse("We're having trouble enhancing that photo. Please try again!"));

    // Alert Neil for approval (first 10 customers)
    const totalUsageRaw = await kvGet("plateai:total_processed");
    const totalProcessed = totalUsageRaw ? parseInt(totalUsageRaw) : 0;

    if (totalProcessed < 10) {
      await kvIncr("plateai:total_processed");
      await alertNeil(from, initData.file_url, enhancedUrl, analysis.dishName);
      // Hold — send holding message, delivery happens after Neil approves
      return xmlReply(twimlResponse(`✨ Your ${analysis.dishName} is being enhanced! We'll send it in just a moment. 🎨`));
    }

    // Auto-send after first 10
    const replyMsg = remaining === 0
      ? `✨ Here's your enhanced ${analysis.dishName}!\n\nThat was your last free enhancement. Reply YES for unlimited access — $29/mo, cancel anytime. getplateai.com`
      : `✨ Here's your enhanced ${analysis.dishName}!\n\n${remaining === 1 ? "⚠️ Last free photo!" : `${remaining} free photos left.`} Reply YES to go unlimited for $29/mo.`;

    return xmlReply(twimlResponse(replyMsg, enhancedUrl));

  } catch (error) {
    console.error("SMS webhook error:", error);
    return xmlReply(twimlResponse("We're having trouble enhancing that photo. Please try again!"));
  }
}
