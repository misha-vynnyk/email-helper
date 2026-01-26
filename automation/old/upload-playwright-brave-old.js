const { chromium } = require('playwright')
const fs = require('fs')
const pathModule = require('path')
const { execSync, exec } = require('child_process')

const filePath = process.argv[2]
if (!filePath || !fs.existsSync(filePath)) {
  console.error("Ошибка: файл не найден")
  process.exit(1)
}

// === Определяем категорию ===
let serverCategory
if (filePath.includes('Finance')) serverCategory = 'finance'
else if (filePath.includes('Health')) serverCategory = 'health'
else {
  console.error("Ошибка: не удалось определить категорию файла (Finance/Health)")
  process.exit(1)
}

// === Формируем путь и имя ===
const parentFolder = pathModule.basename(pathModule.dirname(filePath))
const letters = parentFolder.replace(/[^a-zA-Z]/g, '').toLowerCase()
const digits = parentFolder.replace(/[^0-9]/g, '')
const formattedName = `${letters}/lift-${digits}`
const formattedLink = `%2F${letters}%2Flift-${digits}`
const fileName = pathModule.basename(filePath)

  ; (async () => {
    // === Проверяем, запущен ли Brave ===
    let browserRunning = false
    try {
      const output = execSync('pgrep -f "Brave Browser.*Playwright"').toString()
      browserRunning = !!output
    } catch {
      browserRunning = false
    }

    if (!browserRunning) {
      exec(
        `/Applications/Brave\\ Browser.app/Contents/MacOS/Brave\\ Browser --remote-debugging-port=9222 --user-data-dir="/Users/mykhailo.vynnyk/Library/Application Support/BravePlaywright" &`
      )
      console.log("🚀 Запуск браузера...")
      await new Promise(resolve => setTimeout(resolve, 1500))

      // скрываем окно сразу после запуска
      // exec(`osascript -e 'tell application "System Events" to set visible of process "Brave Browser" to false'`)
    }

    // === Подключаемся к браузеру ===
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
    const context = browser.contexts()[0] || await browser.newContext()
    const page = context.pages()[0] || await context.newPage()

    const targetURL = `https://storage.epcnetwork.dev/browser/files/Promo%2F${serverCategory}${formattedLink}%2F`
    console.log(`🌐 Загружаем страницу: ${targetURL}`)
    await page.goto(targetURL, { waitUntil: 'domcontentloaded' })

    // === Проверяем логин ===
    console.log("🔍 Проверяем, есть ли логин...")
    const loginDetected = await Promise.race([
      page.waitForSelector('button#go-to-login', { timeout: 5000 }).then(() => true).catch(() => false),
      page.waitForSelector('#upload-main', { timeout: 5000 }).then(() => false).catch(() => false)
    ])

    if (loginDetected) {
      console.log('🔒 Нет логина — останавливаем скрипт.')
      execSync(`afplay /System/Library/Sounds/Basso.aiff`)
      execSync(`osascript -e 'display notification "🔒 Login required" with title "Storage Upload"'`)
      return
    }

    // === Умное ожидание готовности интерфейса ===
    console.log("⏳ Проверяем готовность интерфейса...")

    // ждём появления кнопки загрузки
    await page.waitForSelector('#upload-main', { timeout: 10000 })

    // ускоренная проверка — максимум 2 секунды на ожидание активности
    let ready = false
    for (let i = 0; i < 10; i++) {
      ready = await page.evaluate(() => {
        const btn = document.querySelector('#upload-main')
        if (!btn) return false
        const rect = btn.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0 && window.getComputedStyle(btn).opacity > 0.7
      })
      if (ready) break
      await page.waitForTimeout(200)
    }

    // ждём появления списка или надписи "Empty folder"
    await Promise.race([
      page.waitForSelector('.fileNameText', { timeout: 3000 }).catch(() => { }),
      page.waitForSelector('text="Empty folder"', { timeout: 3000 }).catch(() => { })
    ])

    console.log("✅ Интерфейс готов — продолжаем.")

    // === Проверка наличия файла ===
    console.log(`🔍 Проверяем наличие файла "${fileName}"...`)
    const fileExists = await page.evaluate((fileName) => {
      const els = document.querySelectorAll('.fileNameText')
      return Array.from(els).some(el => el.textContent.trim() === fileName)
    }, fileName)

    const serverFilePath = `files/Promo/${serverCategory}/${formattedName}/${fileName}`

    if (fileExists) {
      console.log(`⚠️ Файл "${fileName}" уже существует — загрузка пропущена.`)
      execSync(`afplay /System/Library/Sounds/Sosumi.aiff`)
      execSync(`osascript -e 'display notification "❌ File already exists" with title "Storage Upload"'`)
      return
    }

    // === Функция загрузки с авто-повтором ===
    async function uploadFile(retry = false) {
      try {
        console.log(retry ? '🔁 Повторная попытка загрузки...' : '📦 Открываем меню загрузки...')
        await page.click('#upload-main', { timeout: 5000 })

        const uploadButton = await page.waitForSelector('div[label="Upload File"]', { timeout: 7000 })
        console.log('🖱 Нажимаем "Upload File" и ждём filechooser...')

        const [fileChooser] = await Promise.all([
          page.waitForEvent('filechooser'),
          uploadButton.click()
        ])

        await fileChooser.setFiles(filePath)
        console.log(`✅ Файл ${fileName} успешно загружен!`)

        execSync(`printf "${serverFilePath.trim()}" | pbcopy`)
        execSync(`afplay /System/Library/Sounds/Blow.aiff`)
        execSync(`osascript -e 'display notification "✅ File uploaded: https://storage.5th-elementagency.com/${serverFilePath}" with title "Storage Upload"'`)
        console.log(`📋 Скопировано в буфер: ${serverFilePath}`)
        return true
      } catch (err) {
        console.warn('⚠️ Ошибка при загрузке файла:', err.message)
        return false
      }
    }

    // === Первая попытка ===
    let success = await uploadFile(false)

    // === Если не удалось — повторяем через 2 секунды ===
    if (!success) {
      console.log('⏱ Ожидание перед повторной попыткой...')
      await page.waitForTimeout(2000)
      const fileNowExists = await page.evaluate((fileName) => {
        const els = document.querySelectorAll('.fileNameText')
        return Array.from(els).some(el => el.textContent.trim() === fileName)
      }, fileName)
      if (!fileNowExists) {
        success = await uploadFile(true)
        if (!success) {
          execSync(`osascript -e 'display notification "❌ Upload failed twice" with title "Storage Upload"'`)
          console.error('🚫 Не удалось загрузить файл после двух попыток.')
        }
      } else {
        console.log(`🟡 Файл ${fileName} появился после задержки — повтор не нужен.`)
      }
    }
  })()
