// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {ITokenMessenger} from "./interfaces/ITokenMessenger.sol";
import {IMessageTransmitter} from "./interfaces/IMessageTransmitter.sol";
import {IEIP3009Token} from "./interfaces/IEIP3009Token.sol";

// @BEN TO DO: do what I did for GelatoCCTPSender for Receiver too
// solhint-disable-next-line no-empty-blocks
contract Forwarder {
    // IEIP3009Token public immutable token;
    // ITokenMessenger public immutable tokenMessenger;
    // IMessageTransmitter public immutable messageTransmitter;
    // constructor(
    //     IEIP3009Token _token,
    //     ITokenMessenger _tokenMessenger,
    //     IMessageTransmitter _messageTransmitter
    // ) {
    //     token = _token;
    //     tokenMessenger = _tokenMessenger;
    //     messageTransmitter = _messageTransmitter;
    // }
    // /// @dev GelatoRelayERC2771 meta-tx compatible fn to send tokens via CCTP
    // /// @param _maxFee Gelato Relay userSigned maxFee
    // /// @param _destinationDomain CCTP depositForBurn destination
    // /// @param _value IEIP3009Token total transfer amount + GelatoRelay maxFee
    // /// @param _validAfter IEIP3009Token
    // /// @param _validBefore IEIP3009Token
    // /// @param _nonce IEIP3009Token
    // /// @param _v IEIP3009Token
    // /// @param _r IEIP3009Token
    // /// @param _s IEIP3009Token
    // function depositForBurn(
    //     uint256 _maxFee,
    //     uint32 _destinationDomain,
    //     uint256 _value,
    //     uint256 _validAfter,
    //     uint256 _validBefore,
    //     bytes32 _nonce,
    //     uint8 _v,
    //     bytes32 _r,
    //     bytes32 _s
    // ) external onlyGelatoRelayERC2771 {
    //     _requireSelector(_receiveAuthorization, Forwarder.deposit.selector);
    //     address owner = _decodeOwner(_receiveAuthorization);
    //     require(
    //         _getMsgSender() == owner,
    //         "Forwarder.deposit: signer must be authorizer"
    //     );
    //     _receiveWithAuthorization(_receiveAuthorization);
    //     _transferRelayFeeCappedERC2771(_maxFee);
    //     uint256 remaining = token.balanceOf(address(this));
    //     token.approve(address(tokenMessenger), remaining);
    //     tokenMessenger.depositForBurn(
    //         remaining,
    //         _destinationDomain,
    //         _getMsgSender(),
    //         address(token)
    //     );
    // }
    // function withdraw(
    //     bytes calldata _message,
    //     bytes calldata _attestation,
    //     bytes calldata _receiveAuthorization
    // ) external onlyGelatoRelay {
    //     _requireSelector(_receiveAuthorization, Forwarder.withdraw.selector);
    //     messageTransmitter.receiveMessage(_message, _attestation);
    //     _receiveWithAuthorization(_receiveAuthorization);
    //     _transferRelayFee();
    //     address owner = _decodeOwner(_receiveAuthorization);
    //     uint256 remaining = token.balanceOf(address(this));
    //     token.transfer(owner, remaining);
    // }
    // function _receiveWithAuthorization(bytes calldata authorization) internal {
    //     _requireCall(
    //         address(token),
    //         abi.encodePacked(bytes4(0xef55bec6), authorization)
    //     );
    // }
    // function _requireCall(address target, bytes memory data) internal {
    //     (bool success, bytes memory result) = address(target).call(data);
    //     assembly {
    //         if eq(success, false) {
    //             revert(add(result, 32), mload(result))
    //         }
    //     }
    // }
    // function _requireSelector(
    //     bytes calldata authorization,
    //     bytes4 selector
    // ) internal pure {
    //     bytes4 nonceSelector = bytes4(authorization[160:164]);
    //     require(
    //         nonceSelector == selector,
    //         "Forwarder._requireSelector: invalid selector"
    //     );
    // }
    // function _decodeOwner(
    //     bytes calldata authorization
    // ) internal pure returns (address) {
    //     return address(uint160(uint256(bytes32(authorization))));
    // }
    // function _addressToBytes32(address addr) internal pure returns (bytes32) {
    //     return bytes32(uint256(uint160(addr)));
    // }
}
