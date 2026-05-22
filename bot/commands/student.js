/**
 * commands/student.js — команды для учеников
 * /start, /progress, /homework, /buy, /paid, /help
 */

import {
  getUser, createUser,
  getProgress, getUserSteps,
  createPayment, createHomework,
} from '../db.js';

const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID;

function formatCard(raw) {
  const digits = String(raw || '').replace(/\s/g, '');
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function getCardTbank() { return formatCard(process.env.CARD_TBANK); }
function getCardVtb()   { return formatCard(process.env.CARD_VTB);   }

export function registerStudentCommands(bot) {

  // /start — регистрация и запуск Mini App
  // Поддерживает deep link: /start pay_step1, /start pay_step2 и т.д.
  bot.command('start', async (ctx) => {
    const telegramId = ctx.from.id;
    const username   = ctx.from.username || '';
    const firstName  = ctx.from.first_name || 'Ученик';
    const param      = ctx.match?.trim() || ''; // аргумент после /start

    const user = getUser(telegramId);
    if (!user) {
      createUser({ telegram_id: telegramId, username, first_name: firstName, role: 'student' });
    }

    // Deep link из Mini App: пользователь выбрал продукт → бот показывает реквизиты
    if (param.startsWith('pay_')) {
      const product = param.replace('pay_', '');
      const labels  = {
        subscription: 'Подписку',
        lessons:      'Уроки',
        step1:        'Ступень 1',
        step2:        'Ступень 2',
        step3:        'Ступень 3',
        fullcourse:   'Весь курс',
      };
      const label = labels[product] || product;

      return ctx.reply(
        `💳 Реквизиты для оплаты — ${label}:\n\n` +
        `Т-Банк:\n<code>${getCardTbank()}</code>\n\n` +
        `ВТБ:\n<code>${getCardVtb()}</code>\n\n` +
        `После оплаты напишите /paid и пришлите скриншот.\n` +
        `Доступ откроется в течение нескольких часов.`,
        { parse_mode: 'HTML' }
      );
    }

    const appUrl = process.env.MINI_APP_URL || 'https://repetitor-kitaiskui.vercel.app';

    await ctx.reply(
      `Привет, ${firstName}! 👋\n\nЯ помогу тебе выучить китайский язык.\n\nНажми кнопку ниже, чтобы начать занятия:`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📚 Начать заниматься', web_app: { url: appUrl } }],
            [{ text: '💳 Перейти к оплате', callback_data: 'show_payment_menu' }],
          ],
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

  // /buy — меню оплаты
  bot.command('buy', async (ctx) => {
    await ctx.reply(
      `💳 Что хотите оплатить?`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📅 Подписку',   callback_data: 'buy_subscription' },
              { text: '📖 Уроки',      callback_data: 'buy_lessons' },
            ],
            [
              { text: '1️⃣ Ступень 1', callback_data: 'buy_step1' },
              { text: '2️⃣ Ступень 2', callback_data: 'buy_step2' },
            ],
            [
              { text: '3️⃣ Ступень 3', callback_data: 'buy_step3' },
              { text: '🎓 Весь курс', callback_data: 'buy_fullcourse' },
            ],
          ],
        },
      }
    );
  });

  // Показать меню оплаты по кнопке из /start
  bot.callbackQuery('show_payment_menu', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `💳 Что хотите оплатить?`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📅 Подписку',   callback_data: 'buy_subscription' },
              { text: '📖 Уроки',      callback_data: 'buy_lessons' },
            ],
            [
              { text: '1️⃣ Ступень 1', callback_data: 'buy_step1' },
              { text: '2️⃣ Ступень 2', callback_data: 'buy_step2' },
            ],
            [
              { text: '3️⃣ Ступень 3', callback_data: 'buy_step3' },
              { text: '🎓 Весь курс', callback_data: 'buy_fullcourse' },
            ],
          ],
        },
      }
    );
  });

  // Выбор продукта → кнопка "Оплатить"
  bot.callbackQuery(/^buy_(\w+)$/, async (ctx) => {
    const product = ctx.match[1];
    const label   = {
      subscription: 'Подписку',
      lessons:      'Уроки',
      step1:        'Ступень 1',
      step2:        'Ступень 2',
      step3:        'Ступень 3',
      fullcourse:   'Весь курс',
    }[product] || product;

    createPayment({ telegram_id: ctx.from.id, amount: 0, product, method: 'manual' });

    await ctx.answerCallbackQuery();
    await ctx.reply(
      `Вы выбрали: ${label}\n\nНажмите кнопку для получения реквизитов:`,
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '💳 Оплатить', callback_data: `pay_details_${product}` },
          ]],
        },
      }
    );
  });

  // Показать реквизиты карт
  bot.callbackQuery(/^pay_details_(\w+)$/, async (ctx) => {
    const product = ctx.match[1];
    const label   = {
      subscription: 'Подписку',
      lessons:      'Уроки',
      step1:        'Ступень 1',
      step2:        'Ступень 2',
      step3:        'Ступень 3',
      fullcourse:   'Весь курс',
    }[product] || product;

    await ctx.answerCallbackQuery();
    await ctx.reply(
      `💳 Реквизиты для оплаты — ${label}:\n\n` +
      `Т-Банк:\n<code>${getCardTbank()}</code>\n\n` +
      `ВТБ:\n<code>${getCardVtb()}</code>\n\n` +
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
    const labels   = { subscription: 'Подписка', lessons: 'Уроки', step1: 'Ступень 1', step2: 'Ступень 2', step3: 'Ступень 3', fullcourse: 'Весь курс' };
    const label    = labels[product] || product;

    await ctx.reply(`✅ Принято! Пришлите скриншот оплаты — проверим и откроем доступ.`);

    if (ADMIN_ID) {
      await ctx.api.sendMessage(
        ADMIN_ID,
        `💰 Ученик ${username} оплатил: ${label}\n\n` +
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
      `/buy — перейти к оплате\n` +
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
