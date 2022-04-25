import hre = require("hardhat");

async function main() {
  const contractClass = "PikoZooNFT";
  const contractFactory = await hre.ethers.getContractFactory(contractClass);

  const contract = await contractFactory.deploy();
  const tx = await contract.deployed();  

  console.log(contractClass, tx.deployTransaction.hash);
  console.log("-----------------Verify Contract-----------------");
  console.log(
    "hh verify",
    contract.address.toLowerCase(),
    "--contract contracts/" +
      contractClass +
      ".sol:" +
      contractClass +
      " --network",
    hre.network.name
  );

  const [owner] = await hre.ethers.getSigners();
  let configTx;
  if (process.env.OWNER_ADDRESS) {
    configTx = await contract.transferOwnership(process.env.OWNER_ADDRESS);
    await configTx.wait();
  }
  if (process.env.VERIFIER_ADDRESS) {
    configTx = await contract.setVerifier(process.env.VERIFIER_ADDRESS);
    await configTx.wait();
  }
  if (process.env.PRESALE_ROOT) {
    configTx = await contract.setPreSaleRoot(process.env.PRESALE_ROOT);
    await configTx.wait();
  }
  if (process.env.TOKEN_URI) {
    configTx = await contract.setTokenURI(process.env.TOKEN_URI);
    await configTx.wait();
  }
  configTx = await contract.activate(
    1000,
    50,
    process.env.FUND_RECIPIENT || owner.address,
    process.env.ROYALTY_RECIPIENT || owner.address
  );
  await configTx.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
