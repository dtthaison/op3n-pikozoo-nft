import hre = require("hardhat");

async function main() {
  const contractAddress = process.env.DEPLOYED_CONTRACT;
  if (!contractAddress) {
    console.error("Please set DEPLOYED_CONTRACT");
    return;
  }

  const tokenUri = process.env.TOKEN_URI;
  if (!tokenUri) {
    console.error("Please set TOKEN_URI");
    return;
  }

  const [owner] = await hre.ethers.getSigners();
  const contractClass = "PikoZooNFT";
  const artifact = await hre.artifacts.readArtifact(contractClass);
  const contract = new hre.ethers.Contract(
    contractAddress,
    artifact.abi,
    owner
  );

  const tx = await contract.setTokenURI(tokenUri);
  const receipt = await tx.wait();
  console.log(receipt);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
