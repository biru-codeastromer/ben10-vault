/** Card-face version of an ability: drop parentheticals/dashes, cap length. Full text lives in the detail view. */
export function shortAbility(a: string, max = 26): string {
  let s = a.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s*[—–-]\s.*$/, '').replace(/\s*[:;].*$/, '').replace(/\s+/g, ' ').trim();
  if (s.length > max) {
    const cut = s.slice(0, max);
    s = (cut.includes(' ') ? cut.slice(0, cut.lastIndexOf(' ')) : cut).replace(/[,/&]+$/, '') + '…';
  }
  return s;
}
