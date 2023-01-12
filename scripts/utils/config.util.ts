import 'dotenv/config';
import { hardhatArguments } from 'hardhat';

export interface RuntimeConfig {
  network: string;

  upgradeDefenderMultiSigAddress?: string;
}

export function getRuntimeConfig(): RuntimeConfig {
  const network = hardhatArguments.network;
  switch (network) {
    case 'bsc_testnet':
      return getRuntimeConfigBscTestNet();
    case 'bsc_mainnet':
      return getRuntimeConfigBscMainNet();
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
