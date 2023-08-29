export const jetch = async (url: string) => {
  const result = await fetch(url, { cache: "no-store" });
  return result.json();
};

export const poll = async <Type>(
  fn: () => Promise<Type>,
  pred: (arg: Type) => boolean,
  interval: number,
  timeout: number
): Promise<Type> => {
  const expiry = Date.now() + timeout;
  let result = await fn();

  while (!pred(result) && Date.now() < expiry) {
    await wait(interval);
    result = await fn();
  }

  return result;
};

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
