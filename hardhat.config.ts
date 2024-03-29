import '@nomiclabs/hardhat-waffle';
import 'dotenv/config';
import { task } from 'hardhat/config';

import '@openzeppelin/hardhat-defender';
import '@openzeppelin/hardhat-upgrades';
import 'hardhat-abi-exporter';

const {
  ALCHEMY_API_TESTNET_URL,
  PRIVATE_KEY,
  BSC_TESTNET_URL,
  BSC_TESTNET_DEPLOYER_PRIVATE_KEY,
  BSC_MAINNET_URL,
  BSC_MAINNET_DEPLOYER_PRIVATE_KEY,
  ARBITRUM_TESTNET_URL,
  ARBITRUM_TESTNET_DEPLOYER_PRIVATE_KEY,
  ETH_TESTNET_URL,
  ETH_TESTNET_DEPLOYER_PRIVATE_KEY,
} = process.env;
// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: '0.8.9',

  networks: {
    bsc_testnet: {
      url: BSC_TESTNET_URL,
      chainId: 97,
      gasPrice: 20000000000,
      accounts: [`0x${BSC_TESTNET_DEPLOYER_PRIVATE_KEY}`],
    },
    bsc_mainnet: {
      url: BSC_MAINNET_URL,
      accounts: [`0x${BSC_MAINNET_DEPLOYER_PRIVATE_KEY}`],
    },
    bsc_local: {
      url: 'http://127.0.0.1:8545',
      chainId: 1337,
      gasPrice: 20000000000,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    mumbai: {
      url: ALCHEMY_API_TESTNET_URL,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    arbitrum_testnet: {
      url: ARBITRUM_TESTNET_URL,
      chainId: 421613,
      accounts: [`0x${ARBITRUM_TESTNET_DEPLOYER_PRIVATE_KEY}`],
    },
    arbitrum_mainnet: {
      url: BSC_MAINNET_URL,
      accounts: [`0x${BSC_MAINNET_DEPLOYER_PRIVATE_KEY}`],
    },
    eth_testnet: {
      url: ETH_TESTNET_URL,
      chainId: 5,
      gasPrice: 50000000000,
      accounts: [`0x${ETH_TESTNET_DEPLOYER_PRIVATE_KEY}`],
    },
  },
  mocha: {
    timeout: 2 * 60 * 1000,
  },
  abiExporter: {
    except: ['contracts/tests', 'contracts/core', 'contracts/providers'],
  },
  defender: {
    apiKey: process.env.CONTRACT_DEPLOYER_DEFENDER_TEAM_API_KEY,
    apiSecret: process.env.CONTRACT_DEPLOYER_DEFENDER_API_SECRET_KEY,
  },
};
