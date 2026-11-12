# Repo Radar

**Languages:** [Русский](#русский) · [English](#english)

**Live website:** https://peteroxhka.github.io/repo-radar/  
**Source code:** https://github.com/Peteroxhka/repo-radar  
**Build guide:** [How to create a similar website with Supabase](docs/BUILD_WITH_SUPABASE.md)

---

# Русский

## Что такое Repo Radar

**Repo Radar** — открытый веб-каталог проектов на GitHub. Он помогает находить интересные репозитории, инструменты разработчика, проекты искусственного интеллекта, игры, веб-приложения, учебные материалы и проекты для работы с данными.

Вместо того чтобы искать по отдельным страницам GitHub, можно открыть одну ленту, ввести название проекта или полный адрес `владелец/репозиторий`, выбрать категорию и настроить сортировку. Проекты сохраняют ссылки на исходный код и автора. Если в метаданных действительно указан адрес опубликованного сайта на `*.github.io`, появляется и отдельная ссылка на него.

Проект задуман не как замена GitHub и не как хранилище копий чужого исходного кода. Это **публичный индекс метаданных репозиториев** с собственным интерфейсом обнаружения проектов.

## Возможности

### Поиск и каталог

- Поиск по имени репозитория, а также по точному пути `owner/repository`. Ник владельца сам по себе не должен подменять совпадение по названию.
- Дополнительный поиск по описанию и темам, включаемый отдельно.
- Категории: код, инструменты, ИИ, данные, веб, обучение, игры, консольные WebKit и неклассифицированные проекты.
- Сортировки по количеству звёзд (от больших к меньшим и обратно), недавним изменениям, дате создания и числу форков.
- Фильтрация по языку программирования, постепенная загрузка каталога и счётчики категорий.
- Исключение форков и архивных репозиториев из публичной выдачи.
- Выделение официального репозитория Repo Radar и прямые ссылки на исходники и сайт.

### Консольные WebKit

В отдельной категории собираются проекты, в метаданных которых одновременно упоминаются WebKit и конкретные игровые консоли. Доступны фильтры **консоль**, **версия проекта**, **версия прошивки** и **тип прошивки**; названия консолей отсортированы по алфавиту. Для PS4 предусмотрены семейства версий вплоть до `14.XX`.

**Важно:** упоминание версии в репозитории или наличие варианта в фильтре **не является доказательством совместимости** с определённой консолью или прошивкой. Сайт не запускает код из найденных репозиториев.

### Console Hub — определение консоли

На главной странице есть отдельная кнопка **«Консольный центр»**, ведущая на [Console Hub](https://peteroxhka.github.io/ConsoleWebKit/). Поддерживается определение браузеров PS3, PS4, PS5, PS Vita, Wii U, Nintendo Switch и Xbox, а также ручной выбор консоли на случай, если браузер скрывает модель.

- Автоматическая проверка читает только `navigator.userAgent`. Некоторые версии PS4 и PS5 сообщают предполагаемую прошивку в этой строке.
- Если прошивка не обнаружена, её можно указать вручную. **Ни автоматический, ни ручной ввод не гарантируют фактической совместимости стороннего проекта.**
- Кнопка каталога открывает проекты выбранной консоли; если устройство неизвестно, доступна полная консольная подборка.
- Console Hub использует обычный JavaScript без современных фреймворков для лучшей совместимости со старыми браузерами.
- **Console Hub не запускает эксплойты, джейлбрейк или обход защиты:** это диагностическая и информационная страница.

### Карточки и описание проекта

Нажатие на карточку открывает окно с плавной анимацией. В нём находятся:

- область изображения проекта и краткое описание сбоку;
- подробное описание на **русском** и **английском** в отдельных переключаемых вкладках;
- ссылки на исходники, автора и опубликованный сайт, если адрес известен;
- метаданные проекта: категория, язык программирования и количество звёзд.

Вместо галереи скриншотов используется **одно изображение проекта**. Если автор не предоставил доступное изображение, показывается локальное изображение-заглушка с надписью `* But nobody came.`. Его чёрный фон, пиксельный шрифт и исходная композиция сохранены.

Для собственного проекта Repo Radar подробные описания подготовлены на двух языках. Репозитории сторонних авторов могут не иметь перевода: в этом случае сайт показывает оригинальное описание и явно сообщает об отсутствии подтверждённого перевода, не выдавая машинные догадки за слова разработчика.

### Интерфейс и сообщество

- Тёмная, светлая и космическая темы; выбор сохраняется в браузере.
- Бледно-зелёный текст главного блока в космической теме при сохранении фиолетового оформления.
- Поддержка современных браузеров на Windows, macOS, Linux, Android и iOS, адаптивная вёрстка для телефонов и планшетов.
- Плавные анимации с учётом настройки «Уменьшение движения».
- Переключатель интерфейса между 12 языками. Описания сторонних проектов не переводятся автоматически.
- Авторизация по электронной почте и через GitHub OAuth с помощью Supabase Auth.
- Профили, аватары, личные сообщения и ограниченная загрузка файлов.

Обычные сообщения защищены политиками доступа Supabase (RLS), но **не имеют сквозного шифрования**. Для новых сообщений и файлов доступен **добровольный E2EE по общему секрету**.

### Шифрование сообщений и файлов

1. Откройте переписку и нажмите **«Шифрование»**.
2. Создайте надёжный общий секрет (от 12 символов) и передайте собеседнику **вне этого чата**.
3. Оба пользователя вводят одинаковый секрет. Ключ выводится в браузере с помощью **PBKDF2 / SHA-256, 240 000 итераций**, а новые сообщения и файлы шифруются **AES-256-GCM** со случайным nonce.
4. Секрет не сохраняется в браузере или Supabase: после обновления страницы либо перехода на другое устройство его нужно снова ввести. Потеря секрета означает невозможность восстановить зашифрованную переписку.

**Ограничения:** зашифрованные файлы до 15 МБ, текст примерно до 2600 символов (или меньше для многобайтовых символов). Старые сообщения остаются незашифрованными. Имена, размеры и MIME-типы файлов, участники переписки и время сообщений остаются видимыми серверу. Общий секрет не подтверждает личность собеседника; проверка безопасности независимыми аудиторами не проводилась. Приложение не следует считать полноценным защищённым мессенджером.

### Просмотр вложений

Кнопка «+» открывает **встроенное меню вложений**: фото, видео, музыка и аудио, документы и файлы. На телефоне после выбора типа откроется системный файловый интерфейс, которым управляют Android/iOS и браузер. Сайт не может принудительно заменить оформление системного окна выбора приложения.


Изображения и поддерживаемые видео и аудиофайлы отображаются **непосредственно в переписке** с обычными браузерными элементами просмотра. Для PDF, документов и архивов предусмотрена карточка с оригинальным именем файла, размером и кнопкой открытия. Файлы остаются в закрытом Supabase Storage, доступ к ним выдаётся через короткоживущие подписанные ссылки. Зашифрованные файлы расшифровываются локально в браузере.

### Административная панель

Панель администратора доступна только подтверждённому владельцу Repo Radar через GitHub OAuth. Доступ проверяется **в Supabase на стороне сервера**, а не по видимости кнопки или редактируемому нику.

Владелец может смотреть сводку по каталогу, находить репозитории, переходить на их GitHub-страницы, скрывать записи и возвращать их обратно. Действия с видимостью записываются в журнал.

Кнопка **Connect Supabase / Привязать Supabase** проверяет существующее подключение и может проверить публичный API другого проекта по публичному ключу. Это **не** подключение чужого проекта для управления и **не** перенос рабочей базы. Сервисные ключи и пароли в браузере вводить нельзя.

## Архитектура

| Компонент | Назначение |
| --- | --- |
| HTML, CSS, JavaScript | Интерфейс и логика браузера |
| GitHub Pages | Статический хостинг |
| GitHub Actions | Тестирование, публикация и периодическое обновление каталога |
| GitHub API | Публичные сведения о репозиториях |
| Supabase Postgres | Каталог, профили и сообщения |
| Supabase Auth | Электронная почта и GitHub OAuth |
| Supabase Storage | Файлы и аватары с ограничениями доступа |
| Row Level Security | Контроль прав на уровне базы данных |

**Важно для безопасности:** в клиентском коде допустим только публичный publishable/anon key. Пароль базы, GitHub OAuth Client Secret и секретные ключи Supabase нельзя коммитить или вставлять на страницу.

## Как запустить собственную копию

1. Создайте собственный проект Supabase и сохраните его URL и **публичный publishable key**.
2. Изучите SQL-файлы в каталоге `supabase/migrations/`. Это история развития действующей базы, а не универсальный установщик: часть миграций зависит от предыдущей схемы. Применяйте их только в правильном порядке и после резервного копирования.
3. Разрешите доступ к требуемой публичной схеме через настройки Supabase API. Настройте RLS так, чтобы гости могли читать только публичные данные, но не изменять каталог и не читать личные сообщения.
4. Укажите **свои** URL и публичный ключ в `config.js`. Не используйте чужой проект.
5. Для GitHub OAuth создайте приложение в Developer Settings GitHub и настройте callback на `https://ВАШ-ПРОЕКТ.supabase.co/auth/v1/callback`. Адрес своего сайта добавьте в разрешённые URL Supabase Auth.
6. Создайте собственный репозиторий, включите GitHub Pages с источником **GitHub Actions**.
7. Для серверного импортёра, если он нужен, добавьте собственный Supabase service-role/secret key исключительно в закрытые **GitHub Actions Secrets**.
8. Проверьте поиск, авторизацию, права, мобильную вёрстку и возврат с OAuth на двух отдельных тестовых аккаунтах.

**Не копируйте привязку администратора к GitHub identity владельца Repo Radar.** Для другого проекта нужна ваша собственная подтверждённая учётная запись и отдельная настройка прав.

Развёрнутая инструкция: **[BUILD_WITH_SUPABASE.md](docs/BUILD_WITH_SUPABASE.md)**.

## Проверка качества и ограничения

Для локальных тестов:

```bash
node --test tests/*.test.mjs
node --input-type=module --check < app.js
node --check lib/core.mjs
```

Сборка в GitHub Actions проверяет JavaScript и тесты, затем готовит версионированные статические ресурсы для GitHub Pages. Успешная публикация **не гарантирует** исправную работу Supabase, входа или внешних API: проверяйте их отдельно в браузере.

Работа каталога зависит от GitHub API, сетевых ограничений и доступности Supabase. Репозитории могут не иметь описания, лицензии или опубликованной страницы. Публичный GitHub-репозиторий не обязательно распространяется под открытой лицензией: перед использованием чужого кода проверьте его условия.

---

# English

## What is Repo Radar?

**Repo Radar** is an open-source web catalog for discovering GitHub repositories. It brings developer utilities, AI projects, games, web applications, educational resources, and data tools into a single searchable interface.

Instead of browsing many unrelated pages, visitors can search by a repository's name or its exact `owner/repository` path, choose a category, and select a meaningful sort order. Every listing keeps a link to the original source and its author. If GitHub metadata supplies a verified `*.github.io` website, a direct website link is displayed as well.

Repo Radar is **not** a GitHub replacement and does not mirror third-party source repositories. It is a public metadata index with a discovery-focused interface.

## Features

### Catalog and discovery

- Repository-title search and exact `owner/repository` lookup. Owner handles alone are not used as title matches.
- Optional searching in repository descriptions and topics.
- Categories for code, developer tools, AI, data, web, learning, games, Console WebKit, and uncategorized projects.
- Sorting by GitHub stars, least-starred first, last activity, creation date, and fork count.
- Programming-language filtering, paginated loading, and category counts.
- Forks and archived projects excluded from normal public results.
- A first-party Repo Radar feature block linking directly to the official code and website.

### Console WebKit catalog

The dedicated Console WebKit category groups repositories whose published metadata explicitly mentions both WebKit and a gaming console. Extra selectors cover **console**, **project version**, **reported firmware version**, and **firmware type**. Console names appear alphabetically, and the PS4 series filter includes families up to `14.XX`.

**Compatibility warning:** a firmware version shown in metadata or offered as a filter is **not independent confirmation of compatibility**. Repo Radar does not execute code from indexed repositories.

### Console Hub — platform and firmware hints

The homepage has a dedicated **[Console Hub](https://peteroxhka.github.io/ConsoleWebKit/)** button. It supports conservative browser identification and manual console selection for PS3, PS4, PS5, PS Vita, Wii U, Nintendo Switch, and Xbox.

- Automatic identification inspects only `navigator.userAgent`; some PS4/PS5 browsers include a **firmware hint** in this value.
- Visitors can manually select a platform and provide a firmware number when automatic identification fails. **Neither a user-agent hint nor a manually entered version proves actual project compatibility.**
- The catalog link opens matching platform projects. If no console is detected or selected, it opens the overall console collection.
- The standalone page uses classic JavaScript for broader legacy browser support.
- **Console Hub does not run exploits, jailbreaks, or security bypasses:** it is a read-only diagnostics and discovery interface.

### Project detail view

Selecting a project opens a smoothly animated detail panel containing:

- one project image with a short description beside it;
- separate **Russian** and **English** long-description tabs;
- source, author, and available website links;
- programming language, category, and actual GitHub stars.

Screenshot galleries have been removed. When a project has no usable image, the site uses the locally bundled `* But nobody came.` placeholder, preserving the original black background, pixel-style lettering, and composition.

Repo Radar itself has editorial long-form descriptions in both languages. For third-party repositories, the original maintainer's text is retained; when a verified translation has not been provided, the interface explicitly says so rather than inventing one.

### Design, users, and community

- Dark, light, and cosmic appearance modes saved in the browser.
- Pale green landing-page typography in the cosmic theme while retaining its purple background.
- Responsive layouts for modern desktop and mobile browsers on Windows, macOS, Linux, Android, and iOS.
- Animated cards and dialogs with support for reduced-motion preferences.
- A 12-language interface, with English as the default for new visitors.
- Email/password and GitHub OAuth sign-in through Supabase Auth.
- Profiles, avatars, direct messages, and restricted attachment uploads.

Ordinary direct messages are protected by Supabase RLS but **are not end-to-end encrypted**. An **optional shared-secret E2EE mode** protects **new** messages and attachments.

### Message and attachment encryption

1. Select a contact and open **Encryption**.
2. Choose a strong shared secret (at least 12 characters) and exchange it **outside the chat**.
3. Both people enter the same secret. The browser derives the key with **PBKDF2 / SHA-256 (240,000 iterations)** and encrypts new messages and files using **AES-256-GCM** and a fresh random nonce.
4. Keys and secrets are held **only in browser memory**, not localStorage or Supabase. Re-enter the secret on every device or after a reload. There is no recovery if it is lost.

**Limits and caveats:** encrypted files are limited to 15 MB and text to approximately 2,600 characters (fewer for multibyte Unicode). Earlier messages remain plaintext. The server still sees sender/recipient IDs, timestamps, original filenames, MIME types, and file sizes. Shared secrets do not independently authenticate the other person; the implementation has not undergone independent security auditing. Do not treat this prototype as a fully audited secure messenger.

### Native attachment previews

The "+" button opens a **custom attachment menu** with photos, videos, music/audio, and documents/files. On mobile, the browser/operating system still owns the native picker shown after the selection; a website cannot force a particular system app chooser.


Images appear as inline previews, video and audio play using browser controls, and PDFs, archives, and documents use a card showing the original filename, file size, and an open action. Existing files remain in a private Supabase Storage bucket with temporary signed URLs. Encrypted files are decrypted locally before being displayed or downloaded.

### Owner-only administration

The private admin panel is restricted to the verified GitHub identity of Repo Radar's owner. Authorization is enforced by **server-side Supabase functions**, not by a hidden menu item or an editable display name.

The owner can inspect catalog totals, find projects, open their original GitHub pages, hide unsuitable listings, and restore them. Visibility changes are logged.

The **Connect Supabase** control checks the existing project or tests a separate project's public API with a publishable key. It **does not** grant administrative access to another database, move data, or persist external keys. Never enter private credentials into browser-side forms.

## Technical architecture

| Technology | Responsibility |
| --- | --- |
| HTML, CSS, JavaScript | Client interface and user interactions |
| GitHub Pages | Static hosting |
| GitHub Actions | Tests, deployment, and periodic catalog collection |
| GitHub API | Public repository metadata |
| Supabase Postgres | Catalog, profiles, messages |
| Supabase Auth | Email and GitHub OAuth sign-in |
| Supabase Storage | Restricted file and avatar storage |
| Row Level Security (RLS) | Database authorization |

Only a **public publishable/anon key** belongs in browser JavaScript. Never expose a Supabase secret/service-role key, a database password, or a GitHub OAuth Client Secret.

## Self-hosting and setup

1. Create a **new Supabase project** and obtain its URL and public publishable key.
2. Review the SQL scripts in `supabase/migrations/`. They reflect the evolution of a live database and are **not** a one-click generic installer. Back up your database and apply dependencies in order.
3. Expose only the required public schema via Supabase API settings. Enable RLS and restrict write operations and private messages appropriately.
4. Configure `config.js` with your **own** Supabase URL and public key.
5. For GitHub OAuth, create an app in GitHub Developer Settings and set its callback to your Supabase Auth callback `https://YOUR-PROJECT.supabase.co/auth/v1/callback`. Allow your deployment URL in Supabase Auth redirect settings.
6. Push your fork to your own GitHub repository and enable Pages via **GitHub Actions**.
7. If you enable server-side GitHub discovery, place the required service-role/secret key **only** in protected GitHub Actions Secrets.
8. Test login, search, access controls, mobile layouts, and redirects using multiple accounts.

Do **not** reuse this deployment's specific administrator OAuth identity. Your own instance must have its own explicitly verified administrator and server-side authorization rules.

For more detail, see **[the Supabase + GitHub Pages setup guide](docs/BUILD_WITH_SUPABASE.md)**.

## Tests, limitations, and responsible use

Run the main checks with:

```bash
node --test tests/*.test.mjs
node --input-type=module --check < app.js
node --check lib/core.mjs
```

GitHub Actions validates code, runs tests, and publishes versioned static assets. A green deployment job confirms that the static files were built; it does **not** guarantee that Supabase authentication, storage, or external APIs are available at runtime.

Repository coverage depends on API limits and collection schedules. Some projects have no description, license, translation, or published website. Public availability on GitHub does not necessarily permit unrestricted reuse; check each repository's license and terms before copying code.

---

## Maintainer / Поддержка

- Source / Исходный код: https://github.com/Peteroxhka/repo-radar
- Live site / Сайт: https://peteroxhka.github.io/repo-radar/
- Setup guide / Инструкция: [BUILD_WITH_SUPABASE.md](docs/BUILD_WITH_SUPABASE.md)
