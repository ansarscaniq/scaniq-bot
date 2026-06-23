const https = require('https');

const TOKEN = '8605979515:AAEI4cat-XZznGxybR-EM3WSa-WS40gUYaM';
const SITE_URL = 'https://scaniqop.netlify.app';
const API = `https://api.telegram.org/bot${TOKEN}`;

function request(method, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${TOKEN}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function sendWelcome(chatId, name) {
  await request('sendMessage', {
    chat_id: chatId,
    text: `👋 Привет, ${name}!\n\n🩻 *ScanIQ* — ИИ анализ медицинских снимков.\n\n✅ Что умеет ScanIQ:\n• Анализ рентгеновских снимков\n• Анализ МРТ снимков\n• Анализ КТ снимков\n• Сравнение снимков\n• Экспорт PDF отчётов\n\n🆓 Первые 3 анализа — бесплатно!\n\nНажми кнопку ниже чтобы открыть сайт 👇`,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        {
          text: '🚀 Открыть ScanIQ',
          url: SITE_URL
        }
      ], [
        {
          text: '💎 Планы и цены',
          url: SITE_URL + '/#pricing'
        }
      ]]
    }
  });
}

async function getUpdates(offset = 0) {
  const res = await request('getUpdates', {
    offset,
    timeout: 30,
    allowed_updates: ['message']
  });
  return res.result || [];
}

async function main() {
  console.log('🤖 ScanIQ бот запущен...');

  // Set bot commands
  await request('setMyCommands', {
    commands: [
      { command: 'start', description: 'Открыть ScanIQ' },
      { command: 'help', description: 'Помощь' },
      { command: 'site', description: 'Ссылка на сайт' }
    ]
  });

  let offset = 0;
  while (true) {
    try {
      const updates = await getUpdates(offset);
      for (const update of updates) {
        offset = update.update_id + 1;
        const msg = update.message;
        if (!msg) continue;

        const chatId = msg.chat.id;
        const text = msg.text || '';
        const name = msg.from?.first_name || 'пользователь';

        if (text === '/start' || text.startsWith('/start')) {
          await sendWelcome(chatId, name);
        } else if (text === '/help') {
          await request('sendMessage', {
            chat_id: chatId,
            text: `🩻 *ScanIQ — Помощь*\n\n/start — Начать работу\n/site — Ссылка на сайт\n\n📧 По вопросам: ansarpro37@gmail.com`,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[{ text: '🚀 Открыть ScanIQ', url: SITE_URL }]]
            }
          });
        } else if (text === '/site') {
          await request('sendMessage', {
            chat_id: chatId,
            text: '🔗 Ссылка на ScanIQ:',
            reply_markup: {
              inline_keyboard: [[{ text: '🚀 Открыть ScanIQ', url: SITE_URL }]]
            }
          });
        } else {
          await request('sendMessage', {
            chat_id: chatId,
            text: '👇 Нажми кнопку чтобы открыть ScanIQ:',
            reply_markup: {
              inline_keyboard: [[{ text: '🚀 Открыть ScanIQ', url: SITE_URL }]]
            }
          });
        }
      }
    } catch (e) {
      console.error('Ошибка:', e.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

main();
