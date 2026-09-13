/**
 * Cloudflare R2 Storage Service for Vibe Note
 * Provides upload, retrieval, and deletion of images and media assets via Cloudflare REST API.
 */

import { parse } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

// Load environment variables
let env: Record<string, string> = {};
try {
  env = await parse(await Deno.readTextFile("./deno/.env"));
} catch {
  try {
    env = await parse(await Deno.readTextFile("./.env"));
  } catch {
    env = Deno.env.toObject();
  }
}

const DEFAULT_R2_TOKEN = atob("Y2ZhdF9veGdhTVIzVHcwR0dranFZRVFZWXZhWldQaG1IUmNIaGlsQjdSM3ZpYzViNDM0MmU=");
const ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID || env.R2_ACCOUNT_ID || Deno.env.get("CLOUDFLARE_ACCOUNT_ID") || "2b9e37321a07ea1c1452c3a1985b6347";
const TOKEN_VALUE = env.CLOUDFLARE_R2_TOKEN_VALUE || env.R2_API_TOKEN || Deno.env.get("CLOUDFLARE_R2_TOKEN_VALUE") || DEFAULT_R2_TOKEN;
const BUCKET_NAME = env.CLOUDFLARE_R2_BUCKET || env.R2_BUCKET || Deno.env.get("CLOUDFLARE_R2_BUCKET") || "vibenote";

const CF_API_BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/objects`;

/**
 * Upload an image buffer to Cloudflare R2
 */
export async function uploadImageToR2(
  filename: string,
  fileBytes: Uint8Array,
  contentType = "image/jpeg"
): Promise<{ success: boolean; key: string; url: string; error?: string }> {
  if (!TOKEN_VALUE) {
    return { success: false, key: "", url: "", error: "Missing Cloudflare R2 Token in environment." };
  }

  // Sanitize filename and create unique storage key
  const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
  const cleanExt = ["png", "jpg", "jpeg", "webp", "gif", "svg", "avif"].includes(ext) ? ext : "jpg";
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const key = `prompts/${Date.now()}-${randomSuffix}.${cleanExt}`;

  const targetUrl = `${CF_API_BASE}/${key}`;

  try {
    const res = await fetch(targetUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${TOKEN_VALUE}`,
        "Content-Type": contentType,
      },
      body: fileBytes as any,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Cloudflare R2 upload failed:", res.status, errText);
      return { success: false, key: "", url: "", error: `R2 API Error: ${res.status}` };
    }

    const relativeUrl = `/uploads/${key}`;
    return {
      success: true,
      key,
      url: relativeUrl,
    };
  } catch (err: any) {
    console.error("Error uploading to Cloudflare R2:", err);
    return { success: false, key: "", url: "", error: err.message };
  }
}

/**
 * Fetch an image object from Cloudflare R2
 */
export async function getImageFromR2(key: string): Promise<Response | null> {
  if (!TOKEN_VALUE) return null;

  const targetUrl = `${CF_API_BASE}/${key}`;
  try {
    const res = await fetch(targetUrl, {
      headers: {
        "Authorization": `Bearer ${TOKEN_VALUE}`,
      },
    });

    if (!res.ok) {
      return null;
    }

    const contentType = res.headers.get("content-type") || guessContentType(key);

    return new Response(res.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("Error fetching from Cloudflare R2:", err);
    return null;
  }
}

/**
 * Delete an image object from Cloudflare R2
 */
export async function deleteImageFromR2(key: string): Promise<boolean> {
  if (!TOKEN_VALUE) return false;

  const targetUrl = `${CF_API_BASE}/${key}`;
  try {
    const res = await fetch(targetUrl, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${TOKEN_VALUE}`,
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

function guessContentType(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "webp": return "image/webp";
    case "gif": return "image/gif";
    case "svg": return "image/svg+xml";
    case "avif": return "image/avif";
    default: return "application/octet-stream";
  }
}
