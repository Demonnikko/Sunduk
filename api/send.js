// ===================== api/send.js =====================
export const config = { runtime: 'edge' };

const FALLBACK_TOKEN = '7962198421:AAETZYzXxsbV0_MZcSbQxRPa9SHYI2U2hNs';
const FALLBACK_CHAT  = '7962198421'; // ЛИЧНЫЙ user id

function escapeMd(s){return String(s).replace(/[_*[\]()~`>#+\-=|{}.!]/g,'\\$&')}

export default async function handler(req) {
  try{
    if(req.method !== 'POST') return new Response('Method Not Allowed',{status:405});

    const { fio='', tg='', phone='', prize='' } = await req.json();
    const token = process.env.TELEGRAM_BOT_TOKEN || FALLBACK_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID || FALLBACK_CHAT;

    // ВАЖНО: пользователь должен написать боту хоть раз, иначе Telegram не даст слать в личку.
    const txt =
`🎟 *ШОУ «Секрет» — заявка победителя*
*Приз:* ${escapeMd(prize)}
*ФИО:* ${escapeMd(fio)}
*Telegram:* @${escapeMd(tg)}
*Телефон:* ${escapeMd(phone)}
*Время:* ${new Date().toLocaleString('ru-RU')}`;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({chat_id: chatId, text: txt, parse_mode:'Markdown'})
    });

    if(!res.ok){
      const t = await res.text().catch(()=> '');
      return new Response(JSON.stringify({ok:false, err:t}),{status:200,headers:{'Content-Type':'application/json'}});
    }
    return new Response(JSON.stringify({ok:true}),{status:200,headers:{'Content-Type':'application/json'}});
  }catch(e){
    return new Response(JSON.stringify({ok:false}),{status:200,headers:{'Content-Type':'application/json'}});
  }
}
