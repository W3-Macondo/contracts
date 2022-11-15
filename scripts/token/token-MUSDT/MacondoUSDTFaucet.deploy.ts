import { ContractDeployAddress } from '../../consts/deploy.address.const';
import {
  deployUpgradeProxy,
  deployUpgradeUpdate,
} from '../../utils/deploy.util';

// Deployed contract address
export const deployedContractAddress = ContractDeployAddress.MacondoUSDTFaucet;

async function main() {
  const contractAddress = deployedContractAddress;

  const DeployContractName = 'MacondoUSDTFaucet';
  if (contractAddress) {
    const contract = await deployUpgradeUpdate(
      DeployContractName,
      contractAddress
    );
  } else {
    const contract = await deployUpgradeProxy(DeployContractName, [
      ContractDeployAddress.MacondoUSDT,
    ]);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
