# Репетитор по китайскому — Telegram Mini App

## О проекте
Telegram Mini App для изучения китайского языка с AI-наставником.
Целевая аудитория: русскоязычные пользователи Telegram.

## Структура проекта

```
repetitor-kitaiskui/
├── CLAUDE.md                ← Этот файл (правила проекта)
├── brief.md                 ← Спецификация MVP, wireframes, план
├── research.md              ← Исследование ниши, конкуренты
├── tg-app/                  ← TELEGRAM MINI APP (основное)
│   ├── index.html           ← Точка входа, SPA, все экраны
│   ├── style.css            ← Стили (Telegram-тема, тёмная/светлая)
│   ├── app.js               ← Вся логика: навигация, упражнения, чат
│   └── data/
│       ├── hsk1.json        ← Словарь HSK 1 (150 слов)
│       └── lessons.json     ← Структура 5 уроков с упражнениями
├── app/                     ← Старая папка (будет удалена)
│   └── data/                ← Копия данных
├── landing/                 ← Лендинг (Phase 2)
└── bot/                     ← Telegram-бот (Phase 2)
```

## Файлы — что за что отвечает

### tg-app/index.html
Единая HTML-страница (SPA). Все экраны — div-блоки с классом `.screen`.
Переключение экранов через JS (добавление/удаление класса `active`).

**Экраны в HTML (порядок — 13 экранов):**
1. `screen-welcome` — Онбординг: приветствие
2. `screen-goal` — Онбординг: выбор цели
3. `screen-level` — Онбординг: выбор уровня
4. `screen-daily-goal` — Онбординг: ежедневная цель (5/10/15/20 мин)
5. `screen-mini-lesson` — Онбординг: мини-урок из 3 вопросов ("aha moment")
6. `screen-dashboard` — Главная (дашборд)
7. `screen-lessons` — Список уроков раздела
8. `screen-exercise` — Экран упражнения
9. `screen-result` — Итог урока
10. `screen-chat` — AI-чат
11. `screen-profile` — Профиль
12. `screen-settings` — Настройки
13. `screen-pricing` — Тарифы

### tg-app/style.css
Все стили. Использует CSS-переменные Telegram (`--tg-theme-*`).
Автоматически адаптируется к светлой/тёмной теме Telegram.

**Ключевые переменные:**
- `--bg`, `--text`, `--accent` — берутся из Telegram
- `--success` / `--error` — зелёный/красный для ответов
- `--tone1..4` — цвета тонов китайского

### tg-app/app.js
Объект `App` — вся логика приложения:
- `App.init()` — инициализация
- `App.navigate(screen)` — переход между экранами
- `App.selectDailyGoal(btn)` — выбор ежедневной цели (онбординг)
- `App.renderMiniLesson()` — мини-урок в онбординге
- `App.startLesson(id)` — начать урок
- `App.renderExercise()` — отрисовка упражнения
- `App.skipExercise()` — кнопка «Не знаю» (без штрафа XP)
- `App.sendMessage()` — AI-чат
- `App.showConfetti()` — анимация confetti при завершении урока
- `App.showXpFloat(text)` — всплывающая анимация "+10 XP"
- `App.saveProgress()` / `App.loadProgress()` — сохранение

### tg-app/data/hsk1.json
150 слов HSK 1. Формат:
```json
{ "id": 1, "hanzi": "你好", "pinyin": "nǐ hǎo", "tones": [3,3], "translation": "Привет", "category": "приветствия", "examples": [...] }
```

### tg-app/data/lessons.json
5 уроков, каждый с 10 упражнениями. Типы:
- `choice_translation` — выбор перевода (иероглиф → русский)
- `choice_hanzi` — выбор иероглифа (русский → иероглиф)
- `tone_listen` — угадать тон
- `match_pairs` — сопоставление пар
- `pinyin_input` — ввод пиньинь

## Навигация между экранами

```
Онбординг: welcome → goal → level → daily-goal → mini-lesson → dashboard
Основной поток:
  dashboard → lessons (по категории) → exercise → result → dashboard
  dashboard → chat
  dashboard → profile → settings → pricing
Tab Bar: dashboard | chat | profile
BackButton: история навигации (стек)
```

## Где менять данные

| Что изменить | Где |
|---|---|
| Добавить слова | `tg-app/data/hsk1.json` → массив `words` |
| Добавить урок | `tg-app/data/lessons.json` → массив `lessons` |
| Изменить тарифы | `tg-app/index.html` → `screen-pricing` |
| Стили/цвета | `tg-app/style.css` → переменные в `:root` |
| AI-ответы чата | `tg-app/app.js` → метод `getAiReply()` |
| Логику упражнений | `tg-app/app.js` → методы `render*()` |

## Технический стек
- **Frontend:** Чистый HTML + CSS + JavaScript (без фреймворков)
- **Telegram SDK:** telegram-web-app.js (CDN)
- **AI:** Claude API (Phase 2, сейчас заглушка)
- **Голос:** Web Speech API (synthesis, zh-CN)
- **Хранилище:** Telegram CloudStorage + localStorage (fallback)
- **Данные:** JSON-файлы
- **Шрифты:** Inter (UI) + Noto Sans SC (иероглифы)
- **Хостинг:** GitHub Pages / Vercel

## Тарифы
- Бесплатно: HSK 1 (150 слов), 5 уроков, 3 вопроса AI/день
- Базовый: 690 ₽/мес — 1 раздел, безлимит AI, голос
- Полный: 1 490 ₽/мес — все разделы, HSK 1-3, отчёты
- Годовой: 11 900 ₽/год (992 ₽/мес, экономия 34%)
