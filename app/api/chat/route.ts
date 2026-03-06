import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are PlateAI's food photography assistant. Your job is to help restaurant owners refine AI-generated food photos through conversation.

When a user describes a problem with their image (e.g. "the nori is in the wrong position", "the broth looks too pale", "add more steam"), you:
1. Acknowledge what they want to change
2. Explain what prompt modification will fix it
3. Return a JSON object with the updated prompt additions

Always respond ONLY with valid JSON in this exact format:
{
  "message": "Your conversational reply here",
  "promptAddition": "specific prompt text to add to the generation prompt",
  "creditCost": 1
}

Rules:
- Never add ingredients not in the original ingredient list
- Never suggest changes that would misrepresent the dish
- Keep promptAddition concise and specific (1-2 sentences max)
- If the user asks for something impossible or that would violate accuracy rules, explain why in message and set promptAddition to ""`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "OpenAI error" }, { status: 500 });
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "{}";

  try {
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({
      message: raw,
      promptAddition: "",
      creditCost: 0,
    });
  }
}
