// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {
    GelatoRelayContextERC2771
} from "@gelatonetwork/relay-context/contracts/GelatoRelayContextERC2771.sol";
import {ITokenMessenger} from "./interfaces/ITokenMessenger.sol";
import {IEIP3009Token} from "./interfaces/IEIP3009Token.sol";
import {Authorization} from "./types/Authorization.sol";

contract GelatoCCTPSender is GelatoRelayContextERC2771 {
    IEIP3009Token public immutable token;
    ITokenMessenger public immutable tokenMessenger;

    event DepositForBurn(
        address owner,
        uint256 maxFee,
        uint32 domain,
        Authorization authorization
    );

    constructor(IEIP3009Token _token, ITokenMessenger _tokenMessenger) {
        token = _token;
        tokenMessenger = _tokenMessenger;
    }

    function depositForBurn(
        uint256 _value,
        uint256 _srcMaxFee,
        uint256 _dstMaxFee,
        uint32 _dstDomain,
        Authorization calldata _srcAuthorization,
        Authorization calldata _dstAuthorization
    ) external onlyGelatoRelayERC2771 {
        address owner = _getMsgSender();

        token.receiveWithAuthorization(
            owner,
            address(this),
            _value,
            _srcAuthorization.validAfter,
            _srcAuthorization.validBefore,
            _srcAuthorization.nonce,
            _srcAuthorization.v,
            _srcAuthorization.r,
            _srcAuthorization.s
        );

        _transferRelayFeeCapped(_srcMaxFee);

        uint256 remaining = _value - _getFee();
        token.approve(address(tokenMessenger), remaining);

        tokenMessenger.depositForBurn(
            remaining,
            _dstDomain,
            _addressToBytes32(owner),
            address(token)
        );

        emit DepositForBurn(owner, _dstMaxFee, _dstDomain, _dstAuthorization);
    }

    function _addressToBytes32(address addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }
}
