import { expect } from 'chai';
import { BigNumber, Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

describe('MacondoMCDVestingTreasuryWallet', () => {
  let contract: Contract;
  const totalAllocated = ethers.utils.parseEther('1000000000');
  const yearStart = new Date('2023-01-01 00:00:00 GMT').getTime() / 1000;
  const yearEnd = new Date('2033-01-01 00:00:00 GMT').getTime() / 1000;
  const yearDuration = yearEnd - yearStart;
  beforeEach(async () => {
    const [deployer, addr1] = await ethers.getSigners();

    const MacondoMCDVestingTreasuryWallet = await ethers.getContractFactory(
      'MacondoMCDVestingTreasuryWallet'
    );

    contract = await upgrades.deployProxy(MacondoMCDVestingTreasuryWallet, [
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
        .then((totalMonths: BigNumber) => {
          expect(totalMonths).to.equal(120);
        });
      await contract
        .calculateReleaseCount(
          yearStart,
          new Date('2024-01-01 00:00:00 GMT').getTime() / 1000
        )
        .then((totalMonths: BigNumber) => {
          expect(totalMonths).to.equal(12);
        });

      await contract
        .calculateReleaseCount(yearStart, yearStart + 30 * 24 * 60 * 60)
        .then((totalMonths: BigNumber) => {
          expect(totalMonths).to.equal(0);
        });
    });
    it('vestingTokens by years', async () => {
      const yearsVestings: Map<number, string> = new Map();
      yearsVestings.set(2023, '100000000');
      yearsVestings.set(2024, '200000000');
      yearsVestings.set(2025, '300000000');
      yearsVestings.set(2026, '400000000');
      yearsVestings.set(2027, '500000000');
      yearsVestings.set(2028, '600000000');
      yearsVestings.set(2029, '700000000');
      yearsVestings.set(2030, '800000000');
      yearsVestings.set(2031, '900000000');
      yearsVestings.set(2032, '1000000000');

      for (const [year, vesting] of yearsVestings) {
        const yearEnd = new Date(`${year}-12-31 23:59:59`).getTime() / 1000;
        await contract
          .vestingTokens(totalAllocated, yearEnd, yearStart, yearDuration)
          .then((vestingTokens: BigNumber) => {
            expect(vestingTokens).to.equal(ethers.utils.parseEther(vesting));
          });
      }
    });
  });
  describe('releaseToken', () => {
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
        .withArgs(tokenContract.address, '8333333333333333333333333');

      await contract['releasable(address)'](tokenContract.address).then(
        (amount: BigNumber) => {
          expect(amount).to.equal(0);
        }
      );
      currentTime = new Date('2023-01-20 00:00:00 GMT').getTime() / 1000;

      await expect(contract['release(address)'](tokenContract.address))
        .emit(contract, 'ERC20Released')
        .withArgs(tokenContract.address, 0);
    });

    it('releaseToken 2 times', async () => {
      let currentTime = new Date('2023-02-01 00:00:00 GMT').getTime() / 1000;
      //change block time 2023-01-01 00:00:00
      await ethers.provider.send('evm_setNextBlockTimestamp', [currentTime]);
      await ethers.provider.send('evm_mine', []);

      await expect(contract['release(address)'](tokenContract.address))
        .emit(contract, 'ERC20Released')
        .withArgs(tokenContract.address, '16666666666666666666666666');

      await contract['releasable(address)'](tokenContract.address).then(
        (amount: BigNumber) => {
          expect(amount).to.equal(0);
        }
      );
      currentTime = new Date('2023-02-11 00:00:00 GMT').getTime() / 1000;

      await expect(contract['release(address)'](tokenContract.address))
        .emit(contract, 'ERC20Released')
        .withArgs(tokenContract.address, 0);
    });
  });
});
