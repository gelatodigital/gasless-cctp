// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

struct Authorization {
    uint256 validAfter;
    uint256 validBefore;
    bytes32 nonce;
    uint8 v;
    bytes32 r;
    bytes32 s;
}
