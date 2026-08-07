const defaultAb = 1;

function fn({ a: a = defaultAb }: { a?: number }): number {
  return a;
}

export { fn };
