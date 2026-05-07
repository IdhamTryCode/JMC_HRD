import { NextResponse } from "next/server";
import { createCaptcha } from "@/lib/captcha";

export const dynamic = "force-dynamic";

export async function GET() {
  const { id, svgDataUrl } = await createCaptcha();
  return NextResponse.json({ id, image: svgDataUrl });
}
