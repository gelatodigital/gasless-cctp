// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {
    ERC20Permit
} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract PermitForwarder {
    function forward(
        address target,
        bytes memory data,
        ERC20Permit token,
        address owner,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        token.permit(owner, address(this), amount, deadline, v, r, s);
        token.transferFrom(owner, address(this), amount);
        token.approve(target, amount);

        (bool success, ) = target.call(data);
        require(success, "PermitForwarder.forward: call failed");
    }
}
