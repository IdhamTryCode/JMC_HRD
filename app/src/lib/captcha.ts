import crypto from "node:crypto";
import { redis } from "./redis";

const CAPTCHA_TTL = 300;

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateCaptchaText(length = 5): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let text = "";
  for (let i = 0; i < length; i++) {
    text += chars[Math.floor(Math.random() * chars.length)];
  }
  return text;
}

function buildSvg(text: string): string {
  const w = 160;
  const h = 60;
  const lines: string[] = [];

  // noise lines
  for (let i = 0; i < 5; i++) {
    lines.push(
      `<line x1="${randomInt(0, w)}" y1="${randomInt(0, h)}" x2="${randomInt(0, w)}" y2="${randomInt(0, h)}" stroke="hsl(${randomInt(0, 360)},50%,70%)" stroke-width="1"/>`
    );
  }

  // noise dots
  for (let i = 0; i < 30; i++) {
    lines.push(
      `<circle cx="${randomInt(0, w)}" cy="${randomInt(0, h)}" r="1.5" fill="hsl(${randomInt(0, 360)},50%,65%)"/>`
    );
  }

  // characters
  for (let i = 0; i < text.length; i++) {
    const x = 18 + i * 27;
    const y = 35 + randomInt(-6, 6);
    const angle = randomInt(-15, 15);
    const hue = randomInt(0, 360);
    lines.push(
      `<text x="${x}" y="${y}" font-family="monospace" font-size="24" font-weight="bold" fill="hsl(${hue},60%,28%)" transform="rotate(${angle} ${x} ${y})">${text[i]}</text>`
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" style="background:#f0f4f8">${lines.join("")}</svg>`;
}

export async function createCaptcha(): Promise<{ id: string; svgDataUrl: string }> {
  const text = generateCaptchaText();
  const id = crypto.randomUUID();
  await redis.set(`captcha:${id}`, text, "EX", CAPTCHA_TTL);
  const svg = buildSvg(text);
  const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  return { id, svgDataUrl };
}

export async function verifyCaptcha(id: string, answer: string): Promise<boolean> {
  const stored = await redis.get(`captcha:${id}`);
  if (!stored) return false;
  await redis.del(`captcha:${id}`);
  return stored.toUpperCase() === answer.toUpperCase();
}
