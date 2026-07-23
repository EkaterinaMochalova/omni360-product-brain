# Omni360 Product Brain

## Настройка

1. В Supabase откройте SQL Editor и выполните `setup.sql`.
2. В Authentication → Users создайте пользователя с email и паролем.
3. Скопируйте Publishable key из Settings → API Keys.
4. Вставьте его в `config.js` вместо `PASTE_YOUR_PUBLISHABLE_KEY_HERE`.
5. Загрузите все файлы в корень GitHub-репозитория.
6. Render: Static Site, Publish Directory `.`.
7. Войдите в приложение и один раз нажмите «Импортировать исходные реквесты».

Не вставляйте Secret key или service_role key во frontend.
