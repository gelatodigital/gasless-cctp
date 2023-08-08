export const jetch = async (url: string) => {
  const result = await fetch(url, { cache: "no-store" });
  return result.json();
};

export const poll = async <Type>(
  fn: () => Promise<Type>,
  pred: (arg: Type) => boolean,
  ms: number
): Promise<Type> => {
  let result = await fn();
  while (!pred(result)) {
    await wait(ms);
    result = await fn();
  }
  return result;
};

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
