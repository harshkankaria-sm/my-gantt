// Dates are "YYYY-MM-DD" strings in local time. Working days are Mon–Fri.
// String comparison (<, >) orders them correctly.

export type ISODate = string;

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const pad = (n: number) => String(n).padStart(2, "0");

export const toStr = (d: Date): ISODate =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parse = (s: ISODate): Date => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const todayStr = (): ISODate => toStr(new Date());

export const addDays = (s: ISODate, n: number): ISODate => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return toStr(d);
};

/** Calendar days from a to b. */
export const diff = (a: ISODate, b: ISODate): number =>
  Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000);

export const isWknd = (s: ISODate): boolean => {
  const g = parse(s).getDay();
  return g === 0 || g === 6;
};

/** The working day before s. */
export const prevWork = (s: ISODate): ISODate => {
  let d = addDays(s, -1);
  while (isWknd(d)) d = addDays(d, -1);
  return d;
};

/** The working day after s. */
export const nextWork = (s: ISODate): ISODate => {
  let d = addDays(s, 1);
  while (isWknd(d)) d = addDays(d, 1);
  return d;
};

/** s if it's a working day, else the working day before. */
export const toWork = (s: ISODate): ISODate => (isWknd(s) ? prevWork(s) : s);

/** s if it's a working day, else the working day after. */
export const firstWork = (s: ISODate): ISODate => (isWknd(s) ? nextWork(s) : s);

/** Last day of a span of n working days starting on start. */
export const spanEnd = (start: ISODate, n: number): ISODate => {
  let e = start;
  for (let c = 1; c < n; c++) e = nextWork(e);
  return e;
};

/** First day of a span of n working days ending on end. */
export const spanStart = (end: ISODate, n: number): ISODate => {
  let s = end;
  for (let c = 1; c < n; c++) s = prevWork(s);
  return s;
};

/** "30 Nov" */
export const fmt = (s: ISODate): string => {
  const d = parse(s);
  return `${d.getDate()} ${MON[d.getMonth()]}`;
};
