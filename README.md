# Lingua — платформа изучения английского

Монорепозиторий. Сейчас: **этап 1 — фундамент** (`apps/api`).
Фронтенд (`apps/web`, Next.js) появится на этапе 2 вместе с первыми экранами.

## Быстрый старт

```bash
docker compose up -d postgres          # PostgreSQL 16 (+ redis, пока не используется)
cd apps/api
cp .env.example .env                    # сменить JWT_ACCESS_SECRET и SEED_ADMIN_PASSWORD
npm install
npm run db:migrate                      # применить миграции
npm run db:seed                         # создать администратора
npm run dev                             # http://localhost:3001/api/v1
```

Swagger: http://localhost:3001/api/docs (в production отключён).

Сквозная проверка (API должен быть запущен с `NODE_ENV=test`, это отключает rate limit):

```bash
NODE_ENV=test npm run dev
npm run test:smoke                      # 50+ проверок ролей, согласий и доступов
```

## Стек

NestJS 11 · TypeScript · PostgreSQL 16 · Drizzle ORM · argon2 · JWT + ротируемые refresh-токены · class-validator · Swagger

**Drizzle вместо Prisma** (изменение относительно плана): нет бинарного движка, меньше
образ и холодный старт, запросы ближе к SQL, а частичные уникальные индексы
(«один активный куратор», «одно действующее согласие») описываются прямо в схеме.

## Что сделано на этапе 1

**Роли:** STUDENT, PARENT (публичная регистрация), CURATOR, ADMIN (создаёт только админ).

**Аутентификация.** Access JWT 15 минут; refresh-токен хранится в БД как хеш и
ротируется при каждом обновлении. Повторное использование старого токена
отзывает всю сессию (защита от кражи). Блокировка действует мгновенно, так как
статус проверяется на каждом запросе. Rate limit на `/auth/*`: 10 запросов в минуту.

**Несовершеннолетние.** Возраст считается по дате рождения. Ученик младше 18 лет
получает статус `PENDING_CONSENT`: может войти, посмотреть профиль и получить код
для родителя, но всё остальное закрыто (`403 PARENT_CONSENT_REQUIRED`), пока родитель
не даст согласие на обработку ПД. Отзыв согласия родителем снова закрывает доступ.

**Привязка родителя.** Ученик получает одноразовый 8-символьный код (24 часа),
родитель вводит его. До 2 родителей на ребёнка.

**Согласия** (`DATA_PROCESSING`, `VOICE_RECORDING`, `CAMERA`, `MICROPHONE`, `MARKETING`)
версионируются (`CONSENT_VERSION`), хранится вся история: кто, когда, на какую версию.
Взрослый управляет своими согласиями сам, за несовершеннолетнего только родитель.
Модуль контроля самостоятельной работы (этап 5+) будет проверять эти записи.

**Изоляция данных.** `AccessService.assertCanViewStudent` — единая точка проверки:
ученик видит себя, родитель своих детей, куратор назначенных учеников, админ всех.
Чужой ученик возвращает 404 (не раскрываем существование). Все следующие модули
(прогресс, ДЗ, записи speaking) используют эту проверку.

**Аудит.** Регистрация, входы и неудачные попытки, согласия, привязки,
назначения кураторов, смены статуса пишутся в `audit_logs`.

## API этапа 1 (`/api/v1`)

| Метод | Путь | Кто |
|---|---|---|
| POST | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` | все |
| GET, PATCH | `/users/me` | авторизованные |
| GET, POST | `/users/me/consents` · DELETE `/users/me/consents/:type` | взрослые |
| POST | `/students/me/link-code` | ученик |
| GET | `/students/:id` | сам ученик, его родитель, его куратор, админ |
| POST | `/parents/children/link` · GET `/parents/children` · DELETE `/parents/children/:childId` | родитель |
| POST | `/parents/children/:childId/consents` · DELETE `.../consents/:type` | родитель |
| GET | `/curator/students` | куратор |
| GET, POST | `/admin/users` · PATCH `/admin/users/:id/status` | админ |
| POST | `/admin/curator-assignments` · DELETE `/admin/curator-assignments/:studentId` | админ |
| GET | `/health` | все |

## Структура

```
apps/api/
  drizzle/              SQL-миграции (генерируются: npm run db:generate)
  scripts/smoke-test.sh сквозная проверка этапа
  src/
    db/                 схема, подключение, migrate, seed
    config/             валидация окружения (zod)
    common/             guards, декораторы, AccessService, AuditService
    auth/  users/  consents/  family/  admin/  curator/  health/
```

Изменение схемы: правка `src/db/schema.ts` → `npm run db:generate` → `npm run db:migrate`.

## Дорожная карта

1. ✅ **Фундамент:** роли, auth, согласия, связи, аудит
2. **Контент + web:** курсы → модули → уроки → блоки → упражнения, словарь, банк вопросов, админка контента, каркас Next.js
3. **Assessment:** placement test по 5 навыкам, запись speaking (S3), English Profile
4. **Обучение:** плеер урока, план на день, дашборд ученика, пересчёт прогресса
5. **Куратор и родитель:** проверка ДЗ по рубрикам, отчёты, уведомления (in-app, email, Telegram)
6. **Бета:** тестирование, закрытый запуск
