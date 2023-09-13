import { ethers, BigNumberish, BytesLike, TypedDataField } from "ethers";

export type IAuthorization = {
  validAfter: BigNumberish;
  validBefore: BigNumberish;
  nonce: BytesLike;
  v: BigNumberish;
  r: BytesLike;
  s: BytesLike;
};

export type ISign = {
  (
    domain: ethers.TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    // eslint-disable-next-line
    value: Record<string, any>
  ): Promise<string>;
};
