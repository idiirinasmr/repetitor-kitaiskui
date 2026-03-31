/**
 * commands/teacher.js — команды для учителей
 * /students, /homework, /student @username, /add_lesson
 */

import {
  getUser,
  getUserByUsername,
  getStudentsByTeacher,
  getProgress,
  getUserSteps,
  getPendingHomework,
  reviewHomework,
} from '../db.js';

export function registerTeacherCommands(bot) {

  // /students — список учеников этого учителя
  bot.command('students', async (ctx) => {
    const teacherId = ctx.from.id;
    const user = getUser(teacherId);

    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return ctx.reply('❌ Эта команда только для учителей.');
    }

    const students = getStudentsByTeacher(teacherId);

    if (!students.length) {
      return ctx.reply(
        `У вас пока нет учеников.\n\nЧтобы прикрепить ученика: попросите администратора выполнить /assign @ученик @вы`
      );
    }

    const lines = students.map((s) => {
      const progress = getProgress(s.telegram_id);
      const steps    = getUserSteps(s.telegram_id);

      const name     = s.username ? `@${s.username}` : s.first_name;
      const xp       = progress?.xp ?? 0;
      const streak   = progress?.streak ?? 0;
      const stepList = steps.length ? steps.map(n => `Ст.${n}`).join(' ') : 'триал';

      return `👤 ${name}\n   ⭐ ${xp} XP  🔥 ${streak} дн.  📚 ${stepList}`;
    });

    await ctx.reply(`👨‍🏫 Ваши ученики (${students.length}):\n\n${lines.join('\n\n')}`);
  });

  // /homework — непроверенные ДЗ учителя
  bot.command('homework', async (ctx) => {
    const teacherId = ctx.from.id;
    const user = getUser(teacherId);

    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return ctx.reply('❌ Эта команда только для учителей.');
    }

    const pending = getPendingHomework(teacherId);

    if (!pending.length) {
      return ctx.reply('✅ Нет непроверенных домашних заданий!');
    }

    await ctx.reply(`📋 Непроверенных ДЗ: ${pending.length}\n\nПроверьте каждое, нажав кнопки под пересланными сообщениями.`);
  });

  // /student @username — детальный прогресс конкретного ученика
  bot.command('student', async (ctx) => {
    const teacherId = ctx.from.id;
    const teacher = getUser(teacherId);

    if (!teacher || (teacher.role !== 'teacher' && teacher.role !== 'admin')) {
      return ctx.reply('❌ Эта команда только для учителей.');
    }

    const args = ctx.message.text.split(' ').slice(1);
    if (!args[0]) return ctx.reply('Укажите ученика: /student @username');

    const student = getUserByUsername(args[0]);
    if (!student) return ctx.reply(`Ученик ${args[0]} не найден.`);

    const progress = getProgress(student.telegram_id);
    const steps    = getUserSteps(student.telegram_id);

    const name     = student.username ? `@${student.username}` : student.first_name;
    const xp       = progress?.xp ?? 0;
    const streak   = progress?.streak ?? 0;
    const lessons  = progress?.completed_lessons?.length ?? 0;
    const words    = progress?.words_learned ?? 0;
    const stepList = steps.length ? steps.map(n => `Ступень ${n}`).join(', ') : 'Пробный период';

    await ctx.reply(
      `📊 Прогресс ${name}:\n\n` +
      `🔥 Стрик: ${streak} дн.\n` +
      `⭐ XP: ${xp}\n` +
      `📖 Уроков: ${lessons}\n` +
      `🀄 Слов: ${words}\n` +
      `🎓 Доступ: ${stepList}`
    );
  });

  // /add_lesson step1 phonetics https://youtube.com/...
  bot.command('add_lesson', async (ctx) => {
    const teacherId = ctx.from.id;
    const user = getUser(teacherId);

    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return ctx.reply('❌ Эта команда только для учителей.');
    }

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 3) {
      return ctx.reply(
        'Формат: /add_lesson step1 phonetics https://youtube.com/...\n\n' +
        'Разделы: phonetics, hieroglyphs, speaking, reading, grammar, business'
      );
    }

    const [step, section, url] = args;

    await ctx.reply(
      `✅ Ссылка добавлена!\n\n` +
      `Ступень: ${step}\n` +
      `Раздел: ${section}\n` +
      `URL: ${url}\n\n` +
      `Ученики увидят её в приложении.`
    );
  });

  // Callback-кнопки проверки ДЗ: review_ID_good / review_ID_redo
  bot.callbackQuery(/^review_(\d+)_(good|redo)$/, async (ctx) => {
    const hwId  = ctx.match[1];
    const result = ctx.match[2];

    const isGood   = result === 'good';
    const status   = isGood ? 'reviewed' : 'redo';
    const score    = isGood ? 100 : 0;
    const feedback = isGood
      ? 'Отлично выполнено! Продолжайте в том же духе 🎉'
      : 'Нужно доработать. Попробуйте ещё раз!';

    const studentId = reviewHomework(hwId, score, feedback, status);

    await ctx.answerCallbackQuery(isGood ? '✅ Принято!' : '🔄 Отправлено на доработку');
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    if (studentId) {
      const emoji = isGood ? '✅' : '🔄';
      await ctx.api.sendMessage(studentId, `${emoji} Ваше ДЗ проверено!\n\n${feedback}`);
    }
  });
}
