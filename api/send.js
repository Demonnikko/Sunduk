// ===================== api/send.js (Vercel Edge Function) =====================
export const config = { runtime: 'edge' };

export default async function handler(req) {
  try{
    if(req.method !== 'POST') return new Response('Method Not Allowed',{status:405});
    const { fio='', tg='', prize='' } = await req.json();
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if(!token || !chatId) return new Response('Missing env', {status:500});

    const txt =
`🎟 *ШОУ «Секрет» — заявка победителя*
*Приз:* ${escape(prize)}
*ФИО:* ${escape(fio)}
*Telegram:* ${escape(tg)}`;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({chat_id: chatId, text: txt, parse_mode:'Markdown'})
    });
    if(!res.ok) throw 0;
    return new Response(JSON.stringify({ok:true}),{status:200,headers:{'Content-Type':'application/json'}});
  }catch(e){
    return new Response(JSON.stringify({ok:false}),{status:200,headers:{'Content-Type':'application/json'}});
  }
}
function escape(s){return String(s).replace(/[_*[\]()~`>#+\-=|{}.!]/g,'\\$&')}