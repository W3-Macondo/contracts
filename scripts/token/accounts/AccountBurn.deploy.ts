import { ethers } from 'ethers';
import hre from 'hardhat';
import { ContractDeployAddress } from '../../consts/deploy.address.const';
import { getRuntimeConfig } from '../../utils/config.util';
import {
  deployUpgradeProxy,
  deployUpgradeUpdateWithProposal,
  deployUtil,
} from '../../utils/deploy.util';
const {
  CONTRACT_DEFAULT_CALLER_ADDRESS,
  PRIVATE_KEY_RANDOM_CONSUMER_CONTRACT_CALLER,
} = process.env;

async function main() {
  const contractAddress = ContractDeployAddress.AccountBurn;

  const DeployContractName = 'AccountBurn';
  if (contractAddress) {
    const contract = await deployUpgradeUpdateWithProposal(
      DeployContractName,
      contractAddress
    );
  } else {
    const contract = await deployUpgradeProxy(DeployContractName);
    await afterFirstDeployUpgradeProxy(contract);
  }
}

async function afterFirstDeployUpgradeProxy(contract: ethers.Contract) {
  const [deployer] = await hre.ethers.getSigners();
  const runtimeConfig = getRuntimeConfig();
  const adminAddress = runtimeConfig.upgradeDefenderMultiSigAddress;

  // grant roles
  await deployUtil.grantRoles(
    contract,
    [
      {
        roleId:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        roleName: 'admin',
      },
      {
        roleId: ethers.utils.id('PAUSER_ROLE'),
        roleName: 'pauser',
      },
      {
        roleId: ethers.utils.id('UPGRADER_ROLE'),
        roleName: 'upgrader',
      },
    ],
    adminAddress as string
  );

  // revoke roles
  await deployUtil.revokeRoles(
    contract,
    [
      {
        roleId: ethers.utils.id('BURNER_ROLE'),
        roleName: 'burner',
      },
      {
        roleId: ethers.utils.id('PAUSER_ROLE'),
        roleName: 'pauser',
      },
      {
        roleId: ethers.utils.id('UPGRADER_ROLE'),
        roleName: 'upgrader',
      },
      {
        roleId:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        roleName: 'admin',
      },
    ],
    deployer.address
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
