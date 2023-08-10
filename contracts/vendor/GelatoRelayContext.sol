// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    GelatoRelayBase
} from "@gelatonetwork/relay-context/contracts/base/GelatoRelayBase.sol";
import {
    GelatoRelayERC2771Base
} from "@gelatonetwork/relay-context/contracts/base/GelatoRelayERC2771Base.sol";

uint256 constant _ERC2771_FEE_COLLECTOR_START = 92;
uint256 constant _ERC2771_FEE_TOKEN_START = 72;
uint256 constant _ERC2771_FEE_START = 52;

uint256 constant _FEE_COLLECTOR_START = 72;
uint256 constant _FEE_TOKEN_START = 52;
uint256 constant _FEE_START = 32;

// solhint-disable-next-line private-vars-leading-underscore
function _getFeeCollectorRelayContextERC2771()
    pure
    returns (address feeCollector)
{
    assembly {
        feeCollector := shr(
            96,
            calldataload(sub(calldatasize(), _ERC2771_FEE_COLLECTOR_START))
        )
    }
}

// solhint-disable-next-line private-vars-leading-underscore
function _getFeeTokenRelayContextERC2771() pure returns (address feeToken) {
    assembly {
        feeToken := shr(
            96,
            calldataload(sub(calldatasize(), _ERC2771_FEE_TOKEN_START))
        )
    }
}

// solhint-disable-next-line private-vars-leading-underscore
function _getFeeRelayContextERC2771() pure returns (uint256 fee) {
    assembly {
        fee := calldataload(sub(calldatasize(), _ERC2771_FEE_START))
    }
}

// solhint-disable-next-line private-vars-leading-underscore
function _getFeeCollectorRelayContext() pure returns (address feeCollector) {
    assembly {
        feeCollector := shr(
            96,
            calldataload(sub(calldatasize(), _FEE_COLLECTOR_START))
        )
    }
}

// solhint-disable-next-line private-vars-leading-underscore
function _getFeeTokenRelayContext() pure returns (address feeToken) {
    assembly {
        feeToken := shr(96, calldataload(sub(calldatasize(), _FEE_TOKEN_START)))
    }
}

// solhint-disable-next-line private-vars-leading-underscore
function _getFeeRelayContext() pure returns (uint256 fee) {
    assembly {
        fee := calldataload(sub(calldatasize(), _FEE_START))
    }
}

abstract contract GelatoRelayContext is
    GelatoRelayBase,
    GelatoRelayERC2771Base
{
    function _transferRelayFee() internal {
        _getFeeToken().transfer(_getFeeCollector(), _getFee());
    }

    function _transferRelayFeeERC2771() internal {
        _getFeeTokenERC2771().transfer(
            _getFeeCollectorERC2771(),
            _getFeeERC2771()
        );
    }

    function _transferRelayFeeCapped(uint256 maxFee) internal {
        uint256 fee = _getFee();
        require(
            fee <= maxFee,
            "GelatoRelayContext._transferRelayFeeCapped: maxFee"
        );
        _getFeeToken().transfer(_getFeeCollector(), fee);
    }

    function _transferRelayFeeCappedERC2771(uint256 maxFee) internal {
        uint256 fee = _getFeeERC2771();
        require(
            fee <= maxFee,
            "GelatoRelayContext._transferRelayFeeCappedERC2771: maxFee"
        );
        _getFeeTokenERC2771().transfer(_getFeeCollectorERC2771(), fee);
    }

    function _getFeeCollectorERC2771() internal pure returns (address) {
        return _getFeeCollectorRelayContextERC2771();
    }

    function _getFeeTokenERC2771() internal pure returns (IERC20) {
        return IERC20(_getFeeTokenRelayContextERC2771());
    }

    function _getFeeERC2771() internal pure returns (uint256) {
        return _getFeeRelayContextERC2771();
    }

    function _getFeeCollector() internal pure returns (address) {
        return _getFeeCollectorRelayContext();
    }

    function _getFeeToken() internal pure returns (IERC20) {
        return IERC20(_getFeeTokenRelayContext());
    }

    function _getFee() internal pure returns (uint256) {
        return _getFeeRelayContext();
    }
}
