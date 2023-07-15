import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "ethers";

export const signPermit = async (
  signer: SignerWithAddress | ethers.Wallet,
  token: ethers.Contract,
  value: bigint,
  spender: string,
  deadline: number,
  chainId: number
): Promise<ethers.Signature | null> => {
  const domain: ethers.TypedDataDomain = {
    name: await token.name(),
    version: "2",
    chainId: chainId,
    verifyingContract: token.address,
  };

  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const data = {
    owner: signer.address,
    spender: spender,
    value: value,
    nonce: await token.nonces(signer.address),
    deadline: deadline,
  };

  try {
    const sig = await signer._signTypedData(domain, types, data);
    return ethers.utils.splitSignature(sig);
  } catch (e) {
    return null;
  }
};
