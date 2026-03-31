/**
 * sheets.js — работа с Google Sheets как базой данных
 *
 * Листы в таблице (SPREADSHEET_ID из .env):
 *   users     — все пользователи и роли
 *   progress  — прогресс учеников
 *   access    — доступы к ступеням
 *   payments  — платежи
 *   homework  — домашние задания
 *
 * Авторизация: сервисный аккаунт Google (google-credentials.json)
 */

import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Инициализация Google Sheets API
let sheets;

function getSheets() {
  if (sheets) return sheets;

  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'google-credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// ─────────────────────────────────────────────
// ПОЛЬЗОВАТЕЛИ (лист "users")
// Колонки: telegram_id | username | first_name | role | teacher_id | created_at | trial_start
// ─────────────────────────────────────────────

export async function getUser(telegramId) {
  const res = await getSheets().spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'users!A:G',
  });

  const rows = res.data.values || [];
  const row = rows.find(r => String(r[0]) === String(telegramId));
  if (!row) return null;

  return {
    telegram_id: row[0],
    username: row[1] || '',
    first_name: row[2] || '',
    role: row[3] || 'student',
    teacher_id: row[4] || '',
    created_at: row[5] || '',
    trial_start: row[6] || '',
  };
}

export async function createUser(user) {
  const now = new Date().toISOString();
  await getSheets().spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'users!A:G',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        user.telegram_id,
        user.username || '',
        user.first_name || '',
        user.role || 'student',
        user.teacher_id || '',
        now,
        now, // trial_start = дата первого входа
      ]],
    },
  });
}

export async function updateUserRole(telegramId, role) {
  const res = await getSheets().spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'users!A:G',
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex(r => String(r[0]) === String(telegramId));
  if (rowIndex === -1) return false;

  await getSheets().spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `users!D${rowIndex + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[role]] },
  });
  return true;
}

export async function assignTeacher(studentId, teacherId) {
  const res = await getSheets().spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'users!A:G',
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex(r => String(r[0]) === String(studentId));
  if (rowIndex === -1) return false;

  await getSheets().spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `users!E${rowIndex + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[teacherId]] },
  });
  return true;
}

export async function getStudentsByTeacher(teacherId) {
  const res = await getSheets().spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'users!A:G',
  });

  const rows = res.data.values || [];
  return rows
    .filter(r => String(r[4]) === String(teacherId) && r[3] === 'student')
    .map(r => ({
      telegram_id: r[0],
      username: r[1] || '',
      first_name: r[2] || '',
    }));
}

export async function getAllUsers() {
  const res = await getSheets().spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'users!A:G',
  });

  const rows = res.data.values || [];
  return rows.map(r => ({
    telegram_id: r[0],
    username: r[1] || '',
    first_name: r[2] || '',
    role: r[3] || 'student',
    teacher_id: r[4] || '',
    created_at: r[5] || '',
  }));
}

export async function getUserByUsername(username) {
  const cleanUsername = username.replace('@', '').toLowerCase();
  const res = await getSheets().spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'users!A:G',
  });

  const rows = res.data.values || [];
  const row = rows.find(r => (r[1] || '').toLowerCase() === cleanUsername);
  if (!row) return null;

  return {
    telegram_id: row[0],
    username: row[1] || '',
    first_name: row[2] || '',
    role: row[3] || 'student',
    teacher_id: row[4] || '',
  };
}

// ─────────────────────────────────────────────
// ДОСТУПЫ (лист "access")
// Колонки: telegram_id | step | granted_at | granted_by | expires_at
// ─────────────────────────────────────────────

export async function getAccess(telegramId, step) {
  const res = await getSheets().spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'access!A:E',
  });

  const rows = res.data.values || [];
  return rows.find(
    r => String(r[0]) === String(telegramId) && String(r[1]) === String(step)
  ) || null;
}

export async function grantAccess(telegramId, step, grantedBy = 'manual') {
  // Проверить, нет ли уже доступа
  const existing = await getAccess(telegramId, step);
  if (existing) return; // уже есть

  const now = new Date().toISOString();
  await getSheets().spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'access!A:E',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        telegramId,
        step,
        now,
        grantedBy,
        '', // expires_at — пусто = бессрочно
      ]],
    },
  });
}

export async function revokeAccess(telegramId) {
  // Помечаем все доступы как expired (записываем дату в expires_at)
  const res = await getSheets().spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'access!A:E',
  });

  const rows = res.data.values || [];
  const now = new Date().toISOString();

  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(telegramId)) {
      await getSheets().spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `access!E${i + 1}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[now]] },
      });
    }
  }
}

export async function getUserSteps(telegramId) {
  const res = await getSheets().spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'access!A:E',
  });

  const rows = res.data.values || [];
  const now = new Date();

  return rows
    .filter(r => {
      if (String(r[0]) !== String(telegramId)) return false;
      if (!r[4]) return true; // нет expires_at — бессрочно
      return new Date(r[4]) > now; // expires_at в будущем
    })
    .map(r => Number(r[1]));
}

// ─────────────────────────────────────────────
// ПЛАТЕЖИ (лист "payments")
// Колонки: id | telegram_id | amount | product | status | method | created_at | paid_at
// ─────────────────────────────────────────────

export async function createPayment(payment) {
  const now = new Date().toISOString();
  const id = `pay_${Date.now()}`;

  await getSheets().spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'payments!A:H',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        id,
        payment.telegram_id,
        payment.amount,
        payment.product,
        'pending',
        payment.method || 'manual',
        now,
        '',
      ]],
    },
  });
  return id;
}

export async function getRecentPayments(limit = 10) {
  const res = await getSheets().spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'payments!A:H',
  });

  const rows = res.data.values || [];
  return rows.slice(-limit).reverse().map(r => ({
    id: r[0],
    telegram_id: r[1],
    amount: r[2],
    product: r[3],
    status: r[4],
    method: r[5],
    created_at: r[6],
    paid_at: r[7],
  }));
}

// ─────────────────────────────────────────────
// ПРОГРЕСС (лист "progress")
// Колонки: telegram_id | xp | streak | last_active | completed_lessons | words_learned
// ─────────────────────────────────────────────

export async function getProgress(telegramId) {
  const res = await getSheets().spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'progress!A:F',
  });

  const rows = res.data.values || [];
  const row = rows.find(r => String(r[0]) === String(telegramId));
  if (!row) return null;

  return {
    telegram_id: row[0],
    xp: Number(row[1]) || 0,
    streak: Number(row[2]) || 0,
    last_active: row[3] || '',
    completed_lessons: row[4] ? row[4].split(',').filter(Boolean) : [],
    words_learned: row[5] ? Number(row[5]) : 0,
  };
}

// ─────────────────────────────────────────────
// ДОМАШНИЕ ЗАДАНИЯ (лист "homework")
// Колонки: id | telegram_id | teacher_id | lesson_id | type | file_id | text | status | score | feedback | submitted_at | reviewed_at
// ─────────────────────────────────────────────

export async function createHomework(hw) {
  const now = new Date().toISOString();
  const id = Date.now();

  await getSheets().spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'homework!A:L',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        id,
        hw.telegram_id,
        hw.teacher_id || '',
        hw.lesson_id || '',
        hw.type,
        hw.file_id || '',
        hw.text || '',
        'pending',
        '',
        '',
        now,
        '',
      ]],
    },
  });
  return id;
}

export async function getPendingHomework(teacherId) {
  const res = await getSheets().spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'homework!A:L',
  });

  const rows = res.data.values || [];
  return rows
    .filter(r => String(r[2]) === String(teacherId) && r[7] === 'pending')
    .map(r => ({
      id: r[0],
      telegram_id: r[1],
      lesson_id: r[3],
      type: r[4],
      file_id: r[5],
      text: r[6],
      submitted_at: r[10],
    }));
}

export async function reviewHomework(hwId, score, feedback, status = 'reviewed') {
  const res = await getSheets().spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'homework!A:L',
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex(r => String(r[0]) === String(hwId));
  if (rowIndex === -1) return null;

  const now = new Date().toISOString();
  const studentId = rows[rowIndex][1];

  await getSheets().spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `homework!H${rowIndex + 1}:L${rowIndex + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[status, score, feedback, '', now]] },
  });

  return studentId;
}
