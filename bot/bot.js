/**
 * bot.js — Telegram-бот репетитора по китайскому
 *
 * Запуск:
 *   npm install
 *   node bot.js
 *
 * Требует .env с переменными:
 *   BOT_TOKEN            — токен от @BotFather
 *   SPREADSHEET_ID       — ID Google Таблицы
 *   ADMIN_TELEGRAM_ID    — ваш Telegram ID (узнать: @userinfobot)
 *   MINI_APP_URL         — https://repetitor-kitaiskui.vercel.app
 *   CARD_NUMBER          — номер карты для оплаты
 *   CARD_OWNER           — имя владельца карты
 */

import 'dotenv/config';
import { Bot, GrammyError, HttpError } from 'grammy';

import { registerStudentCommands } from './commands/student.js';
import { registerTeacherCommands  } from './commands/teacher.js';
import { registerAdminCommands    } from './commands/admin.js';

// ─── Проверка конфигурации ───────────────────────────────────────────────────

if (!process.env.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN не задан в .env');
  process.exit(1);
}

if (!process.env.SPREADSHEET_ID) {
  console.warn('⚠️  SPREADSHEET_ID не задан — работа с Google Sheets невозможна');
}

if (!process.env.ADMIN_TELEGRAM_ID) {
  console.warn('⚠️  ADMIN_TELEGRAM_ID не задан — команды /unlock, /stats, /payments не будут работать');
}

// ─── Инициализация бота ──────────────────────────────────────────────────────

const bot = new Bot(process.env.BOT_TOKEN);

// ─── Регистрация команд ──────────────────────────────────────────────────────

registerStudentCommands(bot);
registerTeacherCommands(bot);
registerAdminCommands(bot);

// ─── Обработка ошибок ────────────────────────────────────────────────────────

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Ошибка при обработке update ${ctx.update.update_id}:`);

  if (err.error instanceof GrammyError) {
    console.error('Ошибка Telegram API:', err.error.message);
  } else if (err.error instanceof HttpError) {
    console.error('Ошибка HTTP:', err.error);
  } else {
    console.error('Неизвестная ошибка:', err.error);
  }
});

// ─── Запуск ──────────────────────────────────────────────────────────────────

bot.start({
  onStart: (info) => {
    console.log(`✅ Бот запущен: @${info.username}`);
    console.log(`   Админ: ${process.env.ADMIN_TELEGRAM_ID || 'не задан'}`);
    console.log(`   Таблица: ${process.env.SPREADSHEET_ID ? '✓' : '✗ не задана'}`);
    console.log(`   Mini App: ${process.env.MINI_APP_URL || 'https://repetitor-kitaiskui.vercel.app'}`);
  },
});
