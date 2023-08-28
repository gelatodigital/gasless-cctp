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

    constructor(IEIP3009Token _token, ITokenMessenger _tokenMessenger) {
        token = _token;
        tokenMessenger = _tokenMessenger;
    }

    function depositForBurn(
        uint256 _value,
        uint256 _maxGelatoFee,
        uint32 _destinationDomain,
        Authorization calldata _authorization
    ) external onlyGelatoRelayERC2771 {
        address owner = _getMsgSender();

        token.receiveWithAuthorization(
            owner,
            address(this),
            _value,
            _authorization.validAfter,
            _authorization.validBefore,
            _authorization.nonce,
            _authorization.v,
            _authorization.r,
            _authorization.s
        );

        _transferRelayFeeCapped(_maxGelatoFee);

        uint256 remaining = _value - _getFee();
        token.approve(address(tokenMessenger), remaining);

        tokenMessenger.depositForBurn(
            remaining,
            _destinationDomain,
            _addressToBytes32(owner),
            address(token)
        );
    }

    function _addressToBytes32(address addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }
}
