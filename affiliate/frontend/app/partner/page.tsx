"use client";
// FYON Partner Dashboard.  Goes at:  fyon-web/app/partner/page.tsx
// Mirrors the reference dashboard (link + coupon, Connect Stripe, tiers,
// earnings, leaderboard) in FYON's style. Talks to the /affiliate/* backend.
//
// AUTH: replace `authHeaders()` with your real session/JWT. The backend's
// current_user_id() reads `x-fyon-user` in the shim — keep them in sync.

import { useEffect, useState, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const usd = (c: number) => "$" + (c / 100).toFixed(2);

const TIERS = [
  { name: "Starter",  rate: 15, need: 0,       blurb: "Starting tier" },
  { name: "Bronze",   rate: 17, need: 10000,   blurb: "$100 in referral revenue" },
  { name: "Silver",   rate: 18, need: 25000,   blurb: "$250 in referral revenue" },
  { name: "Gold",     rate: 20, need: 50000,   blurb: "$500 in referral revenue" },
  { name: "Platinum", rate: 22, need: 100000,  blurb: "$1.0k in referral revenue" },
  { name: "Diamond",  rate: 24, need: 250000,  blurb: "$2.5k in referral revenue" },
  { name: "Elite",    rate: 26, need: 500000,  blurb: "$5k in referral revenue" },
  { name: "Champion", rate: 28, need: 1000000, blurb: "$10k in referral revenue" },
  { name: "Legend",   rate: 30, need: 2500000, blurb: "$25k in referral revenue" },
];

function authHeaders(): HeadersInit {
  // TODO: real auth. Demo shim — send the current user id the backend expects.
  const uid = typeof window !== "undefined" ? localStorage.getItem("fyon_uid") || "demo-user" : "demo-user";
  return { "content-type": "application/json", "x-fyon-user": uid };
}

type Me = any;

export default function PartnerPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [board, setBoard] = useState<{ name: string; month_cents: number }[]>([]);
  const [tab, setTab] = useState<"overview" | "links" | "referrals" | "earnings">("overview");
  const [copied, setCopied] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`${API}/affiliate/me`, { headers: authHeaders() });
    const d = await r.json();
    if (!d.enrolled) {
      await fetch(`${API}/affiliate/enroll`, { method: "POST", headers: authHeaders() });
      return load();
    }
    setMe(d);
    fetch(`${API}/affiliate/leaderboard`).then(x => x.json()).then(x => setBoard(x.top || [])).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const copy = (t: string, what: string) => { navigator.clipboard.writeText(t); setCopied(what); setTimeout(() => setCopied(""), 1600); };
  const connectStripe = async () => {
    setBusy(true);
    const r = await fetch(`${API}/affiliate/connect-stripe`, { method: "POST", headers: authHeaders() });
    const d = await r.json(); if (d.url) window.location.href = d.url; setBusy(false);
  };
  const withdraw = async () => {
    setBusy(true);
    const r = await fetch(`${API}/affiliate/payout`, { method: "POST", headers: authHeaders() });
    if (!r.ok) alert((await r.json()).detail || "payout failed"); else await load();
    setBusy(false);
  };
  const toggle = async (k: string, v: boolean) => {
    setMe((m: Me) => ({ ...m, [k]: v }));
    await fetch(`${API}/affiliate/settings`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ [k]: v }) });
  };

  if (!me) return <div className="min-h-screen grid place-items-center text-zinc-400">Loading your dashboard…</div>;

  const tierIdx = TIERS.findIndex(t => t.name === me.tier?.name);
  const next = TIERS[tierIdx + 1];
  const progress = next ? Math.min(100, Math.round((me.revenue_cents / next.need) * 100)) : 100;

  return (
    <main className="min-h-screen bg-[#F7F7F8] text-[#16181d]">
      <header className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-black/5">
        <div className="flex items-center gap-2 font-semibold">⌖ FaceIQ&nbsp;·&nbsp;<span className="text-zinc-500 font-normal">Fyon Partners</span></div>
        <div className="h-9 w-9 rounded-xl border border-black/10 grid place-items-center text-zinc-400">⋮</div>
      </header>

      <div className="mx-auto max-w-5xl px-4 md:px-6 py-6 space-y-5">

        {/* ---- header card (dark) ---- */}
        <section className="rounded-3xl p-6 md:p-7 text-white bg-[radial-gradient(120%_120%_at_0%_0%,#2a2d36,#0d0e12)] shadow-[0_30px_70px_rgba(0,0,0,.3)]">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-white/10 grid place-items-center text-xl">◐</div>
            <div>
              <h1 className="text-2xl font-bold">Partner Dashboard</h1>
              <p className="text-white/60 text-sm">{me.tier?.name} · <span className="text-emerald-400 font-semibold">{me.tier?.rate}% commission</span></p>
            </div>
          </div>
          <div className="mt-6 flex justify-between text-sm text-white/70">
            <span>✦ {usd(me.revenue_cents)} revenue</span>
            {next && <span>{usd(next.need - me.revenue_cents)} to <b className="text-white">{next.name}</b></span>}
          </div>
          <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-5 flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3 font-mono text-sm text-white/80">
              <span className="opacity-50">🔗</span><span className="truncate">{me.link}</span>
            </div>
            <button onClick={() => copy(me.link, "link")} className="rounded-2xl bg-white text-black font-semibold px-5 py-3 text-sm hover:bg-zinc-100 transition">
              {copied === "link" ? "Copied!" : "⧉ Copy"}
            </button>
            <button onClick={() => copy(me.coupon, "coupon")} className="rounded-2xl border border-amber-400/40 bg-amber-400/10 text-amber-300 font-mono text-sm px-4 py-3 hover:bg-amber-400/20 transition">
              🏷 {me.coupon} <span className="ml-1 text-[10px] bg-amber-400/20 px-1.5 py-0.5 rounded">20% OFF</span>
            </button>
          </div>
        </section>

        {/* ---- connect stripe ---- */}
        {!me.payout_enabled && (
          <section className="flex items-center justify-between rounded-2xl border border-black/5 bg-white px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 grid place-items-center">💳</div>
              <div><p className="font-semibold">Connect Stripe to receive payouts</p><p className="text-sm text-zinc-500">Required for withdrawing your earnings</p></div>
            </div>
            <button onClick={connectStripe} disabled={busy} className="rounded-xl bg-black text-white text-sm font-semibold px-5 py-2.5 hover:bg-zinc-800 transition disabled:opacity-50">Connect Stripe</button>
          </section>
        )}

        {/* ---- tabs ---- */}
        <nav className="grid grid-cols-4 rounded-2xl border border-black/5 bg-white p-1 text-sm">
          {(["overview", "links", "referrals", "earnings"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-2.5 rounded-xl capitalize transition ${tab === t ? "bg-zinc-100 font-semibold" : "text-zinc-500 hover:text-zinc-800"}`}>{t}</button>
          ))}
        </nav>

        {tab === "overview" && (
          <>
            {/* earnings cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard tone="emerald" icon="$" title="Available" value={usd(me.available_cents)} sub="Ready to withdraw"
                action={me.available_cents >= 1000 && me.payout_enabled ? <button onClick={withdraw} disabled={busy} className="text-xs font-semibold text-emerald-700 hover:underline">Withdraw →</button> : null} />
              <StatCard tone="blue" icon="↗" title="Monthly" value={usd(me.month_cents)} sub="Recurring commission" />
              <StatCard tone="violet" icon="❖" title="Lifetime" value={usd(me.lifetime_cents)} sub="Total earned" />
              <StatCard tone="amber" icon="👥" title="Referrals" value={String(me.referrals_total)} sub={`${me.referrals_active} active subscribers`} />
            </div>

            {/* commission tier */}
            <section className="rounded-2xl border border-black/5 bg-white p-6">
              <div className="flex items-center justify-between">
                <div><p className="text-xs tracking-widest text-zinc-400">LEVEL {tierIdx + 1}</p><h3 className="text-2xl font-bold">{me.tier?.name}</h3><p className="text-zinc-500 text-sm"><b>{me.tier?.rate}%</b> commission</p></div>
                <div className="text-right"><p className="text-xs tracking-widest text-zinc-400">TOTAL REVENUE</p><p className="text-2xl font-bold">{usd(me.revenue_cents)}</p></div>
              </div>
              {next && (
                <div className="mt-5 rounded-xl bg-zinc-50 border border-black/5 p-4">
                  <div className="flex justify-between text-sm"><span className="text-zinc-400 text-xs tracking-widest">NEXT LEVEL</span><span className="text-amber-600 font-semibold">{next.rate}%</span></div>
                  <p className="font-semibold text-amber-600">{next.name}</p>
                  <div className="mt-2 h-2 rounded-full bg-zinc-200 overflow-hidden"><div className="h-full rounded-full bg-amber-500" style={{ width: `${progress}%` }} /></div>
                  <div className="mt-2 flex justify-between text-sm text-zinc-500">↗ {usd(next.need - me.revenue_cents)} to level up <span>Bonus: <b className="text-emerald-600">+{next.rate - me.tier.rate}%</b></span></div>
                </div>
              )}
              <div className="mt-5">
                <p className="font-semibold mb-2">Commission Tiers <span className="text-xs text-zinc-400">{tierIdx + 1}/9</span></p>
                <div className="space-y-1">
                  {TIERS.map((t, i) => (
                    <div key={t.name} className={`flex items-center justify-between rounded-xl px-4 py-3 ${i === tierIdx ? "border border-emerald-200 bg-emerald-50/60" : i === tierIdx + 1 ? "bg-zinc-50" : "opacity-50"}`}>
                      <div><span className="font-semibold">{t.name}</span>{i === tierIdx && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">CURRENT</span>}{i === tierIdx + 1 && <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">NEXT</span>}<p className="text-xs text-zinc-400">{t.blurb}</p></div>
                      <span className="font-bold text-emerald-600">{t.rate}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* leaderboard + tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <section className="rounded-2xl border border-black/5 bg-white p-6">
                <p className="font-semibold mb-1">🏆 Leaderboard</p><p className="text-sm text-zinc-500 mb-4">Top partners this month</p>
                <div className="space-y-2">
                  {board.length === 0 && <p className="text-sm text-zinc-400">No rankings yet — be the first.</p>}
                  {board.map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5"><span><b className="text-zinc-400 mr-2">{i + 1}.</b>{r.name}</span><span className="font-semibold text-emerald-600">{usd(r.month_cents)}</span></div>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  <Toggle label="Showing on leaderboard" on={me.show_on_leaderboard} onChange={(v) => toggle("show_on_leaderboard", v)} />
                  <Toggle label="Username hidden" on={me.hide_username} onChange={(v) => toggle("hide_username", v)} />
                </div>
              </section>
              <section className="rounded-2xl border border-black/5 bg-white p-6">
                <p className="font-semibold mb-1">💡 Grow Your Earnings</p><p className="text-sm text-zinc-500 mb-4">Tips to maximize income</p>
                {[["👥","Share your link","Social media, forums & communities"],["📈","Create content","Reviews, tutorials & comparisons"],["％","Use your coupon","Boost conversions with discounts"]].map(([i,t,d]) => (
                  <div key={t} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-zinc-50"><span className="h-9 w-9 grid place-items-center rounded-lg bg-zinc-100">{i}</span><div><p className="font-medium text-sm">{t}</p><p className="text-xs text-zinc-500">{d}</p></div></div>
                ))}
              </section>
            </div>
          </>
        )}

        {tab === "links" && (
          <section className="rounded-2xl border border-black/5 bg-white p-6 space-y-3">
            <p className="font-semibold">Your links</p>
            <Field label="Referral link" value={me.link} onCopy={() => copy(me.link, "l2")} />
            <Field label="Coupon code (20% off)" value={me.coupon} onCopy={() => copy(me.coupon, "c2")} />
            <p className="text-xs text-zinc-500">Add <code>?ref={me.code}</code> anywhere, or share the coupon — both attribute the sale.</p>
          </section>
        )}
        {tab === "referrals" && (
          <section className="rounded-2xl border border-black/5 bg-white p-6">
            <p className="font-semibold">Referrals</p>
            <p className="text-sm text-zinc-500">{me.referrals_total} total · {me.referrals_active} active subscribers · {usd(me.pending_cents)} pending (in {`${30}`}-day hold)</p>
          </section>
        )}
        {tab === "earnings" && (
          <section className="rounded-2xl border border-black/5 bg-white p-6 grid grid-cols-2 gap-4">
            <Mini label="Available" value={usd(me.available_cents)} /><Mini label="Pending (hold)" value={usd(me.pending_cents)} />
            <Mini label="This month" value={usd(me.month_cents)} /><Mini label="Lifetime" value={usd(me.lifetime_cents)} />
          </section>
        )}
      </div>
    </main>
  );
}

function StatCard({ tone, icon, title, value, sub, action }: any) {
  const t: any = { emerald: "text-emerald-600", blue: "text-blue-600", violet: "text-violet-600", amber: "text-amber-600" };
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6">
      <div className="flex items-center gap-2 text-sm text-zinc-500"><span className={`h-8 w-8 grid place-items-center rounded-lg bg-zinc-100 ${t[tone]}`}>{icon}</span>{title}</div>
      <p className={`mt-3 text-4xl font-bold ${t[tone]}`}>{value}</p>
      <div className="mt-1 flex items-center justify-between"><p className="text-sm text-zinc-500">{sub}</p>{action}</div>
    </div>
  );
}
function Toggle({ label, on, onChange }: any) {
  return (
    <button onClick={() => onChange(!on)} className="w-full flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 text-sm">
      <span className="text-zinc-600">{label}</span>
      <span className={`h-6 w-11 rounded-full p-0.5 transition ${on ? "bg-emerald-500" : "bg-zinc-300"}`}><span className={`block h-5 w-5 rounded-full bg-white transition ${on ? "translate-x-5" : ""}`} /></span>
    </button>
  );
}
function Field({ label, value, onCopy }: any) {
  return (
    <div><p className="text-xs text-zinc-400 mb-1">{label}</p>
      <div className="flex gap-2"><div className="flex-1 rounded-xl border border-black/10 bg-zinc-50 px-4 py-2.5 font-mono text-sm truncate">{value}</div>
      <button onClick={onCopy} className="rounded-xl bg-black text-white text-sm px-4">Copy</button></div></div>
  );
}
function Mini({ label, value }: any) { return <div className="rounded-xl bg-zinc-50 p-4"><p className="text-xs text-zinc-400">{label}</p><p className="text-2xl font-bold">{value}</p></div>; }
