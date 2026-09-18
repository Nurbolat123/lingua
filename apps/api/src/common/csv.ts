/**
 * Простой парсер CSV: запятая — разделитель колонок, поддерживает поля в кавычках
 * (с экранированием "" внутри) и запятые/переносы строк внутри кавычек.
 * Первая строка — заголовки. Пустые строки пропускаются.
 */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => { row.push(field); field = ''; };
  const pushRow = () => { pushField(); rows.push(row); row = []; };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      pushField();
    } else if (c === '\n') {
      pushRow();
    } else if (c === '\r') {
      // игнорируем, перевод строки обработает \n
    } else {
      field += c;
    }
  }
  if (field.length || row.length) pushRow();

  const nonEmpty = rows.filter((r) => r.some((v) => v.trim() !== ''));
  if (!nonEmpty.length) return [];
  const [header, ...body] = nonEmpty;
  const keys = header.map((h) => h.trim());
  return body.map((r) => Object.fromEntries(keys.map((k, idx) => [k, (r[idx] ?? '').trim()])));
}

/** Разбирает многозначное поле CSV-ячейки по разделителю `;` (внутри неё запятые уже недопустимы). */
export function splitMulti(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(';').map((v) => v.trim()).filter(Boolean);
}
