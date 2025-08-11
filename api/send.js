// ===================== api/send.js (Vercel Edge Function) =====================
export const config = { runtime: 'edge' };

const TOKEN  = '7962198421:AAETZYzXxsbV0_MZcSbQxRPa9SHYI2U2hNs';
const CHAT_ID = '7962198421'; // личный user id, НЕ группа

export default async function handler(req) {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    const { fio='', tg='', phone='', prize='' } = await req.json();
    const text =
`🎟 *ШОУ «Секрет» — заявка победителя*
*Приз:* ${mdEsc(prize)}
*ФИО:* ${mdEsc(fio)}
*Telegram:* @${mdEsc(tg)}
*Телефон:* ${mdEsc(phone)}`;

    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode:'Markdown' })
    });

    if (!res.ok) throw new Error('tg error');
    return json({ ok:true });
  } catch (e) {
    return json({ ok:false });
  }
}

function json(obj){ return new Response(JSON.stringify(obj), { status: 200, headers: { 'Content-Type': 'application/json' } }); }
function mdEsc(s){ return String(s).replace(/[_*[\]()~`>#+\\-=|{}.!]/g,'\\$&'); }
