#!/usr/bin/env node

const { chromium } = require("playwright-core");
const fs = require("fs");
const pathModule = require("path");
const { execSync, execFileSync } = require("child_process");
const os = require("os");
const http = require("http");

// === Завантаження конфігурації ===
const configPath = pathModule.join(__dirname, "..", "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Функція для розв'язання динамічних шляхів (наприклад, {{HOME}}, {{APP_DATA}} або ~/)
function resolveDynamicPath(p) {
  if (typeof p !== "string") return p;
  const home = os.homedir();
  const appData = process.platform === "win32" ? process.env.LOCALAPPDATA : pathModule.join(home, "Library/Application Support");

  let resolved = p.replace(/\{\{HOME\}\}/g, home).replace(/\{\{APP_DATA\}\}/g, appData);

  if (resolved.startsWith("~/")) {
    resolved = pathModule.join(home, resolved.slice(2));
  }
  return resolved;
}

// Функція для пошуку Brave на різних ОС
function findBraveExecutable() {
  const platform = process.platform;
  const envPath = process.env.BRAVE_EXECUTABLE_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;

  const configPath = config.browser.executablePath;
  if (configPath && fs.existsSync(configPath)) return configPath;

  if (platform === "darwin") {
    const macPath = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
    if (fs.existsSync(macPath)) return macPath;
  } else if (platform === "win32") {
    const winPaths = [pathModule.join(process.env.PROGRAMFILES || "C:\\Program Files", "BraveSoftware\\Brave-Browser\\Application\\brave.exe"), pathModule.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "BraveSoftware\\Brave-Browser\\Application\\brave.exe"), pathModule.join(process.env.LOCALAPPDATA || "", "BraveSoftware\\Brave-Browser\\Application\\brave.exe")];
    for (const wp of winPaths) {
      if (wp && fs.existsSync(wp)) return wp;
    }
  } else if (platform === "linux") {
    const linuxPaths = ["/usr/bin/brave-browser", "/usr/bin/brave"];
    for (const lp of linuxPaths) {
      if (fs.existsSync(lp)) return lp;
    }
  }
  return configPath; // Повертаємо що було в конфігу як fallback
}

// Застосовуємо розв'язання шляхів до основних налаштувань
config.browser.userDataDir = resolveDynamicPath(config.browser.userDataDir);
config.browser.executablePath = findBraveExecutable();

if (config.browserProfiles) {
  Object.values(config.browserProfiles).forEach((profile) => {
    if (profile.userDataDir) profile.userDataDir = resolveDynamicPath(profile.userDataDir);
  });
}

// Env overrides for cross-machine setup (no edit of config.json needed)
if (process.env.BRAVE_EXECUTABLE_PATH) config.browser.executablePath = process.env.BRAVE_EXECUTABLE_PATH;
if (process.env.BRAVE_USER_DATA_DIR) config.browser.userDataDir = process.env.BRAVE_USER_DATA_DIR;

// === Константи ===
let VALID_CATEGORIES = ["finance", "health"];
const GLOBAL_TIMEOUT = 300000; // 5 хвилин (збільшено для повільного інтерфейсу)

// Генеруємо зміщення портів на основі UID користувача macOS та PORT_ID інстансу
let uidOffset = 0;
try {
  const uid = os.userInfo().uid;
  if (typeof uid === "number" && uid > 501) {
    uidOffset = (uid - 501) * 100;
  }
} catch (e) {}

// Додаємо зміщення від PORT_ID (100 портів на кожен інстанс для безпеки)
const portId = parseInt(process.env.PORT_ID || "0");
const instanceOffset = portId * 100;

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  const val = process.argv[idx + 1];
  if (!val || val.startsWith("-")) return null;
  return val;
}

const provider = String(getArgValue("--provider") || process.env.STORAGE_PROVIDER || "default").toLowerCase();

// === Провайдери та профілі ===
if (Array.isArray(config.storageProviders?.default?.categories)) {
  VALID_CATEGORIES = config.storageProviders.default.categories;
}

const storageProviders = config.storageProviders || {
  default: {
    bucket: "files",
    usesCategory: true,
    consoleRootPrefix: config.storage?.basePath || "Promo",
    publicBaseUrl: config.storage?.publicUrl || "",
    publicPathPrefix: "files",
    publicRootPrefix: config.storage?.basePath || "Promo",
    bootstrapWaitMs: 60000,
  },
};
const selectedStorage = storageProviders[provider] || storageProviders.default;
const loginWaitMs = Number(selectedStorage.loginWaitMs ?? 600000); // default: 10 minutes
const bootstrapWaitMs = Number(selectedStorage.bootstrapWaitMs ?? 120000); // initial UI/login detect window

const browserProfiles = config.browserProfiles || {
  default: {
    debugPort: config.browser?.debugPort,
    userDataDir: config.browser?.userDataDir,
  },
};
const selectedBrowser = browserProfiles[provider] || browserProfiles.default;

const consoleBaseUrl = config.storage?.baseUrl || config.storage?.baseURL || config.storage?.url || config.storage?.base || "https://storage.epcnetwork.dev";
if (selectedBrowser?.debugPort) config.browser.debugPort = selectedBrowser.debugPort;
if (config.browser.debugPort) {
  // Додаємо зміщення порту для різних macOS юзерів та різних інстансів
  config.browser.debugPort += (uidOffset + instanceOffset);
  if (config.browser.debugPort < 1024 || config.browser.debugPort > 49151) {
    console.warn(`⚠️ Debug port ${config.browser.debugPort} виходить за безпечний діапазон (1024–49151), скидаємо до базового порту провайдера.`);
    config.browser.debugPort = selectedBrowser?.debugPort ?? 9222;
  }
}

if (selectedBrowser?.userDataDir) config.browser.userDataDir = resolveDynamicPath(selectedBrowser.userDataDir);
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

// === Валідація аргументів ===
const isFinalize = process.argv.includes("--finalize") || process.argv.includes("--close-tab");
const filePath = process.argv[2];
const rest = process.argv
  .slice(3)
  .filter((x) => !["--no-confirm", "-y"].includes(x))
  .filter((x, i, arr) => !(x === "--provider" || arr[i - 1] === "--provider"));
const categoryArg = rest[0] || null;
const folderNameArg = rest[1] || null;

if (!isFinalize) {
  if (!filePath || !fs.existsSync(filePath)) {
    console.error("Помилка: файл не знайдено");
    process.exit(1);
  }
}

const fileName = isFinalize ? null : pathModule.basename(filePath);

// === Helper: check if Brave is listening on CDP port ===
async function isCdpAvailable(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/json/version`, { timeout: 2000 }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const info = JSON.parse(data);
          resolve(info.webSocketDebuggerUrl || null);
        } catch {
          resolve(null);
        }
      });
    });
    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
  });
}

// === Helper: launch Brave as a detached process (survives script exit) ===
function launchBraveDetached(execPath, userDataDir, debugPort) {
  const { spawn: spawnChild } = require("child_process");
  const args = [`--user-data-dir=${userDataDir}`, `--remote-debugging-port=${debugPort}`, "--remote-allow-origins=*", "--disable-features=DownloadBubble,DownloadBubbleV2", "--disable-component-update", "--no-first-run", "--no-default-browser-check", "--disable-component-extensions-with-background-pages"];
  const child = spawnChild(execPath, args, {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
  return child;
}

(async () => {
  let timeoutId;

  // === Функція для безпечного виходу ===
  // IMPORTANT: We NEVER close the browser — we only disconnect.
  // This keeps Brave alive so the login session persists for the next run.
  const safeExit = async (code) => {
    if (timeoutId) clearTimeout(timeoutId);

    try {
      if (typeof browser !== "undefined" && browser) {
        // Always disconnect, never close — keep the browser alive
        await browser.disconnect();
      }
    } catch (e) {
      // ignore cleanup errors
    }

    process.exit(code);
  };

  // === Глобальний таймаут для всього процесу ===
  timeoutId = setTimeout(async () => {
    console.error("⏱️ Перевищено глобальний таймаут!");
    await safeExit(1);
  }, GLOBAL_TIMEOUT);

  try {
    let serverCategory;
    let clipboardContent;
    let browser, context, page;

    // Додаємо PORT_ID до шляху профілю, щоб інстанси не блокували один одного
    if (portId > 0) {
      config.browser.userDataDir = `${config.browser.userDataDir}-${portId}`;
    }

    const effectiveUserDataDir = config.browser.userDataDir;

    // Pre-create the user data directory so Brave doesn't fail with a permissions dialog
    if (!fs.existsSync(effectiveUserDataDir)) {
      fs.mkdirSync(effectiveUserDataDir, { recursive: true });
      console.log(`📁 Створено директорію профілю: ${effectiveUserDataDir}`);
    }

    const debugPort = config.browser.debugPort;
    const cdpUrl = `http://127.0.0.1:${debugPort}`;

    // === STEP 1: Try to connect to an already-running Brave via CDP ===
    console.log(`🔍 Перевіряємо чи Brave вже запущений (CDP порт ${debugPort})...`);
    let wsUrl = await isCdpAvailable(debugPort);

    if (wsUrl) {
      // Brave is already running with this profile — just connect
      console.log("✅ Brave вже працює — підключаємось через CDP...");
      try {
        browser = await chromium.connectOverCDP(cdpUrl);

        const contexts = browser.contexts();
        context = contexts.length > 0 ? contexts[0] : null;

        if (!context) {
          console.error("❌ Не знайдено активний контекст браузера");
          throw new Error("No browser context available");
        }

        const pages = context.pages();
        // Reuse an existing storage tab if available; otherwise create a fresh page via CDP.
        // Never reuse about:blank — it may be Brave's New Tab page which CDP cannot navigate.
        page = pages.find((p) => p.url().includes("storage.epcnetwork.dev")) || (await context.newPage());

        await page.bringToFront();
        console.log(`📂 USER DATA DIR: ${effectiveUserDataDir} (CDP reuse)`);
      } catch (cdpErr) {
        console.warn(`⚠️ CDP підключення не вдалось: ${cdpErr.message}`);
        // Disconnect the stale browser object so Step 2 knows to relaunch
        if (browser) {
          try { await browser.disconnect(); } catch {}
          browser = null;
          context = null;
        }
        wsUrl = null; // Fall through to launch
      }
    }

    // === STEP 2: If CDP connect failed, launch Brave as a detached process and then connect ===
    if (!wsUrl || !browser) {
      // Wait for any lingering Brave process to fully release the CDP port before launching a new one.
      // Without this, isCdpAvailable() returns true for the dying process and we connect to it again.
      for (let i = 0; i < 12; i++) {
        const portBusy = await isCdpAvailable(debugPort);
        if (!portBusy) break;
        await new Promise((r) => setTimeout(r, 500));
      }

      console.log("🚀 Запуск нового екземпляра Brave...");

      try {
        launchBraveDetached(config.browser.executablePath, effectiveUserDataDir, debugPort);
        console.log(`📂 USER DATA DIR: ${effectiveUserDataDir}`);

        // Wait for Brave to start and CDP to become available
        let cdpReady = false;
        for (let attempt = 0; attempt < 30; attempt++) {
          await new Promise((r) => setTimeout(r, 1000));
          wsUrl = await isCdpAvailable(debugPort);
          if (wsUrl) {
            cdpReady = true;
            break;
          }
          if (attempt % 5 === 4) {
            console.log(`⏳ Чекаємо на запуск Brave... (${attempt + 1}s)`);
          }
        }

        if (!cdpReady) {
          console.error("❌ Brave не запустився за 30 секунд");
          throw new Error("Brave startup timeout");
        }

        console.log("✅ Brave запущений — підключаємось через CDP...");
        browser = await chromium.connectOverCDP(cdpUrl);

        const contexts = browser.contexts();
        context = contexts.length > 0 ? contexts[0] : null;

        if (!context) {
          console.error("❌ Не знайдено активний контекст браузера");
          throw new Error("No browser context available after launch");
        }

        // Wait a bit for any startup tabs to appear
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const startupPages = context.pages();
        // Create a fresh navigatable page, then close any startup tabs Brave opened automatically.
        page = startupPages.find((p) => p.url().includes("storage.epcnetwork.dev")) || (await context.newPage());
        for (const p of startupPages) {
          if (p !== page) await p.close().catch(() => {});
        }
        await page.bringToFront();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);

        if (msg.includes("user data directory is already in use")) {
          console.error("❌ Помилка: Цей профіль Brave вже використовується іншим вікном.");
          console.error("💡 Будь ласка, закрийте всі вікна Brave (профіль Playwright) і спробуйте знову.");
        } else {
          console.error(`❌ Не вдалося запустити Brave: ${msg}`);
        }
        throw err;
      }
    }

    // === Finalize: close current tab after batch (but keep browser alive) ===
    if (isFinalize) {
      try {
        // Only close the specific tab, not the whole browser
        const pages = context.pages();
        // Close storage tabs only
        for (const p of pages) {
          const url = p.url();
          if (url.includes("storage.epcnetwork.dev") || url.includes("minio")) {
            await p.close().catch(() => {});
          }
        }
      } catch (e) {}
      await safeExit(0);
    }

    // alert() має лише OK — приймаємо; для confirm/prompt/beforeunload — dismiss (Cancel)
    page.on("dialog", async (dialog) => {
      console.log(`📢 Діалог [${dialog.type()}]: ${dialog.message()}`);
      if (dialog.type() === "alert") {
        await dialog.accept().catch(() => {});
      } else {
        await dialog.dismiss().catch(() => {});
      }
    });

    if (selectedStorage.usesCategory) {
      if (!categoryArg || !VALID_CATEGORIES.includes(categoryArg.toLowerCase())) {
        console.error(`Помилка: потрібна категорія (${VALID_CATEGORIES.join("|")})`);
        await safeExit(1);
      }
      serverCategory = categoryArg.toLowerCase();
    } else {
      serverCategory = categoryArg ? categoryArg.toLowerCase() : null;
    }

    clipboardContent = folderNameArg;
    if (!clipboardContent) {
      if (process.platform === "darwin") {
        clipboardContent = safeExec("pbpaste", false);
      } else {
        console.warn("⚠️ Будь ласка, вкажіть назву папки як аргумент.");
      }
    }

    if (!clipboardContent) {
      console.error("Помилка: потрібна назва папки (4-й аргумент) або буфер обміну (macOS)");
      await safeExit(1);
    }

    if (selectedStorage.usesCategory) console.log(`📂 Категорія: ${serverCategory}`);
    console.log(`📋 Папка: "${clipboardContent}"`);

    // === Валідація формату ===
    if (typeof clipboardContent !== "string") {
      console.error("Помилка: clipboardContent не є рядком");
      await safeExit(1);
    }

    const letters = clipboardContent.replace(/[^a-zA-Z]/g, "").toLowerCase();
    const digits = clipboardContent.replace(/[^0-9]/g, "");

    if (!letters || !digits || letters.length > 20 || digits.length > 20) {
      console.error("Помилка: некоректний формат або занадто довга назва");
      console.error(`Очікується формат на кшталт: "ABCD123" або "Finance-456"`);
      console.error(`Отримано: "${clipboardContent}"`);
      console.error(`Літери: "${letters || "(немає)"}", Цифри: "${digits || "(немає)"}"`);
      await safeExit(1);
    }

    // === Формуємо шлях та ім'я ===
    const folderPrefix = selectedStorage.folderPrefix || "lift-";
    const formattedName = `${letters}/${folderPrefix}${digits}`;
    console.log(`📁 Сформовано шлях: ${selectedStorage.usesCategory ? `${serverCategory}/` : ""}${formattedName}`);

    // === Використовуємо ту ж вкладку для переходу на storage ===
    console.log("🌐 Перехід до storage в тій же вкладці Brave...");

    const consoleParts = [selectedStorage.consoleRootPrefix];
    if (selectedStorage.usesCategory) consoleParts.push(serverCategory);
    consoleParts.push(formattedName);
    const consolePath = consoleParts.filter(Boolean).join("/");

    const targetURL = `${consoleBaseUrl}/browser/${selectedStorage.bucket}/${encodeURIComponent(consolePath)}%2F`;
    console.log(`🌐 Завантажуємо сторінку: ${targetURL}`);
    let response;
    try {
      response = await page.goto(targetURL, { waitUntil: "load", timeout: 60000 });
      if (response && !response.ok()) {
        console.warn(`⚠️ Сторінка повернула статус ${response.status()}. Можливо, потрібен VPN або доступ обмежений.`);
      }
    } catch (err) {
      console.error(`❌ Не вдалося завантажити сторінку: ${err.message}`);
      console.error("💡 ПІДКАЗКА: Перевірте, чи підключено VPN та чи доступний сервер сховища.");
      await safeExit(1);
    }

    // === Логін / UI ready (robust, slow-friendly) ===
    console.log("🔍 Очікуємо MinIO UI або логін...");

    // Обидві promise завжди resolve (null при timeout) — жодних висячих rejects
    const uploadP = page.waitForSelector("#upload-main", { timeout: bootstrapWaitMs }).then(() => "upload").catch(() => null);
    const loginP = page.waitForSelector("button#go-to-login", { timeout: bootstrapWaitMs }).then(() => "login").catch(() => null);

    // Перший ненульовий результат перемагає; якщо обидві timeout — null
    const state = await new Promise((resolve) => {
      uploadP.then((v) => v && resolve(v));
      loginP.then((v) => v && resolve(v));
      Promise.all([uploadP, loginP]).then(([u, l]) => resolve(u || l || null));
    });

    if (state === "login") {
      playSound("error");

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
      console.error("❌ Помилка виявлення UI: елементи не знайдено за відведений час.");
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
      await new Promise((r) => setTimeout(r, config.timeouts.interfaceCheck));
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
      await safeExit(1);
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

        if (process.platform === "darwin") {
          try {
            execFileSync("pbcopy", [], { input: serverFilePath, encoding: "utf8", stdio: ["pipe", "ignore", "ignore"] });
          } catch {}
        }
        playSound("success");
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
      await new Promise((r) => setTimeout(r, config.timeouts.uploadRetry));

      const fileNowExists = await page.evaluate((fileName) => {
        const els = document.querySelectorAll(".fileNameText");
        return Array.from(els).some((el) => el.textContent.trim() === fileName);
      }, fileName);

      if (!fileNowExists) {
        success = await uploadFile(true);
        if (!success) {
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

    await safeExit(1);
  }
})();
