/**
 * commands/admin.js — команды администратора (владелец)
 * /unlock, /lock, /assign, /add_teacher, /stats, /payments
 */

import {
  getUserByUsername,
  updateUserRole,
  assignTeacher,
  grantAccess,
  revokeAccess,
  getAllUsers,
  getRecentPayments,
} from '../db.js';

const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID;

function isAdmin(telegramId) {
  return String(telegramId) === String(ADMIN_ID);
}

export function registerAdminCommands(bot) {

  // /unlock @username step1 — открыть доступ к ступени
  bot.command('unlock', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 2) {
      return ctx.reply('Формат: /unlock @username step1');
    }

    const [usernameArg, stepArg] = args;
    const step = Number(stepArg.replace('step', ''));

    if (!step || step < 1 || step > 3) {
      return ctx.reply('Ступень должна быть step1, step2 или step3');
    }

    const student = getUserByUsername(usernameArg);
    if (!student) {
      return ctx.reply(`Пользователь ${usernameArg} не найден в базе.`);
    }

    grantAccess(student.telegram_id, step, 'manual');

    const name = student.username ? `@${student.username}` : student.first_name;
    await ctx.reply(`✅ Доступ к Ступени ${step} открыт для ${name}`);

    await ctx.api.sendMessage(
      student.telegram_id,
      `🎉 Ступень ${step} открыта!\n\nТеперь вам доступны все материалы этой ступени. Начните прямо сейчас в приложении!`,
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '📚 Открыть приложение', web_app: { url: process.env.MINI_APP_URL || 'https://repetitor-kitaiskui.vercel.app' } },
          ]],
        },
      }
    );
  });

  // /lock @username — заблокировать доступ
  bot.command('lock', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;

    const args = ctx.message.text.split(' ').slice(1);
    if (!args[0]) return ctx.reply('Формат: /lock @username');

    const student = getUserByUsername(args[0]);
    if (!student) return ctx.reply(`Пользователь ${args[0]} не найден.`);

    revokeAccess(student.telegram_id);

    const name = student.username ? `@${student.username}` : student.first_name;
    await ctx.reply(`🔒 Доступ закрыт для ${name}`);
  });

  // /add_teacher @username — назначить учителем
  bot.command('add_teacher', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;

    const args = ctx.message.text.split(' ').slice(1);
    if (!args[0]) return ctx.reply('Формат: /add_teacher @username');

    const user = getUserByUsername(args[0]);
    if (!user) return ctx.reply(`Пользователь ${args[0]} не найден.`);

    updateUserRole(user.telegram_id, 'teacher');

    const name = user.username ? `@${user.username}` : user.first_name;
    await ctx.reply(`✅ ${name} назначен(а) учителем.`);

    await ctx.api.sendMessage(
      user.telegram_id,
      `🎓 Вам назначена роль учителя!\n\nДоступные команды:\n/students — список ваших учеников\n/homework — непроверенные ДЗ`
    );
  });

  // /assign @student @teacher — прикрепить ученика к учителю
  bot.command('assign', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 2) return ctx.reply('Формат: /assign @ученик @учитель');

    const [studentArg, teacherArg] = args;
    const student = getUserByUsername(studentArg);
    const teacher = getUserByUsername(teacherArg);

    if (!student) return ctx.reply(`Ученик ${studentArg} не найден.`);
    if (!teacher) return ctx.reply(`Учитель ${teacherArg} не найден.`);

    assignTeacher(student.telegram_id, teacher.telegram_id);

    const sName = student.username ? `@${student.username}` : student.first_name;
    const tName = teacher.username ? `@${teacher.username}` : teacher.first_name;
    await ctx.reply(`✅ ${sName} прикреплён(а) к учителю ${tName}`);
  });

  // /stats — общая статистика
  bot.command('stats', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;

    const users    = getAllUsers();
    const payments = getRecentPayments(100);

    const students     = users.filter(u => u.role === 'student');
    const teachers     = users.filter(u => u.role === 'teacher');
    const paidPayments = payments.filter(p => p.status === 'paid');
    const totalRevenue = paidPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const today      = new Date().toDateString();
    const activeToday = users.filter(u =>
      u.created_at && new Date(u.created_at).toDateString() === today
    );

    await ctx.reply(
      `📈 Статистика:\n\n` +
      `👥 Всего учеников: ${students.length}\n` +
      `👨‍🏫 Учителей: ${teachers.length}\n` +
      `🆕 Зарегистрировались сегодня: ${activeToday.length}\n\n` +
      `💰 Платежей всего: ${payments.length}\n` +
      `✅ Оплачено: ${paidPayments.length}\n` +
      `💵 Выручка: ${totalRevenue.toLocaleString('ru')} ₽`
    );
  });

  // /payments — последние платежи
  bot.command('payments', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;

    const payments = getRecentPayments(10);

    if (!payments.length) {
      return ctx.reply('Платежей пока нет.');
    }

    const lines = payments.map(p => {
      const status = p.status === 'paid' ? '✅' : p.status === 'pending' ? '⏳' : '❌';
      const date   = p.created_at ? new Date(p.created_at).toLocaleDateString('ru') : '?';
      return `${status} ${p.product} — ${p.amount} ₽ — id${p.telegram_id} — ${date}`;
    });

    await ctx.reply(`💰 Последние платежи:\n\n${lines.join('\n')}`);
  });
}
