const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultiSigWallet", function(){

  let MultiSigWallet;
  let multiSigWallet;
  let owner1, owner2, owner3, owner4, owner5, signer1;
  let owners;
  let testContract;
  let dataCall;
  
  
  before(async function(){
    [owner1, owner2, owner3, owner4, owner5, signer1, to] = await ethers.getSigners();
    owners = [owner1, owner2, owner3, owner4, owner5];
    MultiSigWallet = await ethers.getContractFactory("MultiSigWalletHarness");
    multiSigWallet = await MultiSigWallet.deploy([owner1.address, owner2.address, owner3.address, owner4.address, owner5.address]);

    const TestContract = await ethers.getContractFactory("TestContract");
    testContract = await TestContract.deploy();

    dataCall = testContract.interface.encodeFunctionData("add", [2]);
  })

  describe("constructor", function(){
    it("shoulde be reverted if one of addresses is zero", async function() {
      MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
      await expect(MultiSigWallet
        .deploy([owner1.address, ethers.ZeroAddress, owner3.address, owner4.address, owner5.address]))
        .to.be.revertedWith("invalid address");
    })

    it("The owners must be the same", async function(){
      const ownerList = await multiSigWallet.getOwners();
      for(let i = 0; i < 5; i++){
        expect(ownerList[i]).to.equal(owners[i].address);
      }
    })

    it("check if owners are set", async function() {
      for(let i = 0; i < 5; i++){
        expect(await multiSigWallet.isOwner(owners[i])).to.equal(true);
      }
    })
  })

  describe("createTransaction", function() {
    it("shoulde only owner can create the transaction", async function() {
      await expect(multiSigWallet.connect(signer1).createTransaction(await testContract.getAddress(), 1, dataCall))
        .to.be.revertedWith("not owner");
    })

    it("shoulde be revert if address is zero", async function() {
      await expect(multiSigWallet.connect(owner1).createTransaction(ethers.ZeroAddress, 1, dataCall))
        .to.be.revertedWith("invalid address");
    })

    it("The transaction should be stored", async function() {
      await multiSigWallet.connect(owner1).createTransaction(await testContract.getAddress(), ethers.parseEther("1"), dataCall);
      expect(await multiSigWallet.transactions(0))
      .to.deep.equal([ethers.parseEther("1"), 0, dataCall, await testContract.getAddress(), false]);
    })
  })

  describe("confirmTransaction", function(){
    it("shoulde only owners can confirm the transaction", async function() {
      await expect(multiSigWallet.connect(signer1).confirmTransaction(0))
        .to.be.revertedWith("not owner");
    })

    it("The transaction should not already executed to confirm", async function(){
      await multiSigWallet.connect(owner1).createExecutedTransaction(await testContract.getAddress(), ethers.parseEther("2"), dataCall)
      await expect(multiSigWallet.connect(owner1).confirmTransaction(1)).to.be.revertedWith("executed");
    })

    it("The transaction should not be already confirmed by the owner", async function(){
      await multiSigWallet.connect(owner1).createTransaction(await testContract.getAddress(), ethers.parseEther("3"), dataCall);
      await multiSigWallet.connect(owner1).confirmedTransaction(2);
      await expect(multiSigWallet.connect(owner1).confirmTransaction(2)).to.be.revertedWith("comfired");
    })

    it("successful confirm Transaction", async function(){
      await multiSigWallet.connect(owner1).confirmTransaction(0);
      expect(await multiSigWallet.txConfirmation(0, owner1.address)).to.equal(true);
      expect((await multiSigWallet.transactions(0)).confirmCount).to.equal(1);
    })
  })

  describe("executeTransaction", function() {
    it("shoulde only owner can create the transaction", async function() {
      await expect(multiSigWallet.connect(signer1).executeTransaction(0))
        .to.be.revertedWith("not owner");
    })

    it("The transaction should not already executed", async function(){
      await expect(multiSigWallet.connect(owner1).executeTransaction(1)).to.be.revertedWith("executed");
    })

    it("The transaction should be confirmed",async function() {
      await expect(multiSigWallet.connect(owner1).executeTransaction(0)).to.be.revertedWith("not comfirmed");
    })

    it("should be revert if transaction params are invalid", async function() {
      await multiSigWallet.connect(owner1).createTransaction(await testContract.getAddress(), ethers.parseEther("4"), dataCall);
      await multiSigWallet.connect(owner1).confirmTransaction(3);
      await multiSigWallet.connect(owner2).confirmTransaction(3);
      await multiSigWallet.connect(owner3).confirmTransaction(3);
      await expect(multiSigWallet.connect(owner1).executeTransaction(3)).to.be.revertedWith("not executed");
    })

    it("successful execute Transaction", async function() {
      await multiSigWallet.connect(owner2).confirmTransaction(0);
      await multiSigWallet.connect(owner3).confirmTransaction(0);
      await expect(multiSigWallet.connect(owner1).executeTransaction(0, { value: ethers.parseEther("2") }))
        .to.emit(multiSigWallet, "Executed")
        .withArgs([ethers.parseEther("1"), 3, dataCall, await testContract.getAddress(), true]);
      expect((await multiSigWallet.transactions(0)).executed).to.equal(true);
      expect(await testContract.amount()).to.equal(2);      
    })
  })

  describe("comfirmedCount", function() {
    it("should return the confirmed number", async function() {
      expect(await multiSigWallet.comfirmedCount(0)).to.equal(3);
      expect(await multiSigWallet.comfirmedCount(1)).to.equal(0);
    })
  })

  describe("executed", function() {
    it("should return the executed value", async function() {
      expect(await multiSigWallet.executed(0)).to.equal(true);
      expect(await multiSigWallet.executed(3)).to.equal(false);
    })
  })

  describe("getOwners", function() {
    it("should return the array of owners", async function() {
      expect(await multiSigWallet.getOwners())
      .to.deep.equal([owner1.address, owner2.address, owner3.address, owner4.address, owner5.address]);
    })
  })
})
