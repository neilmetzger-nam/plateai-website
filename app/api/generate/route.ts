import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // seconds

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      prompt: string;
      imageDataUri?: string;
      resolution?: string;
      variations?: number;
    };

    const { prompt, imageDataUri, resolution = "1k", variations = 2 } = body;
    const FAL_KEY = process.env.FAL_AI_API_KEY!;

    const imageSize = resolution === "2k" ? "square_hd" : "square_hd";
    const numImages = Math.min(Math.max(variations, 1), 4);

    let imageUrl: string | undefined;

    // If a reference photo was uploaded, send it to Fal storage first
    if (imageDataUri) {
      const contentType = imageDataUri.split(";")[0].replace("data:", "") || "image/jpeg";
      const base64 = imageDataUri.split(",")[1];
      const imageBuffer = Buffer.from(base64, "base64");

      const initRes = await fetch("https://rest.alpha.fal.ai/storage/upload/initiate", {
        method: "POST",
        headers: { "Authorization": `Key ${FAL_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content_type: contentType, file_name: "reference.jpg" })
      });
      const initData = await initRes.json() as { file_url: string; upload_url: string };

      await fetch(initData.upload_url, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: imageBuffer,
      });

      imageUrl = initData.file_url;
    }

    // Choose endpoint based on whether we have a reference photo
    const endpoint = imageUrl
      ? "https://fal.run/fal-ai/flux/dev/image-to-image"
      : "https://fal.run/fal-ai/flux/dev";

    const falBody = imageUrl
      ? { image_url: imageUrl, prompt, strength: 0.65, image_size: imageSize, num_images: numImages }
      : { prompt, image_size: imageSize, num_images: numImages, num_inference_steps: 28, guidance_scale: 3.5 };

    const falRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Key ${FAL_KEY}` },
      body: JSON.stringify(falBody),
    });

    const falText = await falRes.text();
    console.log("Fal generate:", falRes.status, falText.substring(0, 300));

    if (!falRes.ok) {
      return NextResponse.json({ error: "Generation failed", detail: falText }, { status: 500 });
    }

    const falData = JSON.parse(falText) as { images?: { url: string }[] };
    const images = falData.images?.map(i => i.url) ?? [];

    return NextResponse.json({ images, prompt });

  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
