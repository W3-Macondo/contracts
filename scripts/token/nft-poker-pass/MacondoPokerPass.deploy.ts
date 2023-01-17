import { ContractDeployAddress } from '../../consts/deploy.address.const';
import {
  deployUpgradeProxy,
  deployUpgradeUpdateWithProposal,
} from '../../utils/deploy.util';
const {
  CONTRACT_DEFAULT_CALLER_ADDRESS,
  PRIVATE_KEY_RANDOM_CONSUMER_CONTRACT_CALLER,
} = process.env;

//Deployed contract address
export const deployedContractAddress = ContractDeployAddress.MacondoPokerPass;

async function main() {
  const contractAddress = deployedContractAddress;

  const DeployContractName = 'MacondoPokerPass';
  if (contractAddress) {
    const contract = await deployUpgradeUpdateWithProposal(
      DeployContractName,
      contractAddress
    );
  } else {
    const contract = await deployUpgradeProxy(DeployContractName);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
