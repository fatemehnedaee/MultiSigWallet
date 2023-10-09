// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";

contract TestContract {

    uint public amount = 0;

    function add(uint256 number) payable external {
        amount = amount + number;
    }

    function data() external pure returns(bytes memory) {

        bytes4 FUNC_SELECTOR = bytes4(keccak256("add(uint256)"));
        return(abi.encodeWithSelector(FUNC_SELECTOR, 2));
    }
}