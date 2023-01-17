import { hardhatArguments } from 'hardhat';
import { deployNetwork } from '../consts/deploy.const';
import { deployNormal as deployer } from '../utils/deploy.util';

interface config {
  subscriptionId: number;
  m_vrfCoordinator: string;
  m_keyHash: string;
}

function getConfig(): config {
  const network = hardhatArguments.network;
  switch (network) {
    case deployNetwork.bsc_testnet:
      return {
        subscriptionId: 1592,
        m_vrfCoordinator: '0x6a2aad07396b36fe02a22b33cf443582f682c82f',
        m_keyHash:
          '0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314',
      };
    case deployNetwork.bsc_mainnet:
      return {
        subscriptionId: 687,
        m_vrfCoordinator: '0xc587d9053cd1118f25f645f9e08bb98c9712a4ee',
        m_keyHash:
          '0x114f3da0a805b6a67d6e9cd2ec746f7028f1b7376365af575cfea3550dd1aa04',
      };
    default:
      throw new Error(`Network ${network} is not supported`);
  }
}

async function main() {
  const config = getConfig();

  const subscriptionId = config.subscriptionId;
  const m_vrfCoordinator = config.m_vrfCoordinator;
  const m_keyHash = config.m_keyHash;

  const contract = await deployer(
    'RandomOracleConsumer',
    subscriptionId,
    m_vrfCoordinator,
    m_keyHash
  );
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
