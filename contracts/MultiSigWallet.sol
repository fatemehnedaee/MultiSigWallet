// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";

// import "./test/TestContract.sol";

contract MultiSigWallet {
    
    mapping(address => bool) public isOwner;
    address[] private owners;

    mapping(uint => mapping(address => bool)) public txConfirmation;

    struct Transaction {
        uint amount;
        uint confirmCount;
        bytes data;
        address payable to;
        bool executed;
    }

    Transaction[] public transactions;

    event Executed(Transaction transaction);
    event Received(address addr, uint value);

    constructor(address[] memory _owners){
        uint length = _owners.length;
        for (uint i; i < length; ){
            address _owner = _owners[i];
            require(_owner != address(0), "invalid address");
            owners.push(_owner);
            isOwner[_owner] = true;
            unchecked{
                ++i;
            }
        }
    }

    function createTransaction(address payable _to, uint _amount, bytes calldata _data) public onlyOwner {
        require(_to != address(0), "invalid address");
        transactions.push(Transaction(_amount, 0, _data, _to, false));
    }

    function confirmTransaction(uint _id) public onlyOwner notExecuted(_id) {
        require(txConfirmation[_id][msg.sender] != true, "comfired");
        txConfirmation[_id][msg.sender] = true;
        transactions[_id].confirmCount++;
    }

    function executeTransaction(uint _id) public payable onlyOwner notExecuted(_id) isComfirm(_id) {
        Transaction storage transaction = transactions[_id];
        (bool success, ) = transaction.to.call{value: transaction.amount}(transaction.data);
        require(success, "not executed");
        transaction.executed = true;
        emit Executed(transaction);
    }

    function comfirmedCount(uint _id) public view returns(uint) {
       return transactions[_id].confirmCount;
    }

    function executed(uint _id) public view returns(bool) {
       return transactions[_id].executed;
    }

    function getOwners() public view returns(address[] memory) {
        return owners;
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function _checkIsOwner() internal view {
        require(isOwner[msg.sender] == true , "not owner");
    }

    function _checkNotExecuted(uint _id) internal view {
        require(transactions[_id].executed == false ,"executed");
    }
 
    modifier onlyOwner() {
        _checkIsOwner();
        _;
    }

    modifier notExecuted(uint _id) {
        _checkNotExecuted(_id);
        _;
    }

    modifier isComfirm(uint _id) {
        require(transactions[_id].confirmCount == (owners.length / 2) + 1, "not comfirmed");
        _;
    }
}