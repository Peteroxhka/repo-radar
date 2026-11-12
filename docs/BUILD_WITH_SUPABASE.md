# Create your own GitHub catalog with Supabase
# Как самостоятельно создать похожий сайт с Supabase

> **Русский — ниже.** A concise English walkthrough follows at the end.
> A working static site needs **GitHub Pages (frontend)**, **Supabase (database + authentication)** and an optional **GitHub Actions importer**.

## 1. Что ты будешь создавать

Repo Radar — пример архитектуры без собственного круглосуточно работающего сервера:

- **GitHub Pages** раздаёт HTML, CSS и JavaScript.
- **Supabase Postgres** хранит публичный каталог проектов, профили и (при необходимости) сообщения.
- **Supabase Auth** отвечает за регистрацию и вход, в том числе через GitHub OAuth.
- **Supabase Storage** хранит разрешённые вложения с политиками доступа.
- **GitHub Actions** периодически обращается к GitHub API и обновляет каталог.

Не копируй чужие ключи Supabase, JWT и GitHub OAuth Secrets. Ключ **service_role** допускается только в серверных секретах CI и **никогда** в JavaScript, HTML, публичном репозитории или форму сайта.

## 2. Зарегистрируй свой Supabase

1. Открой [supabase.com](https://supabase.com), создай новый проект и дождись готовности базы.
2. В **Project Settings / API** найди **Project URL** и публичный **Publishable key** (`sb_publishable_…`).
3. В новом GitHub-репозитории создай `config.js`:

```js
export const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_YOUR_PUBLIC_KEY";
export const DATABASE_SCHEMA = "repo_radar";
```

Эти два значения предназначены для браузера. Но **secret key**, **service_role**, пароль базы и OAuth Client Secret должны храниться в закрытых настройках Supabase/GitHub Secrets.

## 3. Сделай таблицу каталога и защиту RLS

В **Supabase → SQL Editor** для *своего нового проекта* можно начать с такой минимальной схемы. Это учебный вариант, не замена полной схеме Repo Radar:

```sql
create schema if not exists repo_radar;

create table if not exists repo_radar.repos (
  id bigint primary key,
  full_name text not null,
  name text not null,
  owner_login text not null,
  description text,
  html_url text not null,
  language text,
  stars integer not null default 0,
  category text not null default 'other',
  is_fork boolean not null default false,
  is_archived boolean not null default false,
  admin_hidden boolean not null default false
);

alter table repo_radar.repos enable row level security;
create policy "Public catalog read only" on repo_radar.repos
  for select to anon, authenticated
  using (not is_fork and not is_archived and not admin_hidden);

grant usage on schema repo_radar to anon, authenticated;
grant select on repo_radar.repos to anon, authenticated;
revoke insert, update, delete on repo_radar.repos from anon, authenticated;
```

Добавь `repo_radar` в список **API Exposed Schemas** в настройках Supabase, если он не включён. Это необходимо, чтобы браузер мог читать таблицу через REST API. Для своего полноценного клона Repo Radar используй полный список миграций из `supabase/migrations/`, применяя их **по порядку и с резервной копией**. Некоторые миграции рассчитаны на уже существующую базу: предварительно изучи их, не запускай вслепую. Миграция админки этого проекта содержит привязку к конкретной подтверждённой GitHub identity владельца — её нельзя использовать без адаптации под **свою** identity.

## 4. Подключи JavaScript к Supabase

Пример получения публичных репозиториев:

```js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./config.js";

const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  db: { schema: "repo_radar" }
});

const { data, error } = await client
  .from("repos")
  .select("id,name,full_name,html_url,stars,description")
  .eq("is_fork", false)
  .order("stars", { ascending: false })
  .limit(30);

if (error) console.error(error);
else console.log(data);
```

Показывай пользовательские названия и описания через `textContent`, а не вставкой в `innerHTML`. Проверяй URL перед созданием ссылок. В браузере никогда не вызывай административные операции с секретным ключом.

## 5. Включи регистрацию и GitHub OAuth

1. В Supabase открой **Authentication → Providers → GitHub**.
2. На GitHub создай OAuth App в своих **Developer Settings**. 
3. Callback OAuth App должен указывать на *твой Supabase*, например:
   `https://YOUR-PROJECT.supabase.co/auth/v1/callback`.
4. Скопируй **Client ID** и **Client Secret** в конфигурацию провайдера GitHub в Supabase.
5. В **Authentication → URL Configuration** разреши URL своего будущего сайта на GitHub Pages, например `https://YOURNAME.github.io/MY-REPO/`.
6. Убедись, что регистрации пользователей разрешены, если собираешься принимать новые аккаунты.

Если возникает `Provider is not enabled`, проверь именно **Auth → Providers**, а не GitHub Integration проекта. Если после входа происходит редирект на `localhost`, исправь Site URL и Redirect URLs.

## 6. Публикация на GitHub Pages

1. Создай репозиторий на GitHub и добавь `index.html`, `app.js`, `styles.css`, `config.js`.
2. В **Settings → Pages** выбери публикацию через **GitHub Actions**.
3. Используй пример `.github/workflows/pages.yml` из Repo Radar, адаптировав его под структуру своего сайта.
4. Проверь Actions: статус **Success** означает, что файлы успешно опубликованы, но не гарантирует, что OAuth или SQL работают.
5. Открой свой Pages URL и проверь запросы, регистрацию, поиск и права пользователей.
6. Добавляй номер сборки к статическим ресурсам, чтобы после обновления не оставался старый JavaScript в кеше.

## 7. Автоматически добавляй проекты

GitHub API поддерживает поиск репозиториев с условием `fork:false archived:false`. Старайся сохранять подробные результаты поиска, а не массово собирать тысячи репозиториев с пустыми описаниями. Импортёр выполняется в **GitHub Actions** и записывает строки в Supabase сервисным ключом из **GitHub Repository Secrets**.

Важные требования:

- Исключай форки и архивные репозитории при импорте и на чтении.
- Делай импорт небольшими пачками и обрабатывай ошибки сети и тайм-ауты.
- Не считай звёзды главным условием включения проекта: новые хорошие проекты могут иметь ноль звёзд.
- Храни оригинальный GitHub repository ID, чтобы не было дубликатов.
- Поиск по названию и сортировку выполняй на сервере и тестируй на реальных данных.

## 8. Защищённая админка

Скрытая HTML-кнопка **не является защитой**. Админские действия должны выполняться отдельными SQL RPC, использующими `auth.uid()` и подтверждённую OAuth identity. Настрой `SECURITY DEFINER` осторожно: минимальные разрешения, явный `search_path`, никаких произвольных SQL-команд и секретов в браузере. Учитывай, что клонируемая миграция `20261118_admin_catalog.sql` закрепляет права за владельцем текущего Repo Radar — для своего проекта нужно подставить проверенную **собственную identity**, не копировать идентификатор другого человека.

Никогда не открывай публичный доступ к `auth.users`, таблицам закрытых сообщений и спискам админов.

## 9. Кнопка «Connect Supabase» в Repo Radar

В админке Repo Radar эта кнопка умеет проверить уже действующий Supabase и протестировать публичный endpoint другого проекта с **публичным** publishable-ключом. Она **не** подключает чужой проект для управления, **не** сохраняет введённый ключ и **не** меняет рабочую базу сайта.

Если в будущем требуется полноценная интеграция с несколькими проектами, понадобится отдельный серверный OAuth/management backend, хранение токенов в защищённом хранилище, явные разрешения и возможность отзыва доступа. Нельзя делать это через `service_role` в браузере.

## 10. Что проверить перед публичным запуском

- Гость видит только публичный каталог.
- Пользователь A не может читать сообщения пользователя B.
- Только подтверждённый владелец может скрыть проект через сервер.
- Вложения имеют ограничения форматов, размеров и прав доступа.
- Регистрация, возврат с GitHub OAuth и выход работают.
- Поиск работает по названию и точному `owner/repo`, а фильтры не скрывают результаты незаметно.
- На телефоне видны меню, кнопки и модальные окна.
- Ошибки и лимиты API не ломают весь интерфейс.

---

## English quick start

1. Create a Supabase project and copy **Project URL** + a **public publishable key** into `config.js`. Never commit a service-role key.
2. Create an RLS-protected `repo_radar.repos` table; grant anonymous users **SELECT only** on visible public records.
3. Add `repo_radar` to Supabase exposed API schemas.
4. Connect the browser with `createClient()` using only a public key.
5. Configure Supabase Auth GitHub provider, GitHub OAuth callback `https://PROJECT.supabase.co/auth/v1/callback`, and the GitHub Pages redirect URL.
6. Deploy with GitHub Actions / Pages, and cache-bust JavaScript and CSS assets after releases.
7. Optionally collect GitHub repos in CI; store a service-role key **only** in GitHub Secrets. Exclude forks and import in small retryable batches.
8. Enforce admin authorization on the server using a verified OAuth identity and narrowly scoped RPCs.
9. Test search, RLS, registration, redirects, small screens, and file access before going public.

**Source:** [Repo Radar](https://github.com/Peteroxhka/repo-radar) — study the migration order and adapt configuration to your own project.
