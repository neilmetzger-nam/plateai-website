import { NextRequest, NextResponse } from "next/server";

async function kvGet(key: string): Promise<string | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json() as { result: string | null };
  return data.result;
}

async function kvDel(key: string): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  await fetch(`${url}/del/${encodeURIComponent(key)}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
}

async function sendSMS(to: string, message: string, mediaUrl?: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_PHONE_NUMBER!;
  const params = new URLSearchParams({ To: to, From: from, Body: message });
  if (mediaUrl) params.set("MediaUrl", mediaUrl);
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { "Authorization": "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });
}

export async function POST(req: NextRequest) {
  const { action, phone } = await req.json() as { action: "approve" | "reject"; phone: string };
  const pendingRaw = await kvGet(`plateai:pending:${phone}`);
  if (!pendingRaw) return NextResponse.json({ error: "No pending request" }, { status: 404 });
  const pending = JSON.parse(pendingRaw) as { beforeUrl: string; afterUrl: string; dishName: string };
  await kvDel(`plateai:pending:${phone}`);

  if (action === "approve") {
    await sendSMS(phone, `✨ Here's your enhanced ${pending.dishName}! We hope your customers love it.\n\ngetplateai.com for unlimited enhancements.`, pending.afterUrl);
    return NextResponse.json({ status: "sent", phone, dish: pending.dishName });
  } else {
    await sendSMS(phone, `We're perfecting your ${pending.dishName} — it'll be ready shortly! 🎨`);
    return NextResponse.json({ status: "rejected", phone });
  }
}
