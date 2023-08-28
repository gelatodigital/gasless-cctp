// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {
    GelatoRelayContext
} from "@gelatonetwork/relay-context/contracts/GelatoRelayContext.sol";
import {IMessageTransmitter} from "./interfaces/IMessageTransmitter.sol";
import {IEIP3009Token} from "./interfaces/IEIP3009Token.sol";
import {Authorization} from "./types/Authorization.sol";

contract GelatoCCTPReceiver is GelatoRelayContext {
    IEIP3009Token public immutable token;
    IMessageTransmitter public immutable messageTransmitter;

    constructor(IEIP3009Token _token, IMessageTransmitter _messageTransmitter) {
        token = _token;
        messageTransmitter = _messageTransmitter;
    }

    function receiveMessage(
        address _owner,
        uint256 _maxGelatoFee,
        bytes calldata _message,
        bytes calldata _attestation,
        Authorization calldata _authorization
    ) external onlyGelatoRelay {
        messageTransmitter.receiveMessage(_message, _attestation);

        token.receiveWithAuthorization(
            _owner,
            address(this),
            _maxGelatoFee,
            _authorization.validAfter,
            _authorization.validBefore,
            _authorization.nonce,
            _authorization.v,
            _authorization.r,
            _authorization.s
        );

        _transferRelayFee();

        uint256 remaining = _maxGelatoFee - _getFee();
        token.transfer(_owner, remaining);
    }
}
