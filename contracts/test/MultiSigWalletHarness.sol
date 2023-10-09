// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "../MultiSigWallet.sol";

contract MultiSigWalletHarness is MultiSigWallet {

    constructor(address[] memory owners) MultiSigWallet(owners) {}    

    function createExecutedTransaction(address payable _to, uint _amount, bytes calldata _data) public onlyOwner {
        require(_to != address(0), "invalid address");
        transactions.push(Transaction(_amount, 0, _data, _to, true));
    }

    function confirmedTransaction(uint _id) public onlyOwner notExecuted(_id) {
        txConfirmation[_id][msg.sender] = true;
        transactions[_id].confirmCount++;
    }
}