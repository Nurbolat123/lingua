#!/usr/bin/env bash
set -euo pipefail
# Ежедневный бэкап базы данных и файлов (MinIO). Запускать на сервере из корня
# репозитория, рядом с docker-compose.prod.yml (стек должен быть поднят).
#
# Строка в crontab для ежедневного запуска в 04:00 (лог — в файл):
#   0 4 * * * cd /путь/к/soyleup && ./scripts/backup.sh >> /var/log/soyleup-backup.log 2>&1
#
# После настройки бэкапов обязательно проверьте восстановление: ./scripts/restore-verify.sh

cd "$(dirname "$0")/.."
BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP=$(date +%Y-%m-%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

echo "[$STAMP] Бэкап базы данных..."
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U soyleup soyleup | gzip > "$BACKUP_DIR/db_$STAMP.sql.gz"

echo "[$STAMP] Бэкап файлов (MinIO)..."
docker run --rm \
  -v soyleup_miniodata:/data:ro \
  -v "$(cd "$BACKUP_DIR" && pwd)":/backup \
  alpine tar czf "/backup/files_$STAMP.tar.gz" -C /data .

echo "[$STAMP] Удаляю бэкапы старше $KEEP_DAYS дней..."
find "$BACKUP_DIR" -name 'db_*.sql.gz' -mtime +"$KEEP_DAYS" -delete
find "$BACKUP_DIR" -name 'files_*.tar.gz' -mtime +"$KEEP_DAYS" -delete

echo "[$STAMP] Готово: $BACKUP_DIR/db_$STAMP.sql.gz, $BACKUP_DIR/files_$STAMP.tar.gz"
