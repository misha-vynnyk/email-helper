# Реліз десктоп-білдів

Один скрипт (`scripts/release.js`) збирає mac + win і публікує їх у GitHub Release,
тег якого відповідає `version` у `package.json`.

## Оновити поточний реліз (перезібрати з фіксами)

Версію не чіпаємо — просто перезбираємо і заміщуємо файли в існуючому релізі.

```bash
npm run release
```

Що відбувається:
1. `electron-vite build && electron-builder --mac` (arm64 + intel zip)
2. `electron-vite build && electron-builder --win` (nsis installer + portable exe)
3. Перевіряє, чи існує GitHub Release з тегом `v<version>` — якщо так, заливає нові файли
   через `gh release upload ... --clobber` (старі файли замінюються).

## Випустити нову версію

```bash
npm version patch   # 1.0.0 → 1.0.1 (або minor / major)
npm run release
git push --follow-tags
```

`npm version` піднімає `version` у `package.json`, комітить і створює git-тег локально.
`npm run release` побачить, що релізу з новим тегом ще нема на GitHub — і створить його
(з тими ж нотатками про непідписані білди, іменами файлів під нову версію).
`git push --follow-tags` в кінці — щоб комміт з бампом версії і тег потрапили в репозиторій
(інакше на GitHub залишиться реліз, не привʼязаний до жодного пуш-нутого комміту).

## Вимоги

- `gh` CLI залогінений (`gh auth status`) з правами на реліз у цьому репозиторії.
- Wine встановлений локально для крос-збірки Windows з macOS (вже стоїть, якщо `dist:win`
  раніше працював).
- Чисте робоче дерево перед `npm version` (сам npm цього вимагає).

## Файли

| Платформа | Шаблон імені |
|---|---|
| macOS (Apple Silicon) | `FlexiBuilder Pro-<version>-arm64-mac.zip` |
| macOS (Intel) | `FlexiBuilder Pro-<version>-mac.zip` |
| Windows (інсталятор) | `FlexiBuilder Pro Setup <version>.exe` |
| Windows (portable) | `FlexiBuilder Pro <version>.exe` |

Білди не підписані (немає Apple Developer / Windows code-signing сертифікатів) —
це очікувано для внутрішньої збірки, попередження про це вже в тексті релізу.
