/**
 * setup.js — первоначальная настройка Google Таблицы
 *
 * Запускать ОДИН РАЗ после создания таблицы и сервисного аккаунта:
 *   node setup.js
 *
 * Что делает:
 *   1. Создаёт 5 листов: users, progress, access, payments, homework
 *   2. Добавляет заголовки колонок на каждый лист
 *   3. Проверяет подключение к таблице
 */

import 'dotenv/config';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Проверка конфигурации ───────────────────────────────────────────────────

if (!process.env.SPREADSHEET_ID) {
  console.error('❌ SPREADSHEET_ID не задан в .env');
  console.error('   Создайте Google Таблицу и вставьте её ID в .env');
  process.exit(1);
}

const credentialsPath = path.join(__dirname, 'google-credentials.json');

try {
  await import('fs').then(fs => fs.promises.access(credentialsPath));
} catch {
  console.error('❌ Файл google-credentials.json не найден в папке bot/');
  console.error('   Скачайте его из Google Cloud Console (инструкция в README)');
  process.exit(1);
}

// ─── Подключение к Google Sheets ────────────────────────────────────────────

console.log('🔗 Подключаюсь к Google Sheets...');

const auth = new google.auth.GoogleAuth({
  keyFile: credentialsPath,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// ─── Структура листов ────────────────────────────────────────────────────────

const SHEET_DEFINITIONS = [
  {
    name: 'users',
    headers: ['telegram_id', 'username', 'first_name', 'role', 'teacher_id', 'created_at', 'trial_start'],
    description: 'Все пользователи и их роли',
  },
  {
    name: 'progress',
    headers: ['telegram_id', 'xp', 'streak', 'last_active', 'completed_lessons', 'words_learned'],
    description: 'Прогресс учеников',
  },
  {
    name: 'access',
    headers: ['telegram_id', 'step', 'granted_at', 'granted_by', 'expires_at'],
    description: 'Доступы к ступеням',
  },
  {
    name: 'payments',
    headers: ['id', 'telegram_id', 'amount', 'product', 'status', 'method', 'created_at', 'paid_at'],
    description: 'Платежи',
  },
  {
    name: 'homework',
    headers: ['id', 'telegram_id', 'teacher_id', 'lesson_id', 'type', 'file_id', 'text', 'status', 'score', 'feedback', 'submitted_at', 'reviewed_at'],
    description: 'Домашние задания',
  },
];

// ─── Получить существующие листы ────────────────────────────────────────────

console.log('📋 Читаю существующие листы...');

const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
const existingSheets = spreadsheet.data.sheets.map(s => s.properties.title);

console.log(`   Найдено листов: ${existingSheets.join(', ') || 'нет'}`);

// ─── Создать недостающие листы ───────────────────────────────────────────────

const sheetsToCreate = SHEET_DEFINITIONS.filter(def => !existingSheets.includes(def.name));

if (sheetsToCreate.length > 0) {
  console.log(`\n➕ Создаю листы: ${sheetsToCreate.map(s => s.name).join(', ')}...`);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: sheetsToCreate.map(def => ({
        addSheet: {
          properties: { title: def.name },
        },
      })),
    },
  });

  console.log('   ✅ Листы созданы');
} else {
  console.log('   Все листы уже существуют');
}

// ─── Добавить заголовки ──────────────────────────────────────────────────────

console.log('\n📝 Добавляю заголовки колонок...');

for (const def of SHEET_DEFINITIONS) {
  // Проверить, есть ли уже заголовки
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${def.name}!A1:Z1`,
  });

  const firstRow = existing.data.values?.[0] || [];

  if (firstRow.length > 0) {
    console.log(`   ${def.name}: заголовки уже есть, пропускаю`);
    continue;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${def.name}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [def.headers] },
  });

  console.log(`   ✅ ${def.name}: ${def.headers.join(' | ')}`);
}

// ─── Финальная проверка ──────────────────────────────────────────────────────

console.log('\n🔍 Проверка...');

for (const def of SHEET_DEFINITIONS) {
  const check = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${def.name}!A1:A1`,
  });

  const ok = check.data.values?.[0]?.[0] === def.headers[0];
  console.log(`   ${ok ? '✅' : '❌'} ${def.name} — ${def.description}`);
}

console.log(`
✅ Google Таблица готова!

Следующий шаг — заполнить .env:
  ADMIN_TELEGRAM_ID=ваш_ID  (узнать: напишите @userinfobot в Telegram)
  CARD_NUMBER=номер_карты
  CARD_OWNER=ваше_имя

Затем запустить бота:
  node bot.js
`);
