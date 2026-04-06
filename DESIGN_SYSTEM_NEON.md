# Дизайн-система: Neon Cyberpunk

Неоновая тёмная дизайн-система для веб-приложений. Glassmorphism + neon glow + grid background.
Впервые использована в проекте `CEO Дашборд/JTBD Analize/` (Калькулятор дохода в вайбкодинге).

---

## Шрифты

```
Unbounded     — заголовки (h1, h2, h3), акцентные элементы
PT Sans       — основной текст, лейблы, параграфы
JetBrains Mono — числа, цены, код, счётчики
```

### Подключение (Google Fonts)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600;700&family=PT+Sans:wght@400;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

### CSS

```css
body {
  font-family: 'PT Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}

h1, h2, h3 {
  font-family: 'Unbounded', sans-serif;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.mono {
  font-family: 'JetBrains Mono', monospace;
}
```

---

## Цветовая палитра

### CSS-переменные

```css
:root {
  /* Фоны */
  --bg-primary: hsl(220 20% 6%);          /* #0d0f14 — основной фон */
  --bg-secondary: hsl(220 15% 10%);       /* карточки */
  --bg-card: hsl(220 18% 10%);
  --bg-card-hover: hsl(220 18% 14%);
  --bg-glass: rgba(255, 255, 255, 0.04);  /* стекло */
  --bg-glass-strong: rgba(255, 255, 255, 0.08);

  /* Текст */
  --text-primary: hsl(180 10% 92%);       /* основной текст */
  --text-secondary: hsl(220 10% 60%);     /* вторичный */
  --text-muted: hsl(220 10% 40%);         /* приглушённый */

  /* Акцент — циановый/бирюзовый */
  --accent: hsl(160 100% 50%);            /* #00ff80 — основной акцент */
  --accent-light: hsl(160 80% 65%);       /* светлый акцент */
  --accent-glow: hsla(160, 100%, 50%, 0.3);
  --accent-gradient: linear-gradient(135deg, hsl(160 100% 50%) 0%, hsl(200 100% 55%) 100%);
  --accent-blue: hsl(200 100% 55%);       /* голубой для градиента */

  /* Неоновые свечения */
  --neon-glow: 0 0 20px hsla(160, 100%, 50%, 0.3), 0 0 60px hsla(160, 100%, 50%, 0.1);
  --neon-glow-strong: 0 0 20px hsla(160, 100%, 50%, 0.5), 0 0 60px hsla(160, 100%, 50%, 0.2), 0 0 100px hsla(160, 100%, 50%, 0.1);

  /* Границы */
  --border: hsl(220 15% 18%);
  --border-glass: hsla(160, 100%, 50%, 0.12);

  /* Статусы */
  --success: hsl(145 80% 42%);
  --destructive: hsl(0 72% 55%);
  --warning: hsl(35 95% 55%);

  /* Радиусы */
  --radius: 16px;
  --radius-sm: 10px;
  --glass-blur: 24px;
}
```

---

## Визуальные эффекты

### Grid-фон (сетка)

```css
.app::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(hsla(160, 100%, 50%, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, hsla(160, 100%, 50%, 0.04) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 0;
}
```

### Scanline-оверлей

```css
.app::after {
  content: '';
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    hsla(160, 100%, 50%, 0.015) 2px,
    hsla(160, 100%, 50%, 0.015) 4px
  );
  pointer-events: none;
  z-index: 0;
}
```

### Glassmorphism

```css
.glass {
  background: var(--bg-glass);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--border-glass);
}
```

### Gradient-текст

```css
.gradient-text {
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Текстовое свечение

```css
.text-glow {
  text-shadow: 0 0 20px hsla(160, 100%, 50%, 0.5), 0 0 40px hsla(160, 100%, 50%, 0.2);
}
```

---

## Анимации

```css
/* Появление снизу */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Более выраженное появление снизу */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Масштабное появление */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* Каскадное появление (для списков — с animation-delay на каждом элементе) */
@keyframes cascadeIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Пульсация прозрачности */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Пульсация неонового свечения */
@keyframes pulseGlow {
  0%, 100% { box-shadow: var(--neon-glow); }
  50% { box-shadow: var(--neon-glow-strong); }
}

/* Свечение */
@keyframes glow {
  0%, 100% { box-shadow: 0 0 20px var(--accent-glow); }
  50% { box-shadow: 0 0 40px var(--accent-glow), 0 0 60px hsla(160, 100%, 50%, 0.15); }
}

/* Вращение (для лоадеров) */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Блик-шиммер (для кнопок) */
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

/* Сдвиг градиента (для заголовков) */
@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Анимация неоновой границы */
@keyframes neonBorder {
  0% { border-color: hsla(160, 100%, 50%, 0.4); }
  33% { border-color: hsla(200, 100%, 55%, 0.4); }
  66% { border-color: hsla(160, 80%, 65%, 0.4); }
  100% { border-color: hsla(160, 100%, 50%, 0.4); }
}
```

### Утилити-классы анимаций

```css
.fade-in   { animation: fadeIn 0.4s ease-out; }
.slide-up  { animation: slideUp 0.5s ease-out; }
.scale-in  { animation: scaleIn 0.4s ease-out; }
```

---

## Компоненты (паттерны)

### Кнопка CTA (главная)

```css
.cta-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 16px 32px;
  background: var(--accent-gradient);
  color: var(--bg-primary);
  font-size: 17px;
  font-weight: 700;
  border-radius: var(--radius);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
  animation: pulseGlow 2s ease-in-out infinite;
}

/* Блик */
.cta-btn::after {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
}

.cta-btn:active {
  transform: scale(0.95);
}
```

### Карточка со стеклом

```css
.glass-card {
  padding: 16px 18px;
  background: var(--bg-glass);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
}
```

### Карточка выбора (квиз/опрос)

```css
.option-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: var(--bg-glass);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 500;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.option-card.selected {
  background: hsla(160, 100%, 50%, 0.1);
  border-color: hsla(160, 100%, 50%, 0.6);
  box-shadow: var(--neon-glow);
}
```

### Бейдж

```css
.badge {
  display: inline-block;
  padding: 6px 14px;
  background: var(--bg-glass);
  backdrop-filter: blur(10px);
  border: 1px solid hsla(160, 100%, 50%, 0.3);
  border-radius: 20px;
  font-size: 13px;
  color: var(--accent-light);
  width: fit-content;
  animation: neonBorder 4s ease-in-out infinite;
}
```

### Крупная цифра (доход, метрика)

```css
.big-number {
  font-family: 'JetBrains Mono', monospace;
  font-size: 36px;
  font-weight: 800;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
  filter: drop-shadow(0 0 20px hsla(160, 100%, 50%, 0.3));
}
```

### Прогресс-бар

```css
.progress-bar {
  height: 4px;
  background: var(--bg-glass-strong);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-gradient);
  background-size: 200% 100%;
  border-radius: 2px;
  transition: width 0.4s ease;
  animation: shimmer 3s linear infinite;
  box-shadow: 0 0 8px var(--accent-glow);
}
```

### Loading-орб (спиннер)

```css
.orb {
  position: relative;
  width: 90px;
  height: 90px;
}

.orb-inner {
  position: absolute;
  inset: 20px;
  background: var(--accent-gradient);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
  box-shadow: 0 0 30px var(--accent-glow);
}

.orb-ring {
  position: absolute;
  inset: 0;
  border: 2px solid transparent;
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
}

/* Внешнее кольцо */
.orb::before {
  content: '';
  position: absolute;
  inset: -8px;
  border: 1px solid transparent;
  border-bottom-color: hsla(200, 100%, 55%, 0.4);
  border-radius: 50%;
  animation: spin 2s linear infinite reverse;
}

/* Внутреннее кольцо */
.orb::after {
  content: '';
  position: absolute;
  inset: 8px;
  border: 1px solid transparent;
  border-left-color: hsla(160, 80%, 65%, 0.3);
  border-radius: 50%;
  animation: spin 1.8s linear infinite;
}
```

---

## Скроллбар

```css
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
```

---

## Где используется

| Проект | Путь |
|--------|------|
| Калькулятор дохода | `CEO Дашборд/JTBD Analize/frontend/src/styles/` |

---

## Стек

- CSS custom properties (без Tailwind, без препроцессоров)
- React / Vite
- Мобильный фокус (Telegram Mini App)
- Шрифты: Google Fonts (Unbounded + PT Sans + JetBrains Mono)
