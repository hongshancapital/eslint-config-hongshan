const defaultAb = 1;

// Correct: { a = ab } instead of { a: a = ab }
function fn({ a = defaultAb }: { a?: number }): number {
  return a;
}

export { fn };
