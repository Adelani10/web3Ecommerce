// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Web3Ecommerce {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    event Listed(string _name, uint256 _cost, uint256 _stock);
    event Bought(address buyer, uint256 orderId, uint256 itemId);

    struct Item {
        uint256 id;
        string name;
        string category;
        string image;
        uint256 cost;
        uint256 rating;
        uint256 stock;
    }

    struct Order {
        uint256 time;
        Item item;
    }

    mapping(uint256 => Item) public items;
    mapping(address => uint256) public orderCount;
    mapping(address => mapping(uint256 => Order)) public orders;

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner can call this function");
        _;
    }

    function list(
        uint256 id,
        string memory name,
        string memory category,
        string memory image,
        uint256 cost,
        uint256 rating,
        uint256 stock
    ) public onlyOwner {

        Item memory item = Item(id, name, category, image, cost, rating, stock);

        items[id] = item;
        emit Listed(name, cost, stock);
    }

    function buy(uint256 _id) public payable {

        Item memory item = items[_id];

        require(msg.value >= item.cost);
        require(item.stock > 0, "out of stock");


        orderCount[msg.sender]++;
        orders[msg.sender][orderCount[msg.sender]] = Order(block.timestamp, item);
        
        items[_id].stock = item.stock - 1;

        emit Bought(msg.sender, orderCount[msg.sender], item.id);


    }

    function withdraw() public onlyOwner {
        (bool success, ) = payable(owner).call{value: address(this).balance}("");
        require(success);
    }
}
