// utils/slugify.ts
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')                // bỏ dấu tiếng Việt
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9 -]/g, '')     // remove special chars
    .replace(/\s+/g, '-')            // spaces to dashes
    .replace(/-+/g, '-');            // collapse dashes
}
