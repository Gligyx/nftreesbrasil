// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;


import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";


/**
 * @title MarketContract
 * @dev Will receive hypercerts from the Hypercert Contract, the ProjectOwner can change 
 * price & sell limit for that hypercert, anybody can buy hypercert. That's all it does.
 * @custom:dev-run-script ./scripts/deploy_with_ethers.ts
 */
 contract MarketContract {
    using SafeMath for uint256;

    IERC1155 public hypercertContract;

    event HypercertAdded(uint256 tokenId, address owner, int price, uint256 limit);
    event PriceChanged(uint256 tokenId, int oldPrice, int newPrice);
    event LimitChanged(uint256 tokenId, uint oldLimit, uint newLimit);
    event HypercertTransfered(uint256 tokenId, address to, uint256 quantity);

    struct Hypercert {
        uint256 token;
        address owner;
        int price;
        uint256 limit;
    }

    address public admin;
    
    mapping(uint256 => Hypercert) public hypercerts;

    constructor(address _hypercertContract) {
        admin = msg.sender;
        hypercertContract = IERC1155(_hypercertContract);
    }

    modifier onlyAdmin {
        require(msg.sender == admin, "Caller is not admin!");
        _;
    }

    modifier onlyProjectOwner(uint256 tokenId) {
        require(msg.sender == hypercerts[tokenId].owner, "Caller if not ProjectOwner of this token");
        _;
    }

    function registerHypercert(uint256 tokenId, address projectOwner, int price, uint256 limit) external onlyAdmin {
        require(price >= 0, "Price must be positive");
        require(limit >= 0, "Limit must be positive");

        hypercerts[tokenId] = Hypercert({
            token: tokenId,
            owner: projectOwner,
            price: price,
            limit: limit
        });

        emit HypercertAdded(tokenId, projectOwner, price, limit);
    }

    function changePrice(uint256 tokenId, int newPrice) public payable onlyProjectOwner(tokenId) returns (bool) {
        require(hypercerts[tokenId].token != 0, "Hypercert does not exist");
        emit PriceChanged(tokenId, hypercerts[tokenId].price, newPrice);
        hypercerts[tokenId].price = newPrice;
        return true;
    }

    function changeLimit(uint256 tokenId, uint256 newLimit) public payable onlyProjectOwner(tokenId) returns (bool) {
        require(hypercerts[tokenId].token != 0, "Hypercert does not exist");
        emit LimitChanged(tokenId, hypercerts[tokenId].limit, newLimit);
        hypercerts[tokenId].limit = newLimit;
        return true;
    }

    function buyHypercert(uint256 tokenId, uint256 quantity) external payable {
        require(quantity > 0, "Quantity must be positive");
        
        Hypercert storage hypercert = hypercerts[tokenId];
        uint256 remainingTokens = hypercert.limit - hypercertContract.balanceOf(address(this), tokenId);
        require(quantity <= remainingTokens, "Not enough tokens available");
        
        uint256 price = uint256(hypercert.price).mul(quantity);
        require(msg.value >= price, "Insufficient funds");

        // Transfer tokens to the buyer
        hypercertContract.safeTransferFrom(address(this), msg.sender, tokenId, quantity, "");

        // Send money to ProjectOwner
        payable(hypercert.owner).transfer(price);

        emit HypercertTransfered(tokenId, msg.sender, quantity);
    }

    function getHypercertInfo(uint256 tokenId) public view returns (Hypercert memory) {
        return hypercerts[tokenId];
    }
 }