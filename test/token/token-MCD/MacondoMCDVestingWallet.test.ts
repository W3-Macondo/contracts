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
  describe('MacondoMCDVestingWallet vestingTokens', () => {
    it('calculateMonths', async () => {
      await contract
        .calculateMonths(yearStart, yearEnd)
        .then((totalMonths: BigNumber) => {
          expect(totalMonths).to.equal(120);
        });
      await contract
        .calculateMonths(
          yearStart,
          new Date('2024-01-01 00:00:00 GMT').getTime() / 1000
        )
        .then((totalMonths: BigNumber) => {
          expect(totalMonths).to.equal(12);
        });

      await contract
        .calculateMonths(yearStart, yearStart + 30 * 24 * 60 * 60)
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
});
