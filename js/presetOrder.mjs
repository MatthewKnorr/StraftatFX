export function shufflePresets(entries, previous = [], random = Math.random) {
  const result = [...entries];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  if (result.length > 1 && result[0] === previous[0]) result.push(result.shift());
  return result;
}
