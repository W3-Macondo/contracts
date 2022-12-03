import { expect } from 'chai';
import { BigNumber, Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

describe('MacondoMCDVestingEcosystemWallet', () => {
  let contract: Contract;
  const totalAllocated = ethers.utils.parseEther('1000000000');
  const yearStart = new Date('2023-01-01 00:00:00 GMT').getTime() / 1000;
  const yearEnd = new Date('2033-01-01 00:00:00 GMT').getTime() / 1000;
  const yearDuration = yearEnd - yearStart;
  beforeEach(async () => {
    const [deployer, addr1] = await ethers.getSigners();

    const MacondoMCDVestingEcosystemWallet = await ethers.getContractFactory(
      'MacondoMCDVestingEcosystemWallet'
    );

    contract = await upgrades.deployProxy(MacondoMCDVestingEcosystemWallet, [
      addr1.address,
      yearStart,
      yearDuration,
    ]);
    await contract.deployed();
  });
  describe('vestingTokens', () => {
    it('calculateReleaseCount', async () => {
      await contract
        .calculateReleaseCount(yearStart, yearEnd)
        .then((releaseCount: BigNumber) => {
          expect(releaseCount).to.equal(526032);
        });
      await contract
        .calculateReleaseCount(
          yearStart,
          new Date('2024-01-01 00:00:00 GMT').getTime() / 1000
        )
        .then((releaseCount: BigNumber) => {
          expect(releaseCount).to.equal(52560);
        });

      await contract
        .calculateReleaseCount(yearStart, yearStart)
        .then((releaseCount: BigNumber) => {
          expect(releaseCount).to.equal(0);
        });
      await contract
        .calculateReleaseCount(yearStart, yearStart + 10 * 60)
        .then((releaseCount: BigNumber) => {
          expect(releaseCount).to.equal(1);
        });
    });
  });
  describe.skip('releaseToken', () => {
    let tokenContract: Contract;
    beforeEach(async () => {
      const [owner, addr1] = await ethers.getSigners();
      const TokenContract = await ethers.getContractFactory('MacondoMCD');
      tokenContract = await upgrades.deployProxy(TokenContract);
      await tokenContract.deployed();

      await tokenContract
        .connect(owner)
        .transfer(contract.address, totalAllocated);
    });

    it('releaseToken', async () => {
      // //change block time 2022-01-01 00:00:00
      // await ethers.provider.send('evm_setNextBlockTimestamp', [1640966400]);
      // await ethers.provider.send('evm_mine', []);
      const [owner, addr1] = await ethers.getSigners();

      await contract['releasable(address)'](tokenContract.address).then(
        (amount: BigNumber) => {
          expect(amount).to.equal(0);
        }
      );

      await expect(contract['release(address)'](tokenContract.address))
        .emit(contract, 'ERC20Released')
        .withArgs(tokenContract.address, 0);
    });

    it('releaseToken 1 times', async () => {
      let currentTime = new Date('2023-01-01 00:00:00 GMT').getTime() / 1000;
      //change block time 2023-01-01 00:00:00
      await ethers.provider.send('evm_setNextBlockTimestamp', [currentTime]);
      await ethers.provider.send('evm_mine', []);

      await expect(contract['release(address)'](tokenContract.address))
        .emit(contract, 'ERC20Released')
        .withArgs(tokenContract.address, '1901025032697630562399');

      await contract['releasable(address)'](tokenContract.address).then(
        (amount: BigNumber) => {
          expect(amount).to.equal(0);
        }
      );
      currentTime = new Date('2023-01-01 00:05:00 GMT').getTime() / 1000;

      await expect(contract['release(address)'](tokenContract.address))
        .emit(contract, 'ERC20Released')
        .withArgs(tokenContract.address, 0);
    });
    it('releaseToken all times', async () => {
      let currentTime = new Date('2033-01-01 00:00:00 GMT').getTime() / 1000;
      await ethers.provider.send('evm_setNextBlockTimestamp', [currentTime]);
      await ethers.provider.send('evm_mine', []);

      await expect(contract['release(address)'](tokenContract.address))
        .emit(contract, 'ERC20Released')
        .withArgs(tokenContract.address, ethers.utils.parseEther('1000000000'));

      await contract['releasable(address)'](tokenContract.address).then(
        (amount: BigNumber) => {
          expect(amount).to.equal(0);
        }
      );
      currentTime = new Date('2033-01-02 00:05:00 GMT').getTime() / 1000;

      await expect(contract['release(address)'](tokenContract.address))
        .emit(contract, 'ERC20Released')
        .withArgs(tokenContract.address, 0);
    });
  });
});
