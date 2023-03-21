import 'dotenv/config';
import { hardhatArguments } from 'hardhat';
import { deployNetwork } from '../consts/deploy.const';

export interface RuntimeConfig {
  network: string;

  upgradeDefenderMultiSigAddress?: string;
}

export function getRuntimeConfig(): RuntimeConfig {
  const network = hardhatArguments.network;
  switch (network) {
    case deployNetwork.bsc_testnet:
      return getRuntimeConfigBscTestNet();
    case deployNetwork.bsc_mainnet:
      return getRuntimeConfigBscMainNet();
    case deployNetwork.arbitrum_testnet:
      return getRuntimeConfigArbitrumTestNet();
    case deployNetwork.arbitrum_mainnet:
      return getRuntimeConfigArbitrumMainNet();
    default:
      throw new Error(`Network ${network} is not supported`);
  }
}

function getRuntimeConfigBscTestNet(): RuntimeConfig {
  return {
    network: 'bsc_testnet',
    upgradeDefenderMultiSigAddress:
      process.env.BSC_TESTNET_DEPLOYER_UPGRADE_MULTISIG_ADDRESS,
  };
}

function getRuntimeConfigBscMainNet(): RuntimeConfig {
  return {
    network: 'bsc_mainnet',
    upgradeDefenderMultiSigAddress:
      process.env.BSC_MAINNET_DEPLOYER_UPGRADE_MULTISIG_ADDRESS,
  };
}

function getRuntimeConfigArbitrumTestNet(): RuntimeConfig {
  return {
    network: 'arbitrum_testnet',
    upgradeDefenderMultiSigAddress:
      process.env.ARBITRUM_TESTNET_DEPLOYER_UPGRADE_MULTISIG_ADDRESS,
  };
}

function getRuntimeConfigArbitrumMainNet(): RuntimeConfig {
  return {
    network: 'arbitrum_mainnet',
    upgradeDefenderMultiSigAddress:
      process.env.ARBITRUM_TESTNET_DEPLOYER_UPGRADE_MULTISIG_ADDRESS,
  };
}
