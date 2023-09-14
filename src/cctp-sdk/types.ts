import { ethers, BigNumberish, BytesLike, TypedDataField } from "ethers";

export interface IAuthorization {
  validAfter: BigNumberish;
  validBefore: BigNumberish;
  nonce: BytesLike;
  v: BigNumberish;
  r: BytesLike;
  s: BytesLike;
}

export interface ISign {
  (
    domain: ethers.TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    // eslint-disable-next-line
    value: Record<string, any>
  ): Promise<string>;
}
