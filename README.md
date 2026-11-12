# Repo Radar

Лента популярных и свежих открытых проектов GitHub по категориям.

## Как работает

- GitHub Actions раз в шесть часов запрашивает GitHub Search API и сохраняет проекты в Supabase (схема `repo_radar`).
- Сайт на GitHub Pages читает ленту напрямую из Supabase, используя только publishable-ключ.
- В ленту попадают проекты с описанием и лицензией. Проекты, связанные с обходом защиты и пиратством, отфильтровываются.

## Настройка

1. Выполните миграцию схемы `repo_radar` (уже применена в проекте Supabase `tlqsmwsjeogudgijnpnu`).
2. В **Settings → Secrets and variables → Actions** добавьте секрет `SUPABASE_SERVICE_KEY` (service_role). Это секрет репозитория, в код он не попадает.
3. В **Settings → Pages** выберите источник **GitHub Actions**.
4. Запустите вручную workflow **Collect repositories**, чтобы не ждать расписания.

## Важно

Service-ключ нельзя добавлять в `config.js` или любой клиентский код: в браузере используется только publishable-ключ.
