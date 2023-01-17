import { Contract } from 'ethers';
import { ethers } from 'hardhat';
import { ContractDeployAddress } from '../../consts/deploy.address.const';
import { getRuntimeConfig } from '../../utils/config.util';
import {
  deployUpgradeProxy,
  deployUpgradeUpdateWithProposal,
  deployUtil,
} from '../../utils/deploy.util';

const { CONTRACT_DEFAULT_CALLER_ADDRESS } = process.env;
// Deployed contract address
// export const deployedContractAddress = null;
export const deployedContractAddress =
  ContractDeployAddress.MacondoPokerPassMinterBlindBox;

async function main() {
  const contractAddressOfMacondoPokerPass =
    ContractDeployAddress.MacondoPokerPass;

  const contractAddress = deployedContractAddress;

  const DeployContractName = 'MacondoPokerPassMinterBlindBox';
  if (contractAddress) {
    const contract = await deployUpgradeUpdateWithProposal(
      DeployContractName,
      contractAddress
    );
  } else {
    const [deployer] = await ethers.getSigners();
    const contract = await deployUpgradeProxy(DeployContractName, [
      contractAddressOfMacondoPokerPass,
      deployer.address,
    ]);
    await afterFirstDeployUpgradeProxy(contract);
  }
}

async function afterFirstDeployUpgradeProxy(contract: Contract) {
  const [deployer] = await ethers.getSigners();
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
      {
        roleId: ethers.utils.id('SALE_MANAGE_ROLE'),
        roleName: 'saleManager',
      },
    ],
    adminAddress as string
  );

  // revoke roles
  await deployUtil.revokeRoles(
    contract,
    [
      {
        roleId: ethers.utils.id('PAUSER_ROLE'),
        roleName: 'pauser',
      },
      {
        roleId: ethers.utils.id('UPGRADER_ROLE'),
        roleName: 'upgrader',
      },
      {
        roleId: ethers.utils.id('SALE_MANAGE_ROLE'),
        roleName: 'saleManager',
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
