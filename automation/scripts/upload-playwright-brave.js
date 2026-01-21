#!/usr/bin/env node

const { chromium } = require("playwright");
const fs = require("fs");
const pathModule = require("path");
const { execSync, exec } = require("child_process");
const http = require("http");

// === Завантаження конфігурації ===
const configPath = pathModule.join(__dirname, "..", "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// === Константи ===
const VALID_CATEGORIES = ["finance", "health"];
const GLOBAL_TIMEOUT = 120000; // 120 секунд (збільшено для інтерактивного вводу)
const FORM_SERVER_PORT = 3838;

// === Helper функції ===
function safeExec(command, showError = true) {
  try {
    return execSync(command, { encoding: "utf8" }).trim();
  } catch (err) {
    if (showError) console.error(`Помилка виконання команди: ${err.message}`);
    return null;
  }
}

function escapeShellArg(arg) {
  // Екрануємо спецсимволи для безпечного виконання shell команд
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

function playSound(type) {
  if (!config.notifications.enabled) return;
  const sound = config.notifications.sounds[type];
  if (sound) safeExec(`afplay ${escapeShellArg(sound)}`, false);
}

function showNotification(title, message) {
  if (!config.notifications.enabled) return;
  const escapedTitle = escapeShellArg(title);
  const escapedMessage = escapeShellArg(message);
  safeExec(
    `osascript -e 'display notification ${escapedMessage} with title ${escapedTitle}'`,
    false
  );
}

// === Функція для запуску форми підтвердження ===
function showConfirmationForm(fileInfo) {
  return new Promise((resolve, reject) => {
    let formData = null;
    let cancelled = false;

    const formHtmlPath = pathModule.join(__dirname, "upload-form.html");
    const formHtml = fs.readFileSync(formHtmlPath, "utf8");

    const server = http.createServer((req, res) => {
      // CORS headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
      }

      // Головна сторінка з формою
      if (req.url.startsWith("/?") || req.url === "/") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(formHtml);
        return;
      }

      // Обробка submit
      if (req.url === "/submit" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => (body += chunk.toString()));
        req.on("end", () => {
          try {
            formData = JSON.parse(body);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true }));

            // Закриваємо сервер через 500ms
            setTimeout(() => server.close(), 500);
          } catch (err) {
            res.writeHead(400);
            res.end("Invalid JSON");
          }
        });
        return;
      }

      // Обробка cancel
      if (req.url === "/cancel" && req.method === "POST") {
        cancelled = true;
        res.writeHead(200);
        res.end();
        server.close();
        return;
      }

      res.writeHead(404);
      res.end("Not found");
    });

    server.on("close", () => {
      // Даємо час серверу закритись
      setTimeout(() => {
        if (cancelled) {
          reject(new Error("Скасовано користувачем"));
        } else if (formData) {
          resolve(formData);
        } else {
          reject(new Error("Форма закрита без введення даних"));
        }
      }, 100);
    });

    server.listen(FORM_SERVER_PORT, "127.0.0.1", () => {
      const params = new URLSearchParams({
        file: fileInfo.fileName,
        size: fileInfo.fileSize,
        path: fileInfo.filePath,
      });

      if (fileInfo.presetCategory) {
        params.append("category", fileInfo.presetCategory);
      }

      if (fileInfo.clipboardContent) {
        params.append("folder", fileInfo.clipboardContent);
      }

      // Не відкриваємо URL через exec, форма вже відкрита через Playwright
      console.log(`📝 Форма підтвердження запущена на порту ${FORM_SERVER_PORT}`);
    });

    // Timeout для форми (2 хвилини)
    setTimeout(() => {
      if (!formData && !cancelled) {
        server.close();
        reject(new Error("Timeout: форма не була підтверджена вчасно"));
      }
    }, 120000);
  });
}

// === Валідація аргументів ===
const filePath = process.argv[2];
const categoryArg = process.argv[3]; // 'finance', 'health' або null
const skipConfirmation = process.argv.includes("--no-confirm") || process.argv.includes("-y");

if (!filePath || !fs.existsSync(filePath)) {
  console.error("Помилка: файл не знайдено");
  process.exit(1);
}

const fileName = pathModule.basename(filePath);
const fileSize = fs.statSync(filePath).size;
const fileSizeFormatted = (fileSize / 1024).toFixed(2) + " KB";

(async () => {
  // === Глобальний таймаут для всього процесу ===
  const timeoutId = setTimeout(() => {
    console.error("⏱️ Перевищено глобальний таймаут!");
    process.exit(1);
  }, GLOBAL_TIMEOUT);

  try {
    let serverCategory;
    let clipboardContent;
    let browser, context, page;

    // === Запускаємо Brave на початку ===
    console.log("🚀 Запуск Brave браузера...");
    const browserRunning = !!safeExec('pgrep -f "Brave Browser.*Playwright"', false);

    if (!browserRunning) {
      const browserCmd = `${escapeShellArg(
        config.browser.executablePath
      )} --remote-debugging-port=${config.browser.debugPort} --user-data-dir=${escapeShellArg(
        config.browser.userDataDir
      )} &`;
      exec(browserCmd);
      console.log("⏳ Очікування запуску браузера...");
      await new Promise((resolve) => setTimeout(resolve, config.timeouts.browserStart));
    }

    // === Підключаємося до Brave ===
    console.log("🔗 Підключення до Brave...");
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${config.browser.debugPort}`);
    context = browser.contexts()[0] || (await browser.newContext());
    page = context.pages()[0] || (await context.newPage());

    // Автоматично закриваємо всі JavaScript діалоги (confirm, alert, etc)
    page.on("dialog", (dialog) => {
      console.log(`📢 Діалог: ${dialog.message()}`);
      dialog.dismiss().catch(() => {});
    });

    // === Якщо прапорець --no-confirm, пропускаємо форму ===
    if (skipConfirmation) {
      console.log("⚡ Режим без підтвердження");

      // Категорія обов'язкова
      if (!categoryArg || !VALID_CATEGORIES.includes(categoryArg.toLowerCase())) {
        console.error(
          `Помилка: в режимі --no-confirm потрібна категорія (${VALID_CATEGORIES.join("|")})`
        );
        process.exit(1);
      }
      serverCategory = categoryArg.toLowerCase();

      // Читаємо з буферу обміну
      clipboardContent = safeExec("pbpaste");
      if (!clipboardContent) {
        console.error("Помилка: буфер обміну порожній");
        process.exit(1);
      }

      console.log(`📂 Категорія: ${serverCategory}`);
      console.log(`📋 З буферу: "${clipboardContent}"`);
    } else {
      // === ЗАВЖДИ показуємо форму для підтвердження ===
      console.log("📝 Підготовка інформації для форми...");

      // Визначаємо категорію з аргументів або шляху
      let presetCategory = null;
      if (categoryArg && VALID_CATEGORIES.includes(categoryArg.toLowerCase())) {
        presetCategory = categoryArg.toLowerCase();
      } else if (filePath.includes("Finance")) {
        presetCategory = "finance";
      } else if (filePath.includes("Health")) {
        presetCategory = "health";
      }

      // Читаємо буфер обміну для автозаповнення
      const clipboardPreview = safeExec("pbpaste", false);

      // Запускаємо HTTP сервер форми та отримуємо Promise
      console.log("🌐 Запуск HTTP сервера форми...");
      const formPromise = showConfirmationForm({
        fileName: fileName,
        fileSize: fileSizeFormatted,
        filePath: filePath,
        presetCategory: presetCategory,
        clipboardContent: clipboardPreview,
      });

      // Даємо час серверу запуститись
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Відкриваємо форму в поточній вкладці Brave
      const formUrl = `http://127.0.0.1:${FORM_SERVER_PORT}/?file=${encodeURIComponent(
        fileName
      )}&size=${encodeURIComponent(fileSizeFormatted)}&path=${encodeURIComponent(filePath)}${
        presetCategory ? `&category=${presetCategory}` : ""
      }${clipboardPreview ? `&folder=${encodeURIComponent(clipboardPreview)}` : ""}`;

      console.log("📝 Відкриття форми в Brave...");
      await page.goto(formUrl, { waitUntil: "domcontentloaded" });

      // Чекаємо відповідь від форми
      let formData;
      try {
        formData = await formPromise;
      } catch (err) {
        // Скасовано користувачем або timeout
        console.log(`❌ ${err.message}`);
        playSound("warning");
        showNotification("Storage Upload", "Завантаження скасовано");

        // Чекаємо перед закриттям (налаштування closeDelayCancel)
        if (config.browser.closeDelayCancel > 0) {
          const seconds = Math.round(config.browser.closeDelayCancel / 1000);
          console.log(`⏳ Закриття вкладки через ${seconds} секунд...`);
          await new Promise((resolve) => setTimeout(resolve, config.browser.closeDelayCancel));
        }

        // Закриваємо вкладку якщо налаштовано
        if (config.browser.autoCloseTab) {
          try {
            await page.close();
            console.log("✓ Вкладка закрита");
          } catch (e) {
            console.log("Вкладка вже закрита");
          }
        }

        // Відключаємось від браузера
        try {
          await browser.disconnect();
          console.log("✓ Відключено від браузера");
        } catch (e) {
          // Ігноруємо помилки
        }

        clearTimeout(timeoutId);
        process.exit(0);
      }

      serverCategory = formData.category;
      clipboardContent = formData.folderName;

      console.log(`✓ Підтверджено користувачем`);
      console.log(`📂 Категорія: ${serverCategory}`);
      console.log(`📋 Папка: "${clipboardContent}"`);

      // Даємо час серверу закритись
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // === Витягуємо літери та цифри ===
    const letters = clipboardContent.replace(/[^a-zA-Z]/g, "").toLowerCase();
    const digits = clipboardContent.replace(/[^0-9]/g, "");

    // === Валідація формату ===
    if (!letters || !digits) {
      console.error("Помилка: некоректний формат");
      console.error(`Очікується формат на кшталт: "ABCD123" або "Finance-456"`);
      console.error(`Отримано: "${clipboardContent}"`);
      console.error(`Літери: "${letters || "(немає)"}", Цифри: "${digits || "(немає)"}"`);
      clearTimeout(timeoutId);
      process.exit(1);
    }

    // === Формуємо шлях та ім'я ===
    const formattedName = `${letters}/lift-${digits}`;
    const formattedLink = `%2F${letters}%2Flift-${digits}`;

    console.log(`📁 Сформовано шлях: ${serverCategory}/${formattedName}`);

    // === Використовуємо ту ж вкладку для переходу на storage ===
    console.log("🌐 Перехід до storage в тій же вкладці Brave...");

    const targetURL = `${config.storage.baseUrl}/browser/files/${encodeURIComponent(
      config.storage.basePath
    )}%2F${serverCategory}${formattedLink}%2F`;
    console.log(`🌐 Завантажуємо сторінку: ${targetURL}`);
    await page.goto(targetURL, { waitUntil: "domcontentloaded" });

    // === Перевіряємо логін ===
    console.log("🔍 Перевіряємо, чи є логін...");
    const loginDetected = await Promise.race([
      page
        .waitForSelector("button#go-to-login", { timeout: config.timeouts.elementWait })
        .then(() => true)
        .catch(() => false),
      page
        .waitForSelector("#upload-main", { timeout: config.timeouts.elementWait })
        .then(() => false)
        .catch(() => false),
    ]);

    if (loginDetected) {
      console.log("🔒 Немає логіну — зупиняємо скрипт.");
      playSound("error");
      showNotification("Storage Upload", "🔒 Потрібен логін");
      clearTimeout(timeoutId);
      return;
    }

    // === Розумне очікування готовності інтерфейсу ===
    console.log("⏳ Перевіряємо готовність інтерфейсу...");
    await page.waitForSelector("#upload-main", { timeout: config.timeouts.pageLoad });

    let ready = false;
    for (let i = 0; i < config.timeouts.interfaceMaxChecks; i++) {
      ready = await page.evaluate(() => {
        const btn = document.querySelector("#upload-main");
        if (!btn) return false;
        const rect = btn.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && window.getComputedStyle(btn).opacity > 0.7;
      });
      if (ready) break;
      await page.waitForTimeout(config.timeouts.interfaceCheck);
    }

    await Promise.race([
      page.waitForSelector(".fileNameText", { timeout: 3000 }).catch(() => {}),
      page.waitForSelector('text="Empty folder"', { timeout: 3000 }).catch(() => {}),
    ]);

    console.log("✅ Інтерфейс готовий — продовжуємо.");

    // === Перевірка наявності файлу ===
    console.log(`🔍 Перевіряємо наявність файлу "${fileName}"...`);
    const fileExists = await page.evaluate((fileName) => {
      const els = document.querySelectorAll(".fileNameText");
      return Array.from(els).some((el) => el.textContent.trim() === fileName);
    }, fileName);

    const serverFilePath = `files/${config.storage.basePath}/${serverCategory}/${formattedName}/${fileName}`;

    if (fileExists) {
      console.log(`⚠️ Файл "${fileName}" вже існує — завантаження пропущено.`);
      playSound("warning");
      showNotification("Storage Upload", "❌ Файл вже існує");
      clearTimeout(timeoutId);
      return;
    }

    // === Функція завантаження з авто-повтором ===
    async function uploadFile(retry = false) {
      try {
        console.log(
          retry ? "🔁 Повторна спроба завантаження..." : "📦 Відкриваємо меню завантаження..."
        );
        await page.click("#upload-main", { timeout: config.timeouts.elementWait });

        const uploadButton = await page.waitForSelector('div[label="Upload File"]', {
          timeout: config.timeouts.elementWait + 2000,
        });
        console.log('🖱 Натискаємо "Upload File" і чекаємо filechooser...');

        const [fileChooser] = await Promise.all([
          page.waitForEvent("filechooser"),
          uploadButton.click(),
        ]);

        await fileChooser.setFiles(filePath);
        console.log(`✅ Файл ${fileName} успішно завантажено!`);

        const publicUrl = `${config.storage.publicUrl}/${serverFilePath}`;

        // Безпечне копіювання в буфер
        safeExec(`printf %s ${escapeShellArg(serverFilePath)} | pbcopy`);
        playSound("success");
        showNotification("Storage Upload", `✅ Файл завантажено: ${publicUrl}`);
        console.log(`📋 Скопійовано в буфер: ${serverFilePath}`);
        return true;
      } catch (err) {
        console.warn("⚠️ Помилка при завантаженні файлу:", err.message);
        return false;
      }
    }

    // === Перша спроба ===
    let success = await uploadFile(false);

    // === Якщо не вдалося — повторюємо ===
    if (!success && config.retries.uploadAttempts > 1) {
      console.log("⏱ Очікування перед повторною спробою...");
      await page.waitForTimeout(config.timeouts.uploadRetry);

      const fileNowExists = await page.evaluate((fileName) => {
        const els = document.querySelectorAll(".fileNameText");
        return Array.from(els).some((el) => el.textContent.trim() === fileName);
      }, fileName);

      if (!fileNowExists) {
        success = await uploadFile(true);
        if (!success) {
          showNotification("Storage Upload", "❌ Завантаження не вдалося після двох спроб");
          console.error("🚫 Не вдалося завантажити файл після двох спроб.");
        }
      } else {
        console.log(`🟡 Файл ${fileName} з'явився після затримки — повтор не потрібен.`);
      }
    }

    clearTimeout(timeoutId);

    // Закриваємо вкладку та завершуємо скрипт
    if (success) {
      console.log("🎉 Завантаження завершено успішно!");

      // Затримка перед закриттям (налаштування closeDelaySuccess)
      if (config.browser.closeDelaySuccess > 0) {
        const seconds = Math.round(config.browser.closeDelaySuccess / 1000);
        console.log(`⏳ Закриття вкладки через ${seconds} секунд...`);
        await new Promise((resolve) => setTimeout(resolve, config.browser.closeDelaySuccess));
      }

      // Закриваємо вкладку якщо налаштовано
      if (config.browser.autoCloseTab) {
        try {
          await page.close();
          console.log("✓ Вкладка закрита");
        } catch (e) {
          // Ігноруємо помилки закриття
        }
      }

      // Відключаємось від браузера (не закриваємо сам браузер!)
      try {
        await browser.disconnect();
        console.log("✓ Відключено від браузера");
      } catch (e) {
        // Ігноруємо помилки
      }

      process.exit(0);
    } else {
      console.error("❌ Завантаження не вдалося");

      // Відключаємось від браузера
      try {
        await browser.disconnect();
      } catch (e) {
        // Ігноруємо помилки
      }

      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Критична помилка:", err.message);
    playSound("error");
    showNotification("Storage Upload", `❌ Помилка: ${err.message}`);

    // Відключаємось від браузера перед виходом
    try {
      if (typeof browser !== "undefined") {
        await browser.disconnect();
      }
    } catch (e) {
      // Ігноруємо помилки
    }

    process.exit(1);
  }
})();
