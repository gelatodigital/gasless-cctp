export const join = <A, B, AB>(
  set: A[],
  subset: B[],
  pred: (a: A, b: B) => boolean,
  merge: (a: A, b: B) => AB
): AB[] => {
  let i = 0;
  return subset.map((b) => {
    for (; !pred(set[i], b); i++);
    return merge(set[i], b);
  });
};
