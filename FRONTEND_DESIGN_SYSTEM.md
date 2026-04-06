# Frontend Design System — Quick Reference

Справочник дизайн-ассетов. Полные правила и workflow — в скилле `frontend-design`.

---

## Шрифтовые пары (Google Fonts) — готовые `<link>` теги

**1. Tech/Startup** — Space Grotesk + Inter
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

**2. Premium** — Playfair Display + Lato
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Lato:wght@400;700&display=swap" rel="stylesheet">
```

**3. Modern** — Sora + DM Sans
```html
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
```

**4. Clean** — Plus Jakarta Sans
```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**5. Bold** — Outfit + Work Sans
```html
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Work+Sans:wght@400;500;600&display=swap" rel="stylesheet">
```

**6. Editorial** — Fraunces + Source Sans 3
```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,700&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet">
```

**7. Playful** — Bricolage Grotesque + Nunito Sans
```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700&family=Nunito+Sans:wght@400;600;700&display=swap" rel="stylesheet">
```

**8. Elegant** — Cormorant Garamond + Raleway
```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Raleway:wght@400;500;600&display=swap" rel="stylesheet">
```

**9. Geometric** — Manrope
```html
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**10. Neon/Cyber** — Unbounded + PT Sans + JetBrains Mono
```html
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600;700&family=PT+Sans:wght@400;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

---

## Картинки

**Фото:** `https://picsum.photos/seed/{слово}/{ширина}/{высота}`
Seeds: `office`, `team`, `coding`, `startup`, `dashboard`, `city`, `nature`, `product`, `food`, `travel`, `architecture`, `minimal`, `abstract`, `creative`, `education`, `meeting`, `laptop`, `workspace`, `design`, `coffee`

**Аватары:** `https://i.pravatar.cc/150?img={1-70}`

**Логотипы (заглушки):** Текст с `font-bold tracking-tight opacity-40`

**Фоны:** Только CSS — gradient mesh, blur blobs, dot grid, noise

---

## CSS-фоны

```css
/* Gradient Mesh */
background:
  radial-gradient(at 20% 80%, hsl(var(--primary) / 0.15) 0%, transparent 50%),
  radial-gradient(at 80% 20%, hsl(var(--accent) / 0.1) 0%, transparent 50%),
  hsl(var(--background));

/* Dot Grid */
background-image: radial-gradient(hsl(var(--border)) 1px, transparent 1px);
background-size: 24px 24px;

/* Noise */
background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
```

```html
<!-- Blur Blobs -->
<div class="absolute inset-0 overflow-hidden -z-10">
  <div class="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
  <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
</div>
```

---

## SVG Favicon (шаблон)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="hsl(221 83% 53%)" />
  <text x="16" y="22" font-size="18" font-weight="bold" text-anchor="middle" fill="white">L</text>
</svg>
```
Заменить букву и цвет на подходящие для проекта.

---

## Связь с другими файлами

- `DESIGN_SYSTEM_NEON.md` — Neon Cyberpunk тема (тёмные проекты, Mini Apps)
- Скилл `frontend-design` — полный workflow + правила генерации
- shadcn/ui — https://ui.shadcn.com
