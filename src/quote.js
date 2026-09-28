// Pure quote and selection rules shared by NEC checkout and its Worker.
// Price is an integer count of cents. The server verifies current ownership
// and recomputes this result before committing a sale.
export function priceUnits(cents) {
  if (!Number.isSafeInteger(cents) || cents < 0) throw new RangeError('invalid_price_cents');
  const starCoinHundredths = cents % 100;
  return { quantCount: Math.floor(cents / 100), starCoinHundredths, starCoins: starCoinHundredths / 100 };
}

export function musicalContentScore(quant) {
  const notes = Array.isArray(quant?.notes) ? quant.notes : [];
  if (!notes.length) return 0;
  const midi = notes.map(note => Number(note.midi)).filter(Number.isFinite);
  const groups = new Map();
  for (const note of notes) {
    const group = Number(note.group);
    groups.set(group, (groups.get(group) || 0) + 1);
  }
  const pitches = new Set(midi.map(value => value % 12)).size;
  const motion = midi.slice(1).filter((pitch, index) => pitch !== midi[index]).length;
  const chords = [...groups.values()].filter(size => size > 1).length;
  const durations = new Set(notes.map(note => Math.round(Number(note.holdMs || 0) / 100))).size;
  return pitches * 3 + motion * 2 + chords * 4 + durations;
}

export function selectLowestContent(musicQuants, count) {
  if (!Number.isSafeInteger(count) || count < 0) throw new RangeError('invalid_quant_count');
  const owned = musicQuants.filter(quant => quant?.id && !quant.transferredAt);
  return owned.sort((a, b) =>
    musicalContentScore(a) - musicalContentScore(b) ||
    String(a.createdAt || '').localeCompare(String(b.createdAt || '')) ||
    String(a.id).localeCompare(String(b.id))
  ).slice(0, count).map(quant => quant.id);
}

export function quote(cents, musicQuants, ordinaryQuantBalance, starCoinBalanceHundredths) {
  const units = priceUnits(cents);
  const musicIds = selectLowestContent(musicQuants, units.quantCount);
  const ordinaryCount = units.quantCount - musicIds.length;
  if (!Number.isSafeInteger(ordinaryQuantBalance) || ordinaryQuantBalance < ordinaryCount)
    return { ok: false, reason: 'insufficient_quants', ...units };
  if (starCoinBalanceHundredths !== undefined && (!Number.isSafeInteger(starCoinBalanceHundredths) || starCoinBalanceHundredths < units.starCoinHundredths))
    return { ok: false, reason: 'insufficient_star_coin_hundredths', ...units };
  return { ok: true, ...units, musicQuantIds: musicIds, ordinaryQuantCount: ordinaryCount };
}
