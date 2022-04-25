# ZombiezoFT smart contract

Website: T.B.D

Mint site: T.B.D

# Setup project with hardhat

1. Install hardhat `npm install --save-dev hardhat`
2. Install packages: `npm install`
3. Install shorthand: `npm i -g hardhat-shorthand` after install can run hardhat command by `hh` instead of `npx hardhat`

# Compile, deploy and verify smart contract

Script env vars:
  | key                                      | description                                                                                                                                                        |
|------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `PRIVATE_KEY`                            | a mnemonic or private key of deployer's account, ignore if when deploy on hardhat local. The account should have native coin to run deploy contract scripts                     |
| `ROPSTEN_URL`, `RINKEBY_URL`, `GOERLI_URL` | network gateway, get at: [infura](https://infura.io/) [moralis](https://moralis.io/)                                                                               |
| `ETHERSCAN_API_KEY`                      | explorer api key, get at:  [etherscan](https://etherscan.io/myapikey) [bscscan](https://bscscan.com/myapikey) [polygonscan](https://polygonscan.com/myapikey)... |

## Deploy and Verify:

**Command**
1. Set env vars
2. Deploy contract: `hh run scripts/deploy.ts --network <network>`
3. Verify contract: `hh verify <contract_address> --contract contracts/Zombiezoo.sol:NFT --network <network>`

# Testing

**Command**
  `hh test`

## Test cases
  ```
    PikoZooNFT contract
      #initialize
        ✓ sets name is PikoZoo
        ✓ sets symbol is PKZ
        ✓ sets UNIT_PRICE is 0.08 eth
        ✓ sets owner is deployer
        ✓ totalSupply is 0
        ✓ grants owner is Admin
      #activate(uint256 totalSupply_, uint8 maxGiveaway_, address fundRecipient_, address royaltyRecipient_) external override onlyAdmin
        ✓ sets totalSupply is 1000
        ✓ sets maxGiveaway is 50
        ✓ sets right fundRecipient
        ✓ sets right royalty
        when active again 
          ✓ reverts with PKZ: Already activated
        when caller is not admin
          ✓ reverts with AccessControl:
      #supportsInterface(bytes4 interfaceId) external view returns (bool)
        when supports ERC721 - Non-Fungible Token Standard
          ✓ returns true
        when supports ERC721Metadata - Non-Fungible Token Standard metadata extension
          ✓ returns true
        when supports EIP2981 - NFT Royalty Standard
          ✓ returns true
      #transferOwnership(address newOwner) external onlyOwner
        ✓ sets new owner for contract
        when caller is not owner
          ✓ reverts with Ownable:
      #setVerifier(address verifier_) external onlyAdmin
        ✓ sets verifier
        when caller is not admin
          ✓ reverts with AccessControl:
      #revokeVerifier(address verifier_) external onlyAdmin
        ✓ revokes verifier
        when caller is not admin
          ✓ reverts with AccessControl:
      #setTokenURI(string memory tokenURI_) external onlyAdmin
        ✓ sets tokenURI
        when caller is not admin
          ✓ reverts with AccessControl:
      #setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyAdmin
        ✓ sets royalty
        when caller is not admin
          ✓ reverts with AccessControl:
      #setFundRecipient(address fundRecipient_) external onlyAdmin
        ✓ sets fundRecipient
        when caller is not admin
          ✓ reverts with AccessControl:
      #giveaway(address toAddress, uint256 tokenId) external onlyAdmin
        ✓ giveaways tokenId 1
        when giveawayCount is greater than maxGiveaway
          ✓ reverts with PKZ: Invalid giveaway
        when giveaway tokenId is greater than tokenCount
          ✓ reverts with PKZ: Invalid TokenId
        when caller is not admin
          ✓ reverts with AccessControl:
      #function mint(uint256 tokenId, uint256 salt, bytes memory sig, bytes32[] memory proof) external payable
        when private sale
          when preSaleRoot exists
            when valid proof
              ✓ mints tokenID to minter
              when minted is greater than MAX_PRESALE_PER_MINTER(is 2)
                ✓ reverts PKZ: Invalid mint
            when proof is empty
              ✓ reverts PKZ: Invalid mint
            when invalid proof
              ✓ reverts PKZ: Invalid mint
        when public sale
          ✓ mints tokenId
          ✓ marks sig is finalized
          ✓ sends funds to fundRecipient
          when value is less than UNIT_PRICE
            ✓ reverts PKZ: Invalid amount
          when mint tokenId is greater than totalSupply
            ✓ reverts with PKZ: Invalid TokenId
          when invalid salt
            ✓ reverts PKZ: Invalid signature
          when sig recover is not a verifier
            ✓ reverts PKZ: Invalid signature
      #mintBatch(uint256[] memory tokenIds, uint256 salt, bytes memory sig, bytes32[] memory proof) external payable
        when public sale
          ✓ mints tokenIds
          when value is less than UNIT_PRICE * tokenIds.length
            ✓ reverts PKZ: Invalid amount
          when invalid salt
            ✓ reverts PKZ: Invalid signature
          when sig recover is not a verifier
            ✓ reverts PKZ: Invalid signature
  ```
