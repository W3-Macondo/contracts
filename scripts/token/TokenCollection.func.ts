// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// const hre = require("hardhat");
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { ContractDeployAddress } from '../consts/deploy.address.const';
const { CONTRACT_DEFAULT_CALLER_ADDRESS } = process.env;
const oldContractAddress = '0x8023cCfaF67a34628e6e3093B3557E6184782289';
const newContractAddress = ContractDeployAddress.TokenCollection;

async function transferBNB() {
  const DeployContractName = 'TokenCollection';
  const oldContract = await ethers.getContractAt(
    DeployContractName,
    oldContractAddress
  );
  const balance = await ethers.provider.getBalance(oldContractAddress);
  console.log(
    `before transfer:BNB, balance: ${ethers.utils
      .formatEther(balance)
      .toString()}`
  );
  if (balance.gt(0)) {
    await oldContract.withdraw(newContractAddress, balance);
  }

  const newBalance = await ethers.provider.getBalance(
    newContractAddress as string
  );
  console.log(
    `after transfer:BNB, balance: ${ethers.utils
      .formatEther(newBalance)
      .toString()}`
  );
}

async function transferERC20(
  tokenContractName: string,
  tokenContractAddress: string
) {
  const DeployContractName = 'TokenCollection';
  const oldContract = await ethers.getContractAt(
    DeployContractName,
    oldContractAddress
  );

  const erc20Contract = await ethers.getContractAt(
    tokenContractName,
    tokenContractAddress
  );

  const balance: BigNumber = await erc20Contract.balanceOf(oldContractAddress);

  console.log(
    `before transfer:${tokenContractName}, balance: ${ethers.utils
      .formatEther(balance)
      .toString()}`
  );
  if (balance.gt(0)) {
    await oldContract.withdrawERC20(
      tokenContractAddress,
      newContractAddress,
      balance
    );
  }

  const newBalance = await erc20Contract.balanceOf(newContractAddress);
  console.log(
    `after transfer:${tokenContractName}, balance: ${ethers.utils
      .formatEther(newBalance)
      .toString()}`
  );
}

async function transferERC721(
  tokenContractName: string,
  tokenContractAddress: string
) {
  const DeployContractName = 'TokenCollection';
  const oldContract = await ethers.getContractAt(
    DeployContractName,
    oldContractAddress
  );

  const erc721Contract = await ethers.getContractAt(
    tokenContractName,
    tokenContractAddress
  );

  const balance: BigNumber = await erc721Contract.balanceOf(oldContractAddress);

  console.log(
    `before transfer:${tokenContractName}, balance: ${balance.toString()}`
  );

  const withdraw721 = async (index: number) => {
    const tokenId = await erc721Contract.tokenOfOwnerByIndex(
      oldContractAddress,
      index
    );

    await oldContract.withdrawERC721(
      tokenContractAddress,
      newContractAddress,
      tokenId
    );
  };

  if (balance.gt(0)) {
    const allPromise: Promise<any>[] = [];
    // const tokenCount = Math.min(balance.toNumber(), 2);
    const tokenCount = balance.toNumber();
    for (let i = 0; i < tokenCount; i++) {
      await withdraw721(i);
      //sleep 1000ms
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(`withdraw ${i} token, left ${tokenCount - i} token`);
    }
  }

  const newBalance = await erc721Contract.balanceOf(newContractAddress);
  console.log(
    `after transfer:${tokenContractName}, balance: ${balance.toString()}`
  );
}

async function main() {
  // await transferBNB();
  // await transferERC20(
  //   'MacondoUSDT',
  //   ContractDeployAddress.MacondoUSDT as string
  // );
  // await transferERC20('MacondoBFB', ContractDeployAddress.MacondoBFB as string);
  // await transferERC721(
  //   'MacondoTableNFT',
  //   ContractDeployAddress.MacondoTableNFT as string
  // );
  // await transferERC721(
  //   'MacondoPokerPass',
  //   ContractDeployAddress.MacondoPokerPass as string
  // );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
