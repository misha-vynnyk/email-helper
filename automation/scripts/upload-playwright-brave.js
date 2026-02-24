#!/usr/bin/env node

const { chromium } = require("playwright-core");
const fs = require("fs");
const pathModule = require("path");
const { execSync, exec, execFileSync } = require("child_process");
const os = require("os");
const http = require("http");

// === Завантаження конфігурації ===
const configPath = pathModule.join(__dirname, "..", "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
// Env overrides for cross-machine setup (no edit of config.json needed)
if (process.env.BRAVE_EXECUTABLE_PATH) config.browser.executablePath = process.env.BRAVE_EXECUTABLE_PATH;
if (process.env.BRAVE_USER_DATA_DIR) config.browser.userDataDir = process.env.BRAVE_USER_DATA_DIR;

// === Константи ===
let VALID_CATEGORIES = ["finance", "health"];
const GLOBAL_TIMEOUT = 120000; // 120 секунд (збільшено для інтерактивного вводу)
const FORM_SERVER_PORT = 3838;

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  const val = process.argv[idx + 1];
  if (!val || val.startsWith("-")) return null;
  return val;
}

const provider = String(getArgValue("--provider") || process.env.STORAGE_PROVIDER || "default").toLowerCase();

let sharedStorageConfig = null;
try {
  const sharedConfigPath = pathModule.join(__dirname, "..", "..", "src", "htmlConverter", "storageProviders.json");
  sharedStorageConfig = JSON.parse(fs.readFileSync(sharedConfigPath, "utf8"));
} catch {
  // optional config
}

if (typeof sharedStorageConfig?.systemNotifications?.enabled === "boolean") {
  config.notifications.enabled = sharedStorageConfig.systemNotifications.enabled;
}
if (typeof sharedStorageConfig?.systemNotifications?.soundsEnabled === "boolean") {
  config.notifications.soundsEnabled = sharedStorageConfig.systemNotifications.soundsEnabled;
}

if (Array.isArray(sharedStorageConfig?.providers?.default?.categories)) {
  VALID_CATEGORIES = sharedStorageConfig.providers.default.categories;
}

const storageProviders = sharedStorageConfig?.providers ||
  config.storageProviders || {
    default: {
      bucket: "files",
      usesCategory: true,
      consoleRootPrefix: config.storage?.basePath || "Promo",
      publicBaseUrl: config.storage?.publicUrl || "",
      publicPathPrefix: "files",
      publicRootPrefix: config.storage?.basePath || "Promo",
    },
  };
const selectedStorage = storageProviders[provider] || storageProviders.default;
const loginWaitMs = Number(selectedStorage.loginWaitMs ?? 600000); // default: 10 minutes
const bootstrapWaitMs = Number(selectedStorage.bootstrapWaitMs ?? 30000); // initial UI/login detect window

const browserProfiles = sharedStorageConfig?.browserProfiles ||
  config.browserProfiles || {
    default: {
      debugPort: config.browser?.debugPort,
      userDataDir: config.browser?.userDataDir,
    },
  };
const selectedBrowser = browserProfiles[provider] || browserProfiles.default;

const consoleBaseUrl = sharedStorageConfig?.consoleBaseUrl || config.storage?.baseUrl || config.storage?.baseURL || config.storage?.url || config.storage?.base || "https://storage.epcnetwork.dev";
if (selectedBrowser?.debugPort) config.browser.debugPort = selectedBrowser.debugPort;
if (selectedBrowser?.userDataDir) config.browser.userDataDir = selectedBrowser.userDataDir;
if (typeof selectedBrowser?.autoCloseTab === "boolean") {
  config.browser.autoCloseTab = selectedBrowser.autoCloseTab;
}

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
  if (process.platform !== "darwin") return;
  const soundsEnabled = config.notifications.soundsEnabled ?? config.notifications.enabled;
  if (!soundsEnabled) return;
  const sound = config.notifications.sounds[type];
  if (!sound) return;
  try {
    execFileSync("afplay", [sound], { stdio: "ignore" });
  } catch {
    // ignore
  }
}

function showNotification(title, message) {
  if (process.platform !== "darwin") return;
  if (!config.notifications.enabled) return;
  const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, "\\n");
  const script = `display notification "${esc(message)}" with title "${esc(title)}"`;
  try {
    execFileSync("osascript", ["-e", script], { stdio: "ignore" });
  } catch {
    // ignore
  }
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
const isFinalize = process.argv.includes("--finalize") || process.argv.includes("--close-tab");
const filePath = process.argv[2];
const rest = process.argv
  .slice(3)
  .filter((x, i, arr) => !["--no-confirm", "-y"].includes(x))
  .filter((x, i, arr) => !(x === "--provider" || arr[i - 1] === "--provider"));
const categoryArg = rest[0] || null; // 'finance', 'health' або null
const folderNameArg = rest[1] || null; // для --no-confirm, інакше з форми/буфера
const skipConfirmation = process.argv.includes("--no-confirm") || process.argv.includes("-y");

if (!isFinalize) {
  if (!filePath || !fs.existsSync(filePath)) {
    console.error("Помилка: файл не знайдено");
    process.exit(1);
  }
}

const fileName = isFinalize ? null : pathModule.basename(filePath);
const fileSize = isFinalize ? 0 : fs.statSync(filePath).size;
const fileSizeFormatted = isFinalize ? "" : (fileSize / 1024).toFixed(2) + " KB";

(async () => {
  // === Функція для безпечного виходу ===
  const safeExit = async (code) => {
    clearTimeout(timeoutId);
    if (typeof browser !== "undefined" && browser) {
      if (code !== 0 && typeof page !== "undefined" && page) {
        try {
          await page.close(); // Close stuck tab on error so next run gets a fresh one
        } catch (e) {}
      }
      try {
        await browser.disconnect();
      } catch (e) {
        // ignore
      }
    }
    process.exit(code);
  };

  // === Глобальний таймаут для всього процесу ===
  const timeoutId = setTimeout(async () => {
    console.error("⏱️ Перевищено глобальний таймаут!");
    await safeExit(1);
  }, GLOBAL_TIMEOUT);

  try {
    let serverCategory;
    let clipboardContent;
    let browser, context, page;

    // === Запускаємо Brave / підключаємось по CDP ===
    console.log("🚀 Brave (CDP)...");
    const cdpUrl = `http://127.0.0.1:${config.browser.debugPort}`;

    // Ensure userDataDir is writable. If not, fall back to a temp directory.
    let effectiveUserDataDir = config.browser.userDataDir;
    try {
      // Try to create directory if it doesn't exist and check writability
      if (!fs.existsSync(effectiveUserDataDir)) {
        fs.mkdirSync(effectiveUserDataDir, { recursive: true });
      }
      fs.accessSync(effectiveUserDataDir, fs.constants.W_OK);
    } catch (e) {
      const fallbackDir = pathModule.join(os.tmpdir(), `BravePlaywright-${Date.now()}`);
      try {
        fs.mkdirSync(fallbackDir, { recursive: true });
        effectiveUserDataDir = fallbackDir;
        console.warn(`⚠️ userDataDir ${config.browser.userDataDir} is not writable — falling back to ${effectiveUserDataDir}`);
      } catch (ee) {
        console.error(`❌ Cannot create fallback userDataDir (${fallbackDir}): ${ee.message}`);
        throw ee;
      }
    }

    const browserCmd = `${escapeShellArg(config.browser.executablePath)} --remote-debugging-port=${config.browser.debugPort} --user-data-dir=${escapeShellArg(effectiveUserDataDir)} --remote-debugging-address=127.0.0.1 &`;

    const connectOverCdp = async () => chromium.connectOverCDP(cdpUrl);

    try {
      console.log(`🔗 Підключення до Brave: ${cdpUrl}`);
      browser = await connectOverCdp();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("ECONNREFUSED")) throw err;

      if (isFinalize) {
        // Nothing to close if browser isn't running
        await safeExit(0);
      }

      console.log(`🧭 CDP недоступний на ${cdpUrl} — запускаємо Brave...`);
      exec(browserCmd);
      console.log("⏳ Очікування запуску браузера...");

      // Poll for CDP availability (give Brave more time to start)
      const attemptDelay = 500;
      const maxAttempts = Math.max(10, Math.ceil((config.timeouts.browserStart || 1500) / attemptDelay));
      let connected = false;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          browser = await connectOverCdp();
          connected = true;
          break;
        } catch (e) {
          await new Promise((resolve) => setTimeout(resolve, attemptDelay));
        }
      }

      if (!connected) {
        throw new Error(`browserType.connectOverCDP: connect ECONNREFUSED 127.0.0.1:${config.browser.debugPort}`);
      }
    }
    context = browser.contexts()[0] || (await browser.newContext());
    page = context.pages()[0] || (await context.newPage());

    // === Finalize: close current tab after batch ===
    if (isFinalize) {
      try {
        await page.close();
      } catch {
        // ignore
      }
      try {
        await browser.disconnect();
      } catch {
        // ignore
      }
      await safeExit(0);
    }

    // Автоматично закриваємо всі JavaScript діалоги (confirm, alert, etc)
    page.on("dialog", (dialog) => {
      console.log(`📢 Діалог: ${dialog.message()}`);
      dialog.dismiss().catch(() => {});
    });

    // === Якщо прапорець --no-confirm, пропускаємо форму ===
    if (skipConfirmation) {
      console.log("⚡ Режим без підтвердження");

      if (selectedStorage.usesCategory) {
        // Категорія обов'язкова
        if (!categoryArg || !VALID_CATEGORIES.includes(categoryArg.toLowerCase())) {
          console.error(`Помилка: в режимі --no-confirm потрібна категорія (${VALID_CATEGORIES.join("|")})`);
          await safeExit(1);
        }
        serverCategory = categoryArg.toLowerCase();
      } else {
        serverCategory = categoryArg ? categoryArg.toLowerCase() : null;
      }

      // folderName: з argv (крос-платформно) або з буфера на macOS
      clipboardContent = folderNameArg || (process.platform === "darwin" ? safeExec("pbpaste", false) : null);
      if (!clipboardContent) {
        console.error("Помилка: в режимі --no-confirm потрібна назва папки (4-й аргумент) або буфер обміну (macOS)");
        await safeExit(1);
      }

      if (selectedStorage.usesCategory) console.log(`📂 Категорія: ${serverCategory}`);
      console.log(`📋 Папка: "${clipboardContent}"`);
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
      const formUrl = `http://127.0.0.1:${FORM_SERVER_PORT}/?file=${encodeURIComponent(fileName)}&size=${encodeURIComponent(fileSizeFormatted)}&path=${encodeURIComponent(filePath)}${presetCategory ? `&category=${presetCategory}` : ""}${clipboardPreview ? `&folder=${encodeURIComponent(clipboardPreview)}` : ""}`;

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

        await safeExit(0);
      }

      serverCategory = formData.category;
      clipboardContent = formData.folderName;

      console.log(`✓ Підтверджено користувачем`);
      if (selectedStorage.usesCategory) console.log(`📂 Категорія: ${serverCategory}`);
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
      await safeExit(1);
    }

    // === Формуємо шлях та ім'я ===
    const formattedName = `${letters}/lift-${digits}`;
    console.log(`📁 Сформовано шлях: ${selectedStorage.usesCategory ? `${serverCategory}/` : ""}${formattedName}`);

    // === Використовуємо ту ж вкладку для переходу на storage ===
    console.log("🌐 Перехід до storage в тій же вкладці Brave...");

    const consoleParts = [selectedStorage.consoleRootPrefix];
    if (selectedStorage.usesCategory) consoleParts.push(serverCategory);
    consoleParts.push(formattedName);
    const consolePath = consoleParts.filter(Boolean).join("/");

    const targetURL = `${consoleBaseUrl}/browser/${selectedStorage.bucket}/${encodeURIComponent(consolePath)}%2F`;
    console.log(`🌐 Завантажуємо сторінку: ${targetURL}`);
    await page.goto(targetURL, { waitUntil: "domcontentloaded" });

    // === Логін / UI ready (robust, slow-friendly) ===
    console.log("🔍 Очікуємо MinIO UI або логін...");

    const state = await Promise.any([page.waitForSelector("#upload-main", { timeout: bootstrapWaitMs }).then(() => "upload"), page.waitForSelector("button#go-to-login", { timeout: bootstrapWaitMs }).then(() => "login")]).catch(() => null);

    if (state === "login") {
      playSound("error");
      showNotification("Storage Upload", `🔒 Потрібен логін. Очікую до ${Math.round(loginWaitMs / 1000)}s...`);

      // Best-effort: navigate to login screen
      try {
        await page.click("button#go-to-login", { timeout: 1000 });
      } catch {
        // ignore
      }

      console.log(`🔒 Login required — waiting for #upload-main (timeout ${Math.round(loginWaitMs / 1000)}s)...`);
      try {
        await page.waitForSelector("#upload-main", { timeout: loginWaitMs });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("Target page, context or browser has been closed")) {
          console.error("ERROR:BROWSER_CLOSED (user closed Brave before completing login)");
        } else {
          console.error("ERROR:LOGIN_TIMEOUT (user did not login in time)");
        }
        await safeExit(1);
      }
    } else if (state !== "upload") {
      console.error("ERROR:UPLOAD_UI_TIMEOUT (MinIO UI did not show upload/login controls)");
      clearTimeout(timeoutId);
      await safeExit(1);
    }

    // === Розумне очікування готовності інтерфейсу ===
    console.log("⏳ Перевіряємо готовність інтерфейсу...");

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

    await Promise.race([page.waitForSelector(".fileNameText", { timeout: 3000 }).catch(() => {}), page.waitForSelector('text="Empty folder"', { timeout: 3000 }).catch(() => {})]);

    console.log("✅ Інтерфейс готовий — продовжуємо.");

    // === Перевірка наявності файлу ===
    console.log(`🔍 Перевіряємо наявність файлу "${fileName}"...`);
    const fileExists = await page.evaluate((fileName) => {
      const els = document.querySelectorAll(".fileNameText");
      return Array.from(els).some((el) => el.textContent.trim() === fileName);
    }, fileName);

    const publicParts = [selectedStorage.publicPathPrefix, selectedStorage.publicRootPrefix];
    if (selectedStorage.usesCategory) publicParts.push(serverCategory);
    publicParts.push(formattedName, fileName);
    const serverFilePath = pathModule.posix.join(...publicParts.filter(Boolean));

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
        console.log(retry ? "🔁 Повторна спроба завантаження..." : "📦 Відкриваємо меню завантаження...");
        await page.click("#upload-main", { timeout: config.timeouts.elementWait });

        const uploadButton = await page.waitForSelector('div[label="Upload File"]', {
          timeout: config.timeouts.elementWait + 2000,
        });
        console.log('🖱 Натискаємо "Upload File" і чекаємо filechooser...');

        const [fileChooser] = await Promise.all([page.waitForEvent("filechooser"), uploadButton.click()]);

        await fileChooser.setFiles(filePath);
        console.log(`✅ Файл ${fileName} успішно завантажено!`);

        const publicUrl = `${String(selectedStorage.publicBaseUrl).replace(/\/+$/, "")}/${serverFilePath}`;

        // Безпечне копіювання в буфер
        process.platform === "darwin" && safeExec(`printf %s ${escapeShellArg(serverFilePath)} | pbcopy`, false);
        playSound("success");
        showNotification("Storage Upload", `✅ Файл завантажено: ${publicUrl}`);
        console.log(`📋 Скопійовано в буфер: ${serverFilePath}`);
        console.log(`RESULT_JSON=${JSON.stringify({ provider, filePath: serverFilePath, publicUrl })}`);
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

      await safeExit(0);
    } else {
      await safeExit(1);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Target page, context or browser has been closed") || msg.toLowerCase().includes("browser has been closed")) {
      console.error("ERROR:BROWSER_CLOSED (user closed Brave before completing flow)");
    }
    console.error("❌ Критична помилка:", msg);
    playSound("error");
    showNotification("Storage Upload", `❌ Помилка: ${msg}`);

    await safeExit(1);
  }
})();
