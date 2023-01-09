import { ethers } from 'hardhat';
import { ContractDeployAddress } from '../../consts/deploy.address.const';
import {
  deployUpgradeProxy,
  deployUpgradeUpdate,
} from '../../utils/deploy.util';

const { CONTRACT_DEFAULT_CALLER_ADDRESS } = process.env;
// Deployed contract address
// export const deployedContractAddress = null;
export const deployedContractAddress =
  ContractDeployAddress.MacondoPokerPassMinterFreeMint;

async function main() {
  const contractAddressOfMacondoPokerPass =
    ContractDeployAddress.MacondoPokerPass;

  const contractAddress = deployedContractAddress;

  const DeployContractName = 'MacondoPokerPassMinterFreeMint';
  if (contractAddress) {
    const contract = await deployUpgradeUpdate(
      DeployContractName,
      contractAddress
    );
  } else {
    const [deployer] = await ethers.getSigners();
    const contract = await deployUpgradeProxy(DeployContractName, [
      contractAddressOfMacondoPokerPass,
      deployer.address,
    ]);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
