import { hardhatArguments } from 'hardhat';

interface ContractDeployAddressInterface {
  MacondoBFB: string | null;
  MacondoMCD: string | null;
  MacondoUSDT: string | null;
  MacondoUSDTFaucet: string | null;
  MacondoTableNFT: string | null;
  MacondoTableNFTMinterBlindBox: string | null;
  MacondoPokerPass: string | null;
  MacondoPokerPassMinterBlindBox: string | null;
  MacondoPokerPassMinterFreeMint: string | null;
  AccountBurn: string | null;
  PokerValidator: string | null;
  TokenCollection: string | null;
  RandomOracleConsumer: string | null;
}

const ContractDeployAddress_BscTestNet: ContractDeployAddressInterface = {
  MacondoBFB: '0x849Ac2eAF42C7239A1f807f250928Eac23376C63',
  MacondoMCD: '0xC3a787C2B1AB52e18bA5387a13c5B6551A89f006',
  MacondoUSDT: '0x97310efB7831A90d9C33e2ddC2E22dF6ef3e9dcA',
  MacondoUSDTFaucet: '0x83Ade0d3b2B198Ea9674A045D900f750aE568Be6',
  MacondoTableNFT: '0x1A516d0E324575Fd6BdD2E54FB9cFcB6C8F3e7A4',
  MacondoTableNFTMinterBlindBox: '0x3eae3657402FE9516093Ef6c7a3773c028BA5354',
  MacondoPokerPass: '0xc26AcBB08E7c30375748ad0D4462fD140d9BCDBc',
  MacondoPokerPassMinterBlindBox: '0x6c2f1e09B427fe3486cC1dc447D02fdB72A16D76',
  MacondoPokerPassMinterFreeMint: '0xD9443Be8C89fED6aEC343c86F1f435FA205C0Dd7',
  AccountBurn: '0xA001e11eccae7926E68937A473C7a58DdE8B08F5',
  PokerValidator: '0x3d7Ea2034ca2d25B71EF55380e309d7b5884b2d3',
  TokenCollection: '0x8023cCfaF67a34628e6e3093B3557E6184782289',
  RandomOracleConsumer: '0x27e69a1acd722A0aA02F4bf611Ea797bFC4Ba3Ee',
};

const ContractDeployAddress_BscMainNet: ContractDeployAddressInterface = {
  MacondoBFB: '0x84c40628121CBd6CB40Dd5B12349bCD3ba010D6f',
  MacondoMCD: null,
  MacondoUSDT: null,
  MacondoUSDTFaucet: null,
  MacondoTableNFT: '0xf30957ECe0Ace9D2279d3365416af0e48Bd341B7',
  MacondoTableNFTMinterBlindBox: null,
  MacondoPokerPass: '0xa71625E8E7E4c5aDB97143eec25a6480854C4007',
  MacondoPokerPassMinterBlindBox: null,
  MacondoPokerPassMinterFreeMint: null,
  AccountBurn: null,
  PokerValidator: null,
  TokenCollection: '0x030c9F97bB8287969E9303e0D8De1C7bfF768607',
  RandomOracleConsumer: null,
};
let _ContractDeployAddress: ContractDeployAddressInterface =
  ContractDeployAddress_BscTestNet;
switch (hardhatArguments.network) {
  case 'bsc_testnet':
    _ContractDeployAddress = ContractDeployAddress_BscTestNet;
    break;
  case 'bsc_mainnet':
    _ContractDeployAddress = ContractDeployAddress_BscMainNet;
    break;
  default:
    _ContractDeployAddress = undefined as any;
    break;
}

export const ContractDeployAddress: ContractDeployAddressInterface =
  _ContractDeployAddress;
