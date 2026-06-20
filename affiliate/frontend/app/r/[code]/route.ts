// FYON referral entry point.  Goes at:  fyon-web/app/r/[code]/route.ts
// Visiting https://www.fyon.com/r/SIGMA57575757 sets a 60-day first-party
// cookie, logs the click, and forwards into the site. Read `fyon_ref` at
// signup and POST it to /affiliate/attribute, and pass it to Stripe Checkout
// as `client_reference_id` so the sale is credited even cross-device.

import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const COOKIE = "fyon_ref";
const MAX_AGE = 60 * 60 * 24 * 60; // 60 days

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const code = (params.code || "").toUpperCase().slice(0, 24);

  // forward to the homepage (or a landing page) — keep ?ref for transparency
  const url = new URL("/", req.url);
  if (code) url.searchParams.set("ref", code);
  const res = NextResponse.redirect(url);

  if (code) {
    res.cookies.set(COOKIE, code, {
      maxAge: MAX_AGE, path: "/", sameSite: "lax", secure: true,
    });
    // fire-and-forget click log (never block the redirect)
    fetch(`${API}/affiliate/track`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": req.headers.get("x-forwarded-for") || "" },
      body: JSON.stringify({ code, landing_path: "/", visitor_id: req.cookies.get("fyon_vid")?.value || null }),
    }).catch(() => {});
  }
  return res;
}
