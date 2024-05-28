import { deployments, ethers } from "hardhat";
import { Web3Ecommerce } from "../typechain-types";
import { assert, expect } from "chai";
import { Signer } from "ethers";

const id: number = 1;
const name: string = "shirt";
const category: string = "clothing";
const image: string = "./hfidjofj.jpg";
const cost = ethers.utils.parseEther("0.15");
const rating: number = 5;
const stock: number = 3;
const zeroStock: number = 0;

describe("Web3Ecommerce", () => {
  let web3Ecommerce: Web3Ecommerce, deployer: Signer, buyer: Signer;
  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    deployer = accounts[0];
    buyer = accounts[1];
    await deployments.fixture(["all"]);
    web3Ecommerce = await ethers.getContract("Web3Ecommerce", deployer);
  });

  describe("constructor", () => {
    it("initiates the owner of the contract properly", async () => {
      const owner = await web3Ecommerce.owner();
      assert.equal(owner, (await deployer.getAddress()).toString());
    });
  });

  describe("list", () => {
    it("lists and emits the Listed event", async () => {
      await expect(
        web3Ecommerce.list(id, name, category, image, cost, rating, stock)
      ).to.emit(web3Ecommerce, "Listed");
    });
  });

  describe("buy", () => {
    beforeEach(async () => {
      const res = await web3Ecommerce.list(
        id,
        name,
        category,
        image,
        cost,
        rating,
        stock
      );
      await res.wait(1);
    });

    it("reverts if buyer's deposit is less than item's cost", async () => {
      await expect(
        web3Ecommerce
          .connect(buyer)
          .buy(id, { value: ethers.utils.parseEther("0.1") })
      ).to.be.reverted;
    });

    it("increases order count for buyer, updates the orders list and deducts from stock, after an item has been bought", async () => {
      const res = await web3Ecommerce.connect(buyer).buy(id, { value: cost });
      await res.wait();

      const transactionResponse = await web3Ecommerce.items(id);
      const stockRes = await transactionResponse.stock;

      assert.equal(stockRes.toString(), (stock - 1).toString());

      const txRes = await web3Ecommerce.orderCount(buyer.getAddress());
      assert.equal(txRes.toString(), "1");

      const txResponse = await web3Ecommerce.orders(buyer.getAddress(), id);
      assert.equal(txResponse.item.id.toString(), id.toString());
      assert.equal(txResponse.item.name, name);
      assert.equal(txResponse.item.category, category);
      assert.equal(txResponse.item.image, image);
      assert.equal(txResponse.item.cost.toString(), cost.toString());
      assert.equal(txResponse.item.rating.toString(), rating.toString());
      assert.equal(txResponse.item.stock.toString(), stock.toString());
    });

    it("emits the Bought event after an item has been bought", async () => {
      await expect(
        web3Ecommerce.connect(buyer).buy(id, { value: cost })
      ).to.emit(web3Ecommerce, "Bought");
    });
  });

  describe("buying", () => {
    it("reverts if item is out of stock", async () => {
      const res = await web3Ecommerce.list(
        id,
        name,
        category,
        image,
        cost,
        rating,
        zeroStock
      );
      await res.wait(1);

      await expect(web3Ecommerce.buy(id, { value: cost })).to.be.revertedWith(
        "out of stock"
      );
    });
  });

  describe("withdraw", () => {
    it("withdraws the funds for the owner after an item has been bought", async () => {
      const startingOwnerBalance = await ethers.provider.getBalance(deployer.getAddress());

      const res = await web3Ecommerce.list(
        id,
        name,
        category,
        image,
        cost,
        rating,
        stock
      );
      await res.wait(1);

      const response = await web3Ecommerce
        .connect(buyer)
        .buy(id, { value: cost });
      await response.wait();

      const txRes = await web3Ecommerce.withdraw();
      const txRec = await txRes.wait();

      const { gasUsed, effectiveGasPrice } = txRec;
      const gasCost = gasUsed.mul(effectiveGasPrice);

      const closingOwnerBalance = await ethers.provider.getBalance(deployer.getAddress());

      assert.equal(
        startingOwnerBalance.sub(gasCost).add(cost).toString(),
        closingOwnerBalance.toString()
      );
    });
  });
});
