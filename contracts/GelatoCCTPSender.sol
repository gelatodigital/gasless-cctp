// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {
    GelatoRelayContextERC2771
} from "@gelatonetwork/relay-context/contracts/GelatoRelayContextERC2771.sol";
import {ITokenMessenger} from "./interfaces/ITokenMessenger.sol";
import {IEIP3009Token} from "./interfaces/IEIP3009Token.sol";

contract GelatoCCTPSender is GelatoRelayContextERC2771 {
    IEIP3009Token public immutable token;
    ITokenMessenger public immutable tokenMessenger;

    constructor(IEIP3009Token _token, ITokenMessenger _tokenMessenger) {
        token = _token;
        tokenMessenger = _tokenMessenger;
    }

    /// @dev GelatoRelayERC2771 meta-tx compatible fn to send tokens via CCTP
    /// @param _maxGelatoRelayFee Gelato Relay userSigned maxFee
    /// @param _destinationDomain CCTP depositForBurn destination
    /// @param _value IEIP3009Token total transfer amount + GelatoRelay maxFee
    /// @param _validAfter IEIP3009Token
    /// @param _validBefore IEIP3009Token
    /// @param _nonce IEIP3009Token
    /// @param _v IEIP3009Token
    /// @param _r IEIP3009Token
    /// @param _s IEIP3009Token
    function depositForBurn(
        uint256 _value,
        uint256 _validAfter,
        uint256 _validBefore,
        bytes32 _nonce,
        uint8 _v,
        bytes32 _r,
        bytes32 _s,
        uint256 _maxGelatoRelayFee,
        uint32 _destinationDomain
    ) external onlyGelatoRelayERC2771 {
        address owner = _getMsgSender();

        token.receiveWithAuthorization(
            owner,
            address(this),
            _value,
            _validAfter,
            _validBefore,
            _nonce,
            _v,
            _r,
            _s
        );

        _transferRelayFeeCapped(_maxGelatoRelayFee);

        // Assumption: same as balanceOf but more gas savings
        uint256 remainderAfterFee = _value - _getFee();

        token.approve(address(tokenMessenger), remainderAfterFee);

        tokenMessenger.depositForBurn(
            remainderAfterFee,
            _destinationDomain,
            _addressToBytes32(owner),
            address(token)
        );
    }

    function _addressToBytes32(address addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }
}
