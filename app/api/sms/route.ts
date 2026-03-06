import { NextRequest, NextResponse } from "next/server";

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const params = new URLSearchParams(body);

    const from = params.get("From") || "";
    const messageBody = params.get("Body") || "";
    const numMedia = params.get("NumMedia") || "0";
    const mediaUrl = params.get("MediaUrl0") || "";

    console.log(`SMS from ${from}: "${messageBody}" (${numMedia} media)`);

    // No photo attached — send instructions
    if (numMedia === "0") {
      return xmlReply(
        twimlResponse(
          "Hi! Send us a photo of your dish and we'll enhance it for you. 📸"
        )
      );
    }

    // Step 1 — Download the image from Twilio with Basic Auth
    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    const authHeader =
      "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const imageRes = await fetch(mediaUrl, {
      headers: { Authorization: authHeader },
    });

    if (!imageRes.ok) {
      console.error("Failed to download Twilio image:", imageRes.status);
      return xmlReply(
        twimlResponse(
          "We're having trouble downloading that photo. Please try again!"
        )
      );
    }

    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
    const base64Image = imageBuffer.toString("base64");
    const contentType =
      params.get("MediaContentType0") || "image/jpeg";
    const dataUri = `data:${contentType};base64,${base64Image}`;

    // Step 2 — Analyze with OpenAI Vision
    const openaiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a food photography expert. Analyze this restaurant food photo and return a JSON object with:
{
  "dishName": "detected dish name",
  "cuisine": "cuisine type",
  "ingredients": ["list", "of", "visible", "ingredients"],
  "enhancementPrompt": "Professional food photography of [dish]. [describe ideal enhanced version with proper lighting, plating, colors]. Dark background, dramatic side lighting, steam if hot dish. Photorealistic, restaurant menu quality, 1:1 square."
}
Return only valid JSON.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text:
                    messageBody.trim() ||
                    "Analyze this food photo and provide an enhancement prompt.",
                },
                {
                  type: "image_url",
                  image_url: { url: dataUri, detail: "low" },
                },
              ],
            },
          ],
          temperature: 0.5,
          max_tokens: 500,
        }),
      }
    );

    if (!openaiRes.ok) {
      console.error("OpenAI Vision error:", openaiRes.status);
      return xmlReply(
        twimlResponse(
          "We couldn't identify a dish in that photo. Please send a clear photo of a single menu item."
        )
      );
    }

    const openaiData = await openaiRes.json();
    const rawContent =
      openaiData.choices?.[0]?.message?.content ?? "{}";

    let analysis: {
      dishName: string;
      cuisine: string;
      ingredients: string[];
      enhancementPrompt: string;
    };

    try {
      const cleaned = rawContent
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      analysis = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse OpenAI response:", rawContent);
      return xmlReply(
        twimlResponse(
          "We couldn't identify a dish in that photo. Please send a clear photo of a single menu item."
        )
      );
    }

    if (!analysis.dishName || !analysis.enhancementPrompt) {
      return xmlReply(
        twimlResponse(
          "We couldn't identify a dish in that photo. Please send a clear photo of a single menu item."
        )
      );
    }

    console.log(`Detected dish: ${analysis.dishName} (${analysis.cuisine})`);

    // Step 3 — Enhance with Fal.ai
    const falRes = await fetch(
      "https://queue.fal.run/fal-ai/flux/dev/image-to-image",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Key ${process.env.FAL_AI_API_KEY}`,
        },
        body: JSON.stringify({
          image_url: dataUri,
          prompt: analysis.enhancementPrompt,
          strength: 0.65,
          image_size: "square_hd",
          num_images: 1,
        }),
      }
    );

    if (!falRes.ok) {
      console.error("Fal.ai error:", falRes.status);
      return xmlReply(
        twimlResponse(
          "We're having trouble enhancing that photo. Please try again!"
        )
      );
    }

    const falData = await falRes.json();
    const enhancedImageUrl = falData.images?.[0]?.url;

    if (!enhancedImageUrl) {
      console.error("No image in Fal.ai response:", falData);
      return xmlReply(
        twimlResponse(
          "We're having trouble enhancing that photo. Please try again!"
        )
      );
    }

    // Step 4 — Reply with enhanced image
    return xmlReply(
      twimlResponse(
        `✨ Here's your enhanced photo for ${analysis.dishName}! Reply with another photo to enhance more, or visit getplateai.com to see all our features.`,
        enhancedImageUrl
      )
    );
  } catch (error) {
    console.error("SMS webhook error:", error);
    return xmlReply(
      twimlResponse(
        "We're having trouble enhancing that photo. Please try again!"
      )
    );
  }
}
