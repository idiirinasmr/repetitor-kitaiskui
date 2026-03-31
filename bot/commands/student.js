/**
 * commands/student.js — команды для учеников
 * /start, /progress, /homework, /buy, /paid, /help
 */

import {
  getUser, createUser,
  getProgress, getUserSteps,
  createPayment, createHomework,
} from '../db.js';

const PRICES = {
  step1: { amount: 1990, label: 'Первая ступень' },
  step2: { amount: 2490, label: 'Вторая ступень' },
  step3: { amount: 2990, label: 'Третья ступень' },
};

const CARD_NUMBER = process.env.CARD_NUMBER || '1234 5678 9012 3456';
const CARD_OWNER  = process.env.CARD_OWNER  || 'Ирина А.';
const ADMIN_ID    = process.env.ADMIN_TELEGRAM_ID;

export function registerStudentCommands(bot) {

  // /start — регистрация и запуск Mini App
  bot.command('start', async (ctx) => {
    const telegramId = ctx.from.id;
    const username   = ctx.from.username || '';
    const firstName  = ctx.from.first_name || 'Ученик';

    const user = getUser(telegramId);
    if (!user) {
      createUser({ telegram_id: telegramId, username, first_name: firstName, role: 'student' });
    }

    const appUrl = process.env.MINI_APP_URL || 'https://repetitor-kitaiskui.vercel.app';

    await ctx.reply(
      `Привет, ${firstName}! 👋\n\nЯ помогу тебе выучить китайский язык.\n\nНажми кнопку ниже, чтобы начать занятия:`,
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '📚 Начать заниматься', web_app: { url: appUrl } },
          ]],
        },
      }
    );
  });

  // /progress — статистика ученика
  bot.command('progress', async (ctx) => {
    const telegramId = ctx.from.id;
    const progress   = getProgress(telegramId);
    const steps      = getUserSteps(telegramId);

    if (!progress) {
      return ctx.reply('Пока нет данных о прогрессе. Пройдите хотя бы один урок в приложении!');
    }

    const stepsText = steps.length
      ? steps.map(s => `Ступень ${s}`).join(', ')
      : 'Пробный период';

    await ctx.reply(
      `📊 Ваш прогресс:\n\n` +
      `🔥 Стрик: ${progress.streak} дн.\n` +
      `⭐ XP: ${progress.xp}\n` +
      `📖 Пройдено уроков: ${progress.completed_lessons.length}\n` +
      `🀄 Слов выучено: ${progress.words_learned}\n` +
      `🎓 Доступ: ${stepsText}`
    );
  });

  // /homework — инструкция как сдать ДЗ
  bot.command('homework', async (ctx) => {
    await ctx.reply(
      `📝 Как сдать домашнее задание:\n\n` +
      `1. Выполните задание из приложения\n` +
      `2. Отправьте мне:\n` +
      `   • 🎤 голосовое сообщение (для произношения)\n` +
      `   • 📸 фото (для письменных упражнений)\n` +
      `   • ✍️ текстовое сообщение (для переводов)\n\n` +
      `Учитель проверит и пришлёт обратную связь!`
    );
  });

  // /buy — купить доступ к ступени
  bot.command('buy', async (ctx) => {
    const args    = ctx.message.text.split(' ').slice(1);
    const product = args[0];

    if (!product || !PRICES[product]) {
      const list = Object.entries(PRICES)
        .map(([key, val]) => `• /buy ${key} — ${val.label}: ${val.amount} ₽`)
        .join('\n');
      return ctx.reply(`Выберите ступень:\n\n${list}`);
    }

    const price = PRICES[product];
    createPayment({ telegram_id: ctx.from.id, amount: price.amount, product, method: 'manual' });

    await ctx.reply(
      `💳 Оплата ${price.label}\n\n` +
      `Сумма: ${price.amount} ₽\n\n` +
      `Переведите на карту:\n` +
      `<code>${CARD_NUMBER}</code>\n` +
      `Получатель: ${CARD_OWNER}\n\n` +
      `После оплаты напишите /paid и пришлите скриншот.\n` +
      `Доступ откроется в течение нескольких часов.`,
      { parse_mode: 'HTML' }
    );
  });

  // /paid — ученик сообщает об оплате и присылает скриншот
  bot.command('paid', async (ctx) => {
    const telegramId = ctx.from.id;
    const username   = ctx.from.username ? `@${ctx.from.username}` : `id${telegramId}`;

    // Определяем за что платит (последний pending-платёж)
    const { getRecentPayments } = await import('../db.js');
    const payments = getRecentPayments(20);
    const lastPayment = payments.find(
      p => String(p.telegram_id) === String(telegramId) && p.status === 'pending'
    );
    const product  = lastPayment?.product  || 'step1';
    const amount   = lastPayment?.amount   || '?';
    const label    = PRICES[product]?.label || 'Ступень';

    await ctx.reply(`✅ Принято! Пришлите скриншот оплаты — проверим и откроем доступ.`);

    if (ADMIN_ID) {
      await ctx.api.sendMessage(
        ADMIN_ID,
        `💰 Ученик ${username} оплатил ${label} (${amount} ₽)\n\n` +
        `Проверьте перевод на карте и нажмите кнопку:`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '✅ Открыть доступ', callback_data: `pay_unlock_${telegramId}_${product}` },
              { text: '❌ Отклонить',      callback_data: `pay_reject_${telegramId}` },
            ]],
          },
        }
      );
    }
  });

  // Обработка кнопок оплаты
  bot.callbackQuery(/^pay_unlock_(\d+)_(\w+)$/, async (ctx) => {
    const studentId = ctx.match[1];
    const product   = ctx.match[2];
    const step      = Number(product.replace('step', ''));

    const { grantAccess } = await import('../db.js');
    grantAccess(studentId, step, 'manual');

    await ctx.answerCallbackQuery('✅ Доступ открыт!');
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(ctx.callbackQuery.message.text + '\n\n✅ Доступ открыт.');

    await ctx.api.sendMessage(
      studentId,
      `🎉 Оплата подтверждена! Ступень ${step} открыта.\n\nНачните прямо сейчас:`,
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '📚 Открыть приложение', web_app: { url: process.env.MINI_APP_URL || 'https://repetitor-kitaiskui.vercel.app' } },
          ]],
        },
      }
    );
  });

  bot.callbackQuery(/^pay_reject_(\d+)$/, async (ctx) => {
    const studentId = ctx.match[1];

    await ctx.answerCallbackQuery('❌ Отклонено');
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(ctx.callbackQuery.message.text + '\n\n❌ Отклонено.');

    await ctx.api.sendMessage(
      studentId,
      `❌ Оплата не подтверждена. Возможно, перевод не поступил.\n\nЕсли вы уже оплатили — напишите нам, разберёмся.`
    );
  });

  // /help — список команд
  bot.command('help', async (ctx) => {
    await ctx.reply(
      `📚 Команды:\n\n` +
      `/start — открыть приложение\n` +
      `/progress — ваш прогресс\n` +
      `/homework — как сдать ДЗ\n` +
      `/buy step1 — купить Первую ступень\n` +
      `/buy step2 — купить Вторую ступень\n` +
      `/buy step3 — купить Третью ступень\n` +
      `/paid — сообщить об оплате\n` +
      `/help — эта справка`
    );
  });

  // Обработка ДЗ: голосовые и фото
  bot.on('message:voice', handleHomeworkSubmission);
  bot.on('message:photo', handleHomeworkSubmission);

  async function handleHomeworkSubmission(ctx) {
    const telegramId = ctx.from.id;
    const user = getUser(telegramId);
    if (!user) return;

    const teacherId = user.teacher_id;
    const username  = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;

    let fileId = '';
    let type   = 'text';

    if (ctx.message.voice) {
      fileId = ctx.message.voice.file_id;
      type   = 'voice';
    } else if (ctx.message.photo) {
      fileId = ctx.message.photo.at(-1).file_id;
      type   = 'photo';
    }

    const hwId = createHomework({
      telegram_id: telegramId,
      teacher_id:  teacherId,
      type,
      file_id: fileId,
      text:    ctx.message.caption || '',
    });

    await ctx.reply(`📨 ДЗ получено! Учитель проверит и пришлёт результат.`);

    if (teacherId) {
      const keyboard = {
        inline_keyboard: [[
          { text: '✅ Принять',          callback_data: `review_${hwId}_good` },
          { text: '🔄 На доработку', callback_data: `review_${hwId}_redo` },
        ]],
      };

      await ctx.api.sendMessage(
        teacherId,
        `📩 ДЗ от ${username} (id: ${telegramId})\nТип: ${type}`,
        { reply_markup: keyboard }
      );
      await ctx.api.forwardMessage(teacherId, ctx.chat.id, ctx.message.message_id);
    } else if (ADMIN_ID) {
      await ctx.api.sendMessage(
        ADMIN_ID,
        `📩 ДЗ от ${username} (учитель не назначен). hw_id=${hwId}`
      );
    }
  }
}
