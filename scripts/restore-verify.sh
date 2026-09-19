#!/usr/bin/env bash
set -euo pipefail
# Проверка, что бэкап базы данных действительно восстанавливается: поднимает
# ВРЕМЕННЫЙ контейнер Postgres (не трогает рабочую базу), накатывает в него
# дамп, проверяет данные и удаляет контейнер.
#
# Запуск: ./scripts/restore-verify.sh [путь-к-дампу.sql.gz]
# Без аргумента берёт самый свежий бэкап из ./backups
#
# Рекомендуется гонять раз в неделю по cron, например по воскресеньям в 05:00:
#   0 5 * * 0 cd /путь/к/soyleup && ./scripts/restore-verify.sh >> /var/log/soyleup-restore-verify.log 2>&1

cd "$(dirname "$0")/.."
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DUMP="${1:-$(ls -t "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null | head -1)}"

if [ -z "$DUMP" ] || [ ! -f "$DUMP" ]; then
  echo "Не найден файл бэкапа. Укажите путь явно: ./scripts/restore-verify.sh backups/db_....sql.gz"
  exit 1
fi

echo "Проверяю восстановление из: $DUMP"
CONTAINER=soyleup-restore-verify
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER" \
  -e POSTGRES_USER=soyleup -e POSTGRES_PASSWORD=soyleup -e POSTGRES_DB=soyleup \
  postgres:16-alpine >/dev/null

cleanup() { docker rm -f "$CONTAINER" >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "Жду готовности временной базы..."
for _ in $(seq 1 30); do
  if docker exec "$CONTAINER" pg_isready -U soyleup >/dev/null 2>&1; then break; fi
  sleep 1
done

echo "Накатываю дамп..."
gunzip -c "$DUMP" | docker exec -i "$CONTAINER" psql -U soyleup -d soyleup -q >/dev/null

echo "Проверяю данные..."
USERS=$(docker exec "$CONTAINER" psql -U soyleup -d soyleup -tAc "select count(*) from users;")
COURSES=$(docker exec "$CONTAINER" psql -U soyleup -d soyleup -tAc "select count(*) from courses;")
echo "  users: $USERS, courses: $COURSES"

if [ "$USERS" -gt 0 ]; then
  echo "OK: бэкап восстанавливается, данные на месте."
else
  echo "ВНИМАНИЕ: таблица users пуста после восстановления — проверьте бэкап вручную."
  exit 1
fi
