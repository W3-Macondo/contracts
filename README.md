# Macondo contracts

## contract addresses

### bsc mainnet

- `MacondoBFB`: `0x84c40628121CBd6CB40Dd5B12349bCD3ba010D6f`
  - [bscscan](https://bscscan.com/address/0x84c40628121CBd6CB40Dd5B12349bCD3ba010D6f)
- `MacondoTableNFT`:`0xf30957ECe0Ace9D2279d3365416af0e48Bd341B7`
  - [bscscan](https://bscscan.com/address/0xf30957ECe0Ace9D2279d3365416af0e48Bd341B7)
- `MacondoTableNFTMinterBlindBox`:`0xD0c7C4E2718db68aF8d96C508a494784e887D88a`
  - [bscscan](https://bscscan.com/address/0xD0c7C4E2718db68aF8d96C508a494784e887D88a)
- `MacondoPokerPass`:`0xa71625E8E7E4c5aDB97143eec25a6480854C4007`
  - [bscscan](https://bscscan.com/address/0xa71625E8E7E4c5aDB97143eec25a6480854C4007)
- `MacondoPokerPassMinterBlindBox`:`0x054cFB0B2eCeDaAa4078baFFBBafC212A1170C52`
  - [bscscan](https://bscscan.com/address/0x054cFB0B2eCeDaAa4078baFFBBafC212A1170C52)
- `MacondoPokerPassMinterFreeMint`:`0x350B1fe73BB888Ff8A169D6c33DD8d9cb9044197`
  - [bscscan](https://bscscan.com/address/0x350B1fe73BB888Ff8A169D6c33DD8d9cb9044197)
- `AccountBurn`:`0x25a300A7EB3fB545968C3f73777CC61581FB009F`
  - [bscscan](https://bscscan.com/address/0x25a300A7EB3fB545968C3f73777CC61581FB009F)
- `PokerValidator`:`0x9aAc4d1D1653c2573d5f51C65fc456B250Ceb334`
  - [bscscan](https://bscscan.com/address/0x9aAc4d1D1653c2573d5f51C65fc456B250Ceb334)
- `TokenCollection`:`0x030c9F97bB8287969E9303e0D8De1C7bfF768607`
  - [bscscan](https://bscscan.com/address/0x030c9F97bB8287969E9303e0D8De1C7bfF768607)
- `RandomOracleConsumer`:`0xcf9E0eBed4F78AC920042626cd37cABA34e698C7`
  - [bscscan](https://bscscan.com/address/0xcf9E0eBed4F78AC920042626cd37cABA34e698C7)

## how to develop and test

### Principle of development

#### TDD(Test-Driven Development)

The development process must strictly follow the principle of test-driven development, write test cases first, and then write the function implementation.

#### Code submission requires all test cases to pass

#### Incremental design

### Actual engineering development

#### Update With npm

```shell
git clone https://github.com/W3-Macondo/contracts.git
cd contracts
npm install --package-lock-only
```

The project structure is as follows

```shell
contracts/
├── contracts          --- Contract source code directory, mainly store *.sol contract files
│   ├── HelloWorld.sol
│   └── ...
├── scripts            --- js script directory, mainly store deployment scripts.
│   ├── HelloWorld-deploy.js
│   └── ...
├── test               --- Contract unit test directory
│   ├── HelloWorld-test.js
│   └── ...
├── hardhat.config.js  --- hardhat configuration file
├── package.json
├── .env               --- Environment variable file (need to be created manually)
└── ...
```

## - Automated testing

Running Test Locally (Recommend)

```shell
npx hardhat test
```

```shell
npx hardhat test --grep one
```

Running Test On Polygon Testnet

```shell
npx hardhat test --network mumbai
```

## Deployment

### Deploy contract to testnet or mainnet

```shell
npx hardhat run scripts/HelloWorld-deploy.ts --network mumbai
```

```shell
npx hardhat run --network bsc_testnet scripts/HelloWorld-deploy.ts
npx hardhat run --network bsc_testnet filePath
```

### Record the address of the contract after deployment

```shell
HelloWorld deployed to:0x3F0528D040f31ace17a0c733469145928b9C88a4
```

Record `0x3F0528D040f31ace17a0c733469145928b9C88a4` to any place you like, which is convenient for the `game-service-contract` service to call.

### Compile contract ABI

```shell
npm run compile
```

#### Generate contracts to the corresponding directory structure

````shell

```bash
contracts/
├── abi/
│   └── contracts/
│       ├── HelloWorld.sol/
│       │   ├── HelloWorld.json  ---abi description file
│       │   └── HelloWorld.ts    ---abi Typescript file
│       └── OtherXXX.sol/
│           ├── OtherXXX.json
│           └── OtherXXX.ts
│   └── contracts_sui/
│       └── core/
│           └── OtherXXX.sol
│       └── token/
│           └── SuiBFBToken.sol
└── ...
````

Copy the files in the `abi/` directory to the corresponding project for use

About the `abi/` directory, you can also use the `npm run compile` command to generate the `abi/` directory, and then copy the files in the `abi/` directory to the corresponding project for use.
