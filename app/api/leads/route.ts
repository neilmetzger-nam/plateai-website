import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { phone, type, timestamp } = await req.json() as { phone: string; type: string; timestamp: string };
    console.log(`LEAD: ${type} | ${phone} | ${timestamp}`);

    // Email notification via Formspree
    await fetch("https://formspree.io/f/mpqyzprz", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        subject: `PlateAI Lead: ${type}`,
        phone,
        type,
        timestamp,
        message: `New PlateAI SMS lead\nPhone: ${phone}\nType: ${type}\nTime: ${timestamp}`,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Lead notify error:", e);
    return NextResponse.json({ ok: false });
  }
}
