export function generateUsername(first: string, last: string) {
  const base = (first + last).replace(/[^a-zA-Z0-9]/g,'').toLowerCase();
  const rand = Math.floor(100 + Math.random()*900);
  return base ? `${base}${rand}` : `member${rand}`;
}
