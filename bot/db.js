/**
 * db.js — база данных на основе JSON-файла
 *
 * Данные хранятся в bot/data.json (создаётся автоматически).
 * Чтобы посмотреть данные — откройте data.json в VS Code.
 *
 * Структура:
 *   users     — все пользователи и роли
 *   progress  — прогресс учеников
 *   access    — доступы к ступеням
 *   payments  — платежи
 *   homework  — домашние задания
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data.json');

// ─── Чтение / запись файла ───────────────────────────────────────────────────

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    const empty = { users: [], progress: [], access: [], payments: [], homework: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2), 'utf8');
    return empty;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// ─── ПОЛЬЗОВАТЕЛИ ────────────────────────────────────────────────────────────

export function getUser(telegramId) {
  const db = readDB();
  return db.users.find(u => String(u.telegram_id) === String(telegramId)) || null;
}

export function getUserByUsername(username) {
  const clean = String(username).replace('@', '').toLowerCase();
  const db = readDB();
  return db.users.find(u => (u.username || '').toLowerCase() === clean) || null;
}

export function createUser(user) {
  const db = readDB();
  const exists = db.users.find(u => String(u.telegram_id) === String(user.telegram_id));
  if (exists) return;

  const now = new Date().toISOString();
  db.users.push({
    telegram_id: String(user.telegram_id),
    username:    user.username    || '',
    first_name:  user.first_name  || '',
    role:        user.role        || 'student',
    teacher_id:  user.teacher_id  || '',
    created_at:  now,
    trial_start: now,
  });
  writeDB(db);
}

export function updateUserRole(telegramId, role) {
  const db = readDB();
  const user = db.users.find(u => String(u.telegram_id) === String(telegramId));
  if (!user) return false;
  user.role = role;
  writeDB(db);
  return true;
}

export function assignTeacher(studentId, teacherId) {
  const db = readDB();
  const student = db.users.find(u => String(u.telegram_id) === String(studentId));
  if (!student) return false;
  student.teacher_id = String(teacherId);
  writeDB(db);
  return true;
}

export function getStudentsByTeacher(teacherId) {
  const db = readDB();
  return db.users.filter(
    u => String(u.teacher_id) === String(teacherId) && u.role === 'student'
  );
}

export function getAllUsers() {
  return readDB().users;
}

// ─── ДОСТУПЫ К СТУПЕНЯМ ──────────────────────────────────────────────────────

export function getAccess(telegramId, step) {
  const db = readDB();
  return db.access.find(
    a => String(a.telegram_id) === String(telegramId) && String(a.step) === String(step)
  ) || null;
}

export function grantAccess(telegramId, step, grantedBy = 'manual') {
  const db = readDB();
  const exists = db.access.find(
    a => String(a.telegram_id) === String(telegramId) && String(a.step) === String(step)
  );
  if (exists) return;

  db.access.push({
    telegram_id: String(telegramId),
    step:        String(step),
    granted_at:  new Date().toISOString(),
    granted_by:  grantedBy,
    expires_at:  null,
  });
  writeDB(db);
}

export function revokeAccess(telegramId) {
  const db = readDB();
  const now = new Date().toISOString();
  db.access
    .filter(a => String(a.telegram_id) === String(telegramId))
    .forEach(a => { a.expires_at = now; });
  writeDB(db);
}

export function getUserSteps(telegramId) {
  const db  = readDB();
  const now = new Date();
  return db.access
    .filter(a => {
      if (String(a.telegram_id) !== String(telegramId)) return false;
      if (!a.expires_at) return true;
      return new Date(a.expires_at) > now;
    })
    .map(a => Number(a.step));
}

// ─── ПРОГРЕСС ────────────────────────────────────────────────────────────────

export function getProgress(telegramId) {
  const db = readDB();
  return db.progress.find(p => String(p.telegram_id) === String(telegramId)) || null;
}

// ─── ПЛАТЕЖИ ─────────────────────────────────────────────────────────────────

export function createPayment(payment) {
  const db = readDB();
  const id = `pay_${Date.now()}`;

  db.payments.push({
    id,
    telegram_id: String(payment.telegram_id),
    amount:      payment.amount,
    product:     payment.product,
    status:      'pending',
    method:      payment.method || 'manual',
    created_at:  new Date().toISOString(),
    paid_at:     null,
  });
  writeDB(db);
  return id;
}

export function getRecentPayments(limit = 10) {
  const db = readDB();
  return [...db.payments].reverse().slice(0, limit);
}

// ─── ДОМАШНИЕ ЗАДАНИЯ ────────────────────────────────────────────────────────

export function createHomework(hw) {
  const db = readDB();
  const id = Date.now();

  db.homework.push({
    id:           String(id),
    telegram_id:  String(hw.telegram_id),
    teacher_id:   String(hw.teacher_id || ''),
    lesson_id:    String(hw.lesson_id  || ''),
    type:         hw.type,
    file_id:      hw.file_id || '',
    text:         hw.text    || '',
    status:       'pending',
    score:        null,
    feedback:     '',
    submitted_at: new Date().toISOString(),
    reviewed_at:  null,
  });
  writeDB(db);
  return id;
}

export function getPendingHomework(teacherId) {
  const db = readDB();
  return db.homework.filter(
    h => String(h.teacher_id) === String(teacherId) && h.status === 'pending'
  );
}

export function reviewHomework(hwId, score, feedback, status = 'reviewed') {
  const db = readDB();
  const hw = db.homework.find(h => String(h.id) === String(hwId));
  if (!hw) return null;

  hw.status      = status;
  hw.score       = score;
  hw.feedback    = feedback;
  hw.reviewed_at = new Date().toISOString();
  writeDB(db);

  return hw.telegram_id;
}
