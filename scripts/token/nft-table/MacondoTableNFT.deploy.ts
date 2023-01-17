// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// const hre = require("hardhat");
import { ContractDeployAddress } from '../../consts/deploy.address.const';
import {
  deployUpgradeProxy,
  deployUpgradeUpdateWithProposal,
} from '../../utils/deploy.util';
const {
  CONTRACT_DEFAULT_CALLER_ADDRESS,
  PRIVATE_KEY_RANDOM_CONSUMER_CONTRACT_CALLER,
} = process.env;

async function main() {
  // const contractAddress = null;
  //old nft contract address
  // const contractAddress = '0x273a7ce03D2B00afde547830a1B38E616081C992';
  //new nft contract address
  const contractAddress = ContractDeployAddress.MacondoTableNFT;

  const DeployContractName = 'MacondoTableNFT';
  if (contractAddress) {
    const contract = await deployUpgradeUpdateWithProposal(
      DeployContractName,
      contractAddress
    );
  } else {
    const contract = await deployUpgradeProxy(DeployContractName);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
