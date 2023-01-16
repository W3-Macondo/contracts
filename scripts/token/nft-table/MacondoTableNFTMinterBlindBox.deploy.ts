// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// const hre = require("hardhat");
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

async function main() {
  const contractAddressOfMacondoTableNFT =
    ContractDeployAddress.MacondoTableNFT;

  // const contractAddress = null;
  //old nft contract address
  const preContractAddress = null;
  const contractAddress = ContractDeployAddress.MacondoTableNFTMinterBlindBox;

  const DeployContractName = 'MacondoTableNFTMinterBlindBox';
  if (contractAddress) {
    const contract = await deployUpgradeUpdateWithProposal(
      DeployContractName,
      contractAddress
    );
  } else {
    const [deployer] = await ethers.getSigners();
    const contract = await deployUpgradeProxy(DeployContractName, [
      contractAddressOfMacondoTableNFT,
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

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
