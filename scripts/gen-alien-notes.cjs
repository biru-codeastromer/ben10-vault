// Regenerate research/alien-notes.md (per-alien canon notes appendix) from data/aliens.json
const fs = require('fs');
const a = JSON.parse(fs.readFileSync('data/aliens.json', 'utf8')).sort((x, y) => x.name.localeCompare(y.name));
const S = { os: 'Ben 10', af: 'Alien Force', ua: 'Ultimate Alien', ov: 'Omniverse' };
let out = '# Per-alien canon notes (generated)\n\nGenerated from research/aliens/*.json by `node scripts/gen-alien-notes.cjs`. Each entry: eras on the wall (with the Ben versions that used it), wiki page, and the researchers\' notes/uncertainties.\n\n';
for (const x of a) {
  out += `## ${x.name} (${x.score.total} · ${x.score.classId})\n`;
  out += `- Wall: ${x.appearances.map((ap) => `${S[ap.seriesId]} (${ap.benVersionIds.join(', ')})`).join('; ')}\n`;
  out += `- Wiki: ${x.sources.join(', ')}\n`;
  for (const n of x.notes) out += `- ${n.replace(/\n/g, ' ')}\n`;
  out += '\n';
}
fs.writeFileSync('research/alien-notes.md', out);
console.log('wrote research/alien-notes.md', a.length, 'entries');
