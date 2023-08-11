// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ITokenMessenger} from "./interfaces/ITokenMessenger.sol";
import {IMessageTransmitter} from "./interfaces/IMessageTransmitter.sol";
import {GelatoRelayContext} from "./vendor/GelatoRelayContext.sol";

contract Forwarder is GelatoRelayContext {
    IERC20 public immutable token;
    ITokenMessenger public immutable tokenMessenger;
    IMessageTransmitter public immutable messageTransmitter;

    constructor(
        IERC20 _token,
        ITokenMessenger _tokenMessenger,
        IMessageTransmitter _messageTransmitter
    ) {
        token = _token;
        tokenMessenger = _tokenMessenger;
        messageTransmitter = _messageTransmitter;
    }

    function deposit(
        uint256 maxFee,
        uint32 destinationDomain,
        bytes calldata receiveAuthorization
    ) external onlyGelatoRelayERC2771 {
        _requireSelector(receiveAuthorization, Forwarder.deposit.selector);

        address owner = _decodeOwner(receiveAuthorization);
        require(
            _getMsgSender() == owner,
            "Forwarder.deposit: signer must be authorizer"
        );

        _receiveWithAuthorization(receiveAuthorization);
        _transferRelayFeeCappedERC2771(maxFee);

        uint256 remaining = token.balanceOf(address(this));
        token.approve(address(tokenMessenger), remaining);

        tokenMessenger.depositForBurn(
            remaining,
            destinationDomain,
            _addressToBytes32(owner),
            address(token)
        );
    }

    function withdraw(
        bytes calldata message,
        bytes calldata attestation,
        bytes calldata receiveAuthorization
    ) external onlyGelatoRelay {
        _requireSelector(receiveAuthorization, Forwarder.withdraw.selector);

        messageTransmitter.receiveMessage(message, attestation);

        _receiveWithAuthorization(receiveAuthorization);
        _transferRelayFee();

        address owner = _decodeOwner(receiveAuthorization);
        uint256 remaining = token.balanceOf(address(this));

        token.transfer(owner, remaining);
    }

    function _receiveWithAuthorization(bytes calldata authorization) internal {
        _requireCall(
            address(token),
            abi.encodePacked(bytes4(0xef55bec6), authorization)
        );
    }

    function _requireCall(address target, bytes memory data) internal {
        (bool success, bytes memory result) = address(target).call(data);
        assembly {
            if eq(success, false) {
                revert(add(result, 32), mload(result))
            }
        }
    }

    function _requireSelector(
        bytes calldata authorization,
        bytes4 selector
    ) internal pure {
        bytes4 nonceSelector = bytes4(authorization[160:164]);
        require(
            nonceSelector == selector,
            "Forwarder._requireSelector: invalid selector"
        );
    }

    function _decodeOwner(
        bytes calldata authorization
    ) internal pure returns (address) {
        return address(uint160(uint256(bytes32(authorization))));
    }

    function _addressToBytes32(address addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }
}
