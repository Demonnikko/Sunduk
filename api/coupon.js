export const config = { runtime: 'edge' };
import { kv } from '@vercel/kv';

// короткий «красивый» код
function makeCode(len = 10) {
  const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = 'SS-';
  for (let i = 0; i < len; i++) s += abc[(Math.random() * abc.length) | 0];
  return s;
}

export default async function handler(req) {
  const url = new URL(req.url);
  const op = (url.searchParams.get('op') || '').toLowerCase();

  if (!op || !['issue', 'status', 'redeem'].includes(op)) {
    return json({ error: 'op_required', allow: ['issue','status','redeem'] }, 400);
  }

  if (op === 'issue') {
    // ?op=issue&prize=10|15|20|50|FREE
    let prize = (url.searchParams.get('prize') || '').toUpperCase();
    try {
      if (!prize && req.method === 'POST') {
        const body = await req.json().catch(()=>({}));
        prize = (body.prize || '').toUpperCase();
      }
    } catch (_) {}

    const allowed = ['10','15','20','50','FREE'];
    if (!allowed.includes(prize)) return json({ error: 'bad_prize' }, 400);

    const code = makeCode(10);
    await kv.hset(`coupon:${code}`, { prize, used: 0, issuedAt: Date.now() });

    const verifyUrl = `${url.origin}/cashier.html?code=${encodeURIComponent(code)}`;
    return json({ ok: true, code, prize, url: verifyUrl });
  }

  if (op === 'status') {
    // ?op=status&code=SS-...
    const code = url.searchParams.get('code');
    if (!code) return json({ error: 'no_code' }, 400);
    const data = await kv.hgetall(`coupon:${code}`);
    if (!data) return json({ ok: true, exists: false });
    return json({
      ok: true,
      exists: true,
      prize: data.prize,
      used: Number(data.used) === 1,
      issuedAt: Number(data.issuedAt || 0),
      usedAt: Number(data.usedAt || 0)
    });
  }

  if (op === 'redeem') {
    // ?op=redeem&code=SS-... , body: { pin }
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    const code = url.searchParams.get('code');
    if (!code) return json({ error: 'no_code' }, 400);

    const body = await req.json().catch(()=>({}));
    const pin = body.pin;
    const cashierPin = process.env.CASHIER_PIN || '';
    if (!cashierPin) return json({ error: 'server_pin_not_set' }, 500);
    if (!pin) return json({ error: 'no_pin' }, 400);
    if (pin !== cashierPin) return json({ error: 'bad_pin' }, 403);

    const key = `coupon:${code}`;
    const data = await kv.hgetall(key);
    if (!data) return json({ error: 'not_found' }, 404);
    if (Number(data.used) === 1) return json({ ok: true, alreadyUsed: true });

    await kv.hset(key, { ...data, used: 1, usedAt: Date.now() });
    return json({ ok: true, redeemed: true, prize: data.prize });
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}