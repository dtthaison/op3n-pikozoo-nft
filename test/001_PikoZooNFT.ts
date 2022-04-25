import { expect } from "chai";
import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import keccak256 = require("keccak256");

describe("PikoZooNFT contract", function () {
  let contract: any;
  let owner: any;
  let addrs: any;
  const sigTypes = ["address", "uint256"];
  let pubStartAt: any = 1651114800;

  beforeEach(async function () {
    [owner, ...addrs] = await ethers.getSigners();

    const contractFactory = await ethers.getContractFactory("PikoZooNFT");
    contract = await contractFactory.deploy();
  });

  describe("#initialize", function () {
    it("sets name is PikoZoo", async function () {
      expect(await contract.name()).to.equal("PikoZoo");
    });

    it("sets symbol is PKZ", async function () {
      expect(await contract.symbol()).to.equal("PKZ");
    });

    it("sets UNIT_PRICE is 0.08 eth", async function () {
      expect(await contract.UNIT_PRICE()).to.equal(
        ethers.utils.parseUnits("0.08", "ether")
      );
    });

    it("sets owner is deployer", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("totalSupply is 0", async function () {
      expect(await contract.totalSupply()).to.equal(0);
    });

    it("grants owner is Admin", async function () {
      const adminRole = await contract.DEFAULT_ADMIN_ROLE();
      expect(await contract.hasRole(adminRole, owner.address)).to.equal(true);
    });
  });

  describe("#activate(uint256 totalSupply_, uint8 maxGiveaway_, address fundRecipient_, address royaltyRecipient_) external override onlyAdmin", function () {
    beforeEach(async function () {
      await contract.activate(
        1000,
        50,
        addrs[0].address,
        addrs[1].address,
      );
    });
    it("sets totalSupply is 1000", async function () {
      expect(await contract.totalSupply()).to.equal(1000);
    });

    it("sets maxGiveaway is 50", async function () {
      expect(await contract.maxGiveaway()).to.equal(50);
    });

    it("sets right fundRecipient", async function () {
      expect(await contract.fundRecipient()).to.equal(addrs[0].address);
    });

    it("sets right royalty", async function () {
      expect(await contract.royaltyInfo(1, ethers.utils.parseUnits("100", "ether"))).to.eql([addrs[1].address, ethers.utils.parseUnits("7.5", "ether")]);
    });

    describe("when active again ", function () {
      it("reverts with PKZ: Already activated", async function () {
        await expect(
          contract.activate(
            1000,
            50,
            addrs[0].address,
            addrs[1].address,
          )
        ).to.be.revertedWith("PKZ: Already activated");
      });
    });

    describe("when caller is not admin", function () {
      it("reverts with AccessControl:", async function () {
        await expect(
          contract.connect(addrs[0]).activate(
            1000,
            50,
            addrs[0].address,
            addrs[1].address,
          )
        ).to.be.revertedWith("AccessControl:");
      });
    });
  });

  describe("#supportsInterface(bytes4 interfaceId) external view returns (bool)", function () {
    describe("when supports ERC721 - Non-Fungible Token Standard", function () {
      it("returns true", async function () {
        expect(await contract.supportsInterface(0x80ac58cd)).to.equal(true);
      });
    });

    describe("when supports ERC721Metadata - Non-Fungible Token Standard metadata extension", function () {
      it("returns true", async function () {
        expect(await contract.supportsInterface(0x5b5e139f)).to.equal(true);
      });
    });

    describe("when supports EIP2981 - NFT Royalty Standard", function () {
      it("returns true", async function () {
        expect(await contract.supportsInterface(0x2a55205a)).to.equal(true);
      });
    });
  });

  describe("#transferOwnership(address newOwner) external onlyOwner", function () {
    it("sets new owner for contract", async function () {
      const newOwner = addrs[2];

      expect(await contract.owner()).to.equal(owner.address);
      await contract.transferOwnership(newOwner.address);
      expect(await contract.owner()).to.equal(newOwner.address);
    });

    describe("when caller is not owner", function () {
      it("reverts with Ownable:", async function () {
        const caller = addrs[1];
        const newOwner = addrs[2];

        expect(await contract.owner()).to.equal(owner.address);
        await expect(
          contract.connect(caller).transferOwnership(newOwner.address)
        ).to.be.revertedWith("Ownable:");
        expect(await contract.owner()).to.equal(owner.address);
      });
    });
  });

  describe("#setVerifier(address verifier_) external onlyAdmin", function () {
    it("sets verifier", async function () {
      const verifier = addrs[2];

      expect(await contract.isVerifier(verifier.address)).to.equal(false);
      await contract.setVerifier(verifier.address);
      expect(await contract.isVerifier(verifier.address)).to.equal(true);
    });

    describe("when caller is not admin", function () {
      it("reverts with AccessControl:", async function () {
        await expect(
          contract.connect(addrs[0]).setVerifier(addrs[1].address)
        ).to.be.revertedWith("AccessControl:");
      });
    });
  });

  describe("#revokeVerifier(address verifier_) external onlyAdmin", function () {
    let verifier: any;
    beforeEach(async function () {
      verifier = addrs[2];
      await contract.setVerifier(verifier.address);
    });

    it("revokes verifier", async function () {
      expect(await contract.isVerifier(verifier.address)).to.equal(true);
      await contract.revokeVerifier(verifier.address);
      expect(await contract.isVerifier(verifier.address)).to.equal(false);
    });

    describe("when caller is not admin", function () {
      it("reverts with AccessControl:", async function () {
        await expect(
          contract.connect(addrs[0]).revokeVerifier(addrs[1].address)
        ).to.be.revertedWith("AccessControl:");
      });
    });
  });

  describe("#setTokenURI(string memory tokenURI_) external onlyAdmin", function () {
    beforeEach(async function () {
      await contract.activate(1000, 50, addrs[0].address, addrs[0].address);
    });

    it("sets tokenURI", async function () {
      await contract.giveaway(addrs[2].address, 1);
      expect(await contract.tokenURI(1)).to.equal("");
      await contract.setTokenURI("https://uri.com/");
      expect(await contract.tokenURI(1)).to.equal("https://uri.com/1");
    });

    describe("when caller is not admin", function () {
      it("reverts with AccessControl:", async function () {
        await expect(
          contract.connect(addrs[0]).setTokenURI("https://uri.com/")
        ).to.be.revertedWith("AccessControl:");
      });
    });
  });

  describe("#setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyAdmin", function () {
    it("sets royalty", async function () {
      expect(await contract.royaltyInfo(1, ethers.utils.parseUnits("100", "ether"))).to.eql([ethers.constants.AddressZero, ethers.utils.parseUnits("0", "ether")]);
      await contract.setDefaultRoyalty(addrs[3].address, 750);
      expect(await contract.royaltyInfo(1, ethers.utils.parseUnits("100", "ether"))).to.eql([addrs[3].address, ethers.utils.parseUnits("7.5", "ether")]);
    });

    describe("when caller is not admin", function () {
      it("reverts with AccessControl:", async function () {
        await expect(
          contract.connect(addrs[1]).setDefaultRoyalty(addrs[3].address, 750)
        ).to.be.revertedWith("AccessControl:");
      });
    });
  });

  describe("#setFundRecipient(address fundRecipient_) external onlyAdmin", function () {
    beforeEach(async function () {
      await contract.activate(1000, 50, addrs[0].address, addrs[0].address);
    });

    it("sets fundRecipient", async function () {
      expect(await contract.fundRecipient()).to.equal(addrs[0].address);
      await contract.setFundRecipient(addrs[5].address);
      expect(await contract.fundRecipient()).to.equal(addrs[5].address);
    });

    describe("when caller is not admin", function () {
      it("reverts with AccessControl:", async function () {
        await expect(
          contract.connect(addrs[0]).setFundRecipient(addrs[5].address)
        ).to.be.revertedWith("AccessControl:");
      });
    });
  });

  describe("#giveaway(address toAddress, uint256 tokenId) external onlyAdmin", function () {
    beforeEach(async function () {
      await contract.activate(4, 2, addrs[0].address, addrs[0].address);
      await contract.setTokenURI("https://uri.com/");
    });

    it("giveaways tokenId 1", async function () {
      expect(await contract.giveawayCount()).to.equal(0);
      expect(await contract.tokenCount()).to.equal(0);

      await contract.giveaway(addrs[5].address, 1);
      expect(await contract.giveawayCount()).to.equal(1);
      expect(await contract.tokenCount()).to.equal(1);
      expect(await contract.ownerOf(1)).to.equal(addrs[5].address);
      expect(await contract.tokenURI(1)).to.equal("https://uri.com/1");
    });

    describe("when giveawayCount is greater than maxGiveaway", function () {
      it("reverts with PKZ: Invalid giveaway", async function () {
        await contract.giveaway(addrs[5].address, 1);
        expect(await contract.giveawayCount()).to.equal(1);
        
        await contract.giveaway(addrs[5].address, 2);
        expect(await contract.giveawayCount()).to.equal(2);
        
        await expect(
          contract.giveaway(addrs[5].address, 3)
        ).to.be.revertedWith("PKZ: Invalid giveaway");
        expect(await contract.giveawayCount()).to.equal(2);
      });
    });

    describe("when giveaway tokenId is greater than tokenCount", function () {
      it("reverts with PKZ: Invalid TokenId", async function () {
        await expect(
          contract.giveaway(addrs[5].address, 6)
        ).to.be.revertedWith("PKZ: Invalid TokenId");
      });
    });

    describe("when caller is not admin", function () {
      it("reverts with AccessControl:", async function () {
        expect(await contract.giveawayCount()).to.equal(0);
        await expect(
          contract.connect(addrs[0]).giveaway(addrs[5].address, 1)
        ).to.be.revertedWith("AccessControl:");
        expect(await contract.giveawayCount()).to.equal(0);
      });
    });
  });

  describe("#function mint(uint256 tokenId, uint256 salt, bytes memory sig, bytes32[] memory proof) external payable", function () {
    let verifier: any;
    let fundRecipient: any;
    let royaltyRecipient: any;

    // helpers
    async function mintCaller(tokenId: number, minter: any, proof?: any): Promise<any> {
      const salt = new Date().getTime();
      const orderHash = ethers.utils.solidityKeccak256(sigTypes, [
        minter.address,
        salt,
      ]);
      const sig = await verifier.signMessage(ethers.utils.arrayify(orderHash));
      return contract.connect(minter).mint(tokenId, salt, sig, proof || [], {
        value: ethers.utils.parseUnits("0.08", "ether"),
      });
    }

    beforeEach(async function () {
      verifier = addrs[0];
      fundRecipient = addrs[1];
      royaltyRecipient = addrs[2];
      await contract.setVerifier(verifier.address);
      await contract.activate(
        5,
        2,
        fundRecipient.address,
        royaltyRecipient.address,
      );
      await contract.setTokenURI("https://uri.com/");
    });

    describe("when private sale", function () {
      let preStartAt: any = 1650942000;
      
      beforeEach(async function () {
        // set pre sale
        preStartAt += 100;
        await ethers.provider.send("evm_setNextBlockTimestamp", [preStartAt]);
      });

      describe("when preSaleRoot exists", function () {
        let tree: MerkleTree;

        function generateLeaf(address: string): Buffer {
          return Buffer.from(
            // Hash in appropriate Merkle format
            ethers.utils.solidityKeccak256(["address"], [address]).slice(2),
            "hex"
          );
        }

        beforeEach(async function () {
          const leaves: Buffer[] = [
            generateLeaf(addrs[6].address),
            generateLeaf(addrs[7].address),
            generateLeaf(addrs[8].address),
          ];
          tree = new MerkleTree(leaves, keccak256, {
            sortPairs: true,
          });
          await contract.setPreSaleRoot(tree.getHexRoot());
        });

        describe("when valid proof", function () {
          it("mints tokenID to minter", async function () {
            const minter = addrs[6];
            await mintCaller(1, minter, tree.getHexProof(keccak256(minter.address)));

            expect(await contract.ownerOf(1)).to.equal(minter.address);
          });

          describe("when minted is greater than MAX_PRESALE_PER_MINTER(is 2)", function () {
            it("reverts PKZ: Invalid mint", async function () {
              const minter = addrs[6];
              const proof = tree.getHexProof(keccak256(minter.address));
              await mintCaller(
                1,
                minter,
                proof
              );
              await mintCaller(
                2,
                minter,
                proof
              );

              await expect(
                mintCaller(3, minter, proof)
              ).to.be.revertedWith("PKZ: Invalid mint");
            });
          });
        });

        describe("when proof is empty", function () {
          it("reverts PKZ: Invalid mint", async function () {
            await expect(mintCaller(1, addrs[6], [])).to.be.revertedWith(
              "PKZ: Invalid mint"
            );
          });
        });

        describe("when invalid proof", function () {
          it("reverts PKZ: Invalid mint", async function () {
            const leaves = [addrs[2].address, addrs[3].address];
            const merkleTree = new MerkleTree(leaves, keccak256, {
              hashLeaves: true,
              sortPairs: true,
            });
            const leaf = keccak256(addrs[2].address);
            const invalidProof = merkleTree.getHexProof(leaf);

            await expect(mintCaller(1, addrs[2], invalidProof)).to.be.revertedWith(
              "PKZ: Invalid mint"
            );

            await ethers.provider.send("evm_setNextBlockTimestamp", [1651114800]);
            await mintCaller(1, addrs[2], invalidProof);
            expect(await contract.ownerOf(1)).to.equal(addrs[2].address);
          });
        });
      });
    });

    describe("when public sale", function () {
      beforeEach(async function () {
        // set public sale
        pubStartAt += 100;
        await ethers.provider.send("evm_setNextBlockTimestamp", [pubStartAt]);
      });

      it("mints tokenId", async function () {
        const minter = addrs[5];
        expect(await contract.balanceOf(minter.address)).to.equal(0);
        expect(await contract.tokenCount()).to.equal(0);
        
        await mintCaller(1, minter, []);
        expect(await contract.ownerOf(1)).to.equal(minter.address);
        expect(await contract.tokenURI(1)).to.equal("https://uri.com/1");
        expect(await contract.balanceOf(minter.address)).to.equal(1);
        expect(await contract.tokenCount()).to.equal(1);
      });

      it("marks sig is finalized", async function () {
        const salt = new Date().getTime();
        const orderHash = ethers.utils.solidityKeccak256(sigTypes, [
          addrs[5].address,
          salt,
        ]);
        const sig = await verifier.signMessage(ethers.utils.arrayify(orderHash));
        await contract.connect(addrs[5]).mint(1, salt, sig, [], {
          value: ethers.utils.parseUnits("0.08", "ether"),
        });
        expect(await contract.finalized(orderHash)).to.equal(true);
        
        await expect(
          contract.connect(addrs[5]).mint(1, salt, sig, [], {
            value: ethers.utils.parseUnits("0.08", "ether"),
          })
        ).to.revertedWith("PKZ: Invalid signature");
      });

      it("sends funds to fundRecipient", async function () {
        const fundRecipientBalance = await fundRecipient.getBalance();
        await mintCaller(1, addrs[5]);
        expect((await fundRecipient.getBalance()).toString()).to.equal(
          fundRecipientBalance.add(ethers.utils.parseUnits("0.08", "ether")).toString()
        );
      });

      describe("when value is less than UNIT_PRICE", function () {
        it("reverts PKZ: Invalid amount", async function () {
          const minter = addrs[6];
          const salt = new Date().getTime();
          const orderHash = ethers.utils.solidityKeccak256(sigTypes, [
            minter.address,
            salt,
          ]);
          const sig = await verifier.signMessage(ethers.utils.arrayify(orderHash));

          await expect(
            contract.connect(minter).mint(1, salt, sig, [], {
              value: ethers.utils.parseUnits("0.07", "ether"),
            })
          ).to.be.revertedWith("PKZ: Invalid amount");
        });
      });

      describe("when mint tokenId is greater than totalSupply", function () {
        it("reverts with PKZ: Invalid TokenId", async function () {
          await expect(
            contract.giveaway(addrs[5].address, 6)
          ).to.be.revertedWith("PKZ: Invalid TokenId");
        });
      });

      describe("when invalid salt", function () {
        it("reverts PKZ: Invalid signature", async function () {
          const minter = addrs[1];
          const salt = new Date().getTime();
          const orderHash = ethers.utils.solidityKeccak256(sigTypes, [
            minter.address,
            salt,
          ]);
          const sig = await verifier.signMessage(ethers.utils.arrayify(orderHash));

          await contract.connect(minter).mint(1, salt, sig, [], {
            value: ethers.utils.parseUnits("0.08", "ether"),
          });
          expect(await contract.ownerOf(1)).to.equal(minter.address);

          await expect(
            contract.connect(minter).mint(1, salt, sig, [], {
              value: ethers.utils.parseUnits("0.08", "ether"),
            })
          ).to.be.revertedWith("PKZ: Invalid signature");
        });
      });

      describe("when sig recover is not a verifier", function () {
        it("reverts PKZ: Invalid signature", async function () {
          const minter = addrs[1];
          const salt = new Date().getTime();
          const orderHash = ethers.utils.solidityKeccak256(sigTypes, [
            minter.address,
            salt,
          ]);
          const sig = await addrs[10].signMessage(
            ethers.utils.arrayify(orderHash)
          );

          await expect(
            contract.connect(minter).mint(1, salt, sig, [], {
              value: ethers.utils.parseUnits("0.08", "ether"),
            })
          ).to.be.revertedWith("PKZ: Invalid signature");
        });
      });
    });
  });

  describe("#mintBatch(uint256[] memory tokenIds, uint256 salt, bytes memory sig, bytes32[] memory proof) external payable", function () {
    let verifier: any;
    let fundRecipient: any;
    let royaltyRecipient: any;

    beforeEach(async function () {
      verifier = addrs[0];
      fundRecipient = addrs[1];
      royaltyRecipient = addrs[2];
      await contract.setVerifier(verifier.address);
      await contract.activate(
        5,
        2,
        fundRecipient.address,
        royaltyRecipient.address,
      );
      await contract.setTokenURI("https://uri.com/");
    });

    describe("when public sale", function () {
      beforeEach(async function () {
        // set public sale
        pubStartAt += 100;
        await ethers.provider.send("evm_setNextBlockTimestamp", [pubStartAt]);
      });

      it("mints tokenIds", async function () {
        const minter = addrs[5];
        const salt = new Date().getTime();
        const orderHash = ethers.utils.solidityKeccak256(sigTypes, [
          minter.address,
          salt,
        ]);
        const sig = await verifier.signMessage(ethers.utils.arrayify(orderHash));
        
        expect(await contract.tokenCount()).to.equal(0);
        await contract.connect(minter).mintBatch([1, 2, 3], salt, sig, [], {
          value: ethers.utils.parseUnits("0.24", "ether"),
        });
  
        expect(await contract.tokenCount()).to.equal(3);
        expect(await contract.ownerOf(1)).to.equal(minter.address);
        expect(await contract.ownerOf(2)).to.equal(minter.address);
        expect(await contract.ownerOf(3)).to.equal(minter.address);
        expect(await contract.tokenURI(1)).to.equal("https://uri.com/1");
        expect(await contract.tokenURI(2)).to.equal("https://uri.com/2");
        expect(await contract.tokenURI(3)).to.equal("https://uri.com/3");
      });
  
      describe("when value is less than UNIT_PRICE * tokenIds.length", function () {
        it("reverts PKZ: Invalid amount", async function () {
          const minter = addrs[6];
          const salt = new Date().getTime();
          const orderHash = ethers.utils.solidityKeccak256(sigTypes, [
            minter.address,
            salt,
          ]);
          const sig = await verifier.signMessage(ethers.utils.arrayify(orderHash));
  
          await expect(
            contract.connect(minter).mintBatch([1,2,3], salt, sig, [], {
              value: ethers.utils.parseUnits("0.23", "ether"),
            })
          ).to.be.revertedWith("PKZ: Invalid amount");
        });
      });
  
      describe("when invalid salt", function () {
        it("reverts PKZ: Invalid signature", async function () {
          const minter = addrs[1];
          const salt = new Date().getTime();
          const orderHash = ethers.utils.solidityKeccak256(sigTypes, [
            minter.address,
            salt,
          ]);
          const sig = await verifier.signMessage(ethers.utils.arrayify(orderHash));
  
          await contract.connect(minter).mintBatch([1], salt, sig, [], {
            value: ethers.utils.parseUnits("0.08", "ether"),
          });
          expect(await contract.ownerOf(1)).to.equal(minter.address);
  
          await expect(
            contract.connect(minter).mintBatch([1], salt, sig, [], {
              value: ethers.utils.parseUnits("0.08", "ether"),
            })
          ).to.be.revertedWith("PKZ: Invalid signature");
        });
      });
  
      describe("when sig recover is not a verifier", function () {
        it("reverts PKZ: Invalid signature", async function () {
          const minter = addrs[1];
          const salt = new Date().getTime();
          const orderHash = ethers.utils.solidityKeccak256(sigTypes, [
            minter.address,
            salt,
          ]);
          const sig = await addrs[10].signMessage(
            ethers.utils.arrayify(orderHash)
          );
  
          await expect(
            contract.connect(minter).mintBatch([1], salt, sig, [], {
              value: ethers.utils.parseUnits("0.08", "ether"),
            })
          ).to.be.revertedWith("PKZ: Invalid signature");
        });
      });
    });
  });
});