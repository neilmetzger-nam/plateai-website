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
      return xmlReply(twimlResponse(
        "🎉 Great! Here's your link:\nhttps://getplateai.com\n\nPick a plan and get unlimited enhancements + video + social posts. Takes 2 minutes."
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
        `You've used all ${FREE_LIMIT} free enhancements! 🎉\n\nReply YES to get unlimited enhancements + video + social posts starting at $49/mo.`
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
{"dishName":"name","cuisine":"type","ingredients":["..."],"enhancementPrompt":"Professional food photography of [dish]. Dark background, dramatic side lighting, steam if hot. Photorealistic, restaurant menu quality, 1:1 square."}` },
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
    const falRes = await fetch("https://fal.run/fal-ai/flux/dev/image-to-image", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Key ${FAL_KEY}` },
      body: JSON.stringify({ image_url: initData.file_url, prompt: analysis.enhancementPrompt, strength: 0.65, image_size: "square_hd", num_images: 1 }),
    });

    const falText = await falRes.text();
    console.log("Fal response:", falRes.status, falText.substring(0, 200));
    if (!falRes.ok) return xmlReply(twimlResponse("We're having trouble enhancing that photo. Please try again!"));

    let falData: { images?: { url: string }[] } = {};
    try { falData = JSON.parse(falText); } catch { /* */ }

    const enhancedUrl = falData.images?.[0]?.url;
    if (!enhancedUrl) return xmlReply(twimlResponse("We're having trouble enhancing that photo. Please try again!"));

    const replyMsg = remaining === 0
      ? `✨ Here's your enhanced ${analysis.dishName}!\n\nThat was your last free enhancement. Reply YES for unlimited access at getplateai.com`
      : `✨ Here's your enhanced ${analysis.dishName}!\n\n${remaining} free enhancement${remaining === 1 ? "" : "s"} left. getplateai.com for unlimited.`;

    return xmlReply(twimlResponse(replyMsg, enhancedUrl));

  } catch (error) {
    console.error("SMS webhook error:", error);
    return xmlReply(twimlResponse("We're having trouble enhancing that photo. Please try again!"));
  }
}
