import { expect } from 'chai';
import { BigNumber, Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

describe('MacondoMCDVestingWallet', () => {
  let contract: Contract;
  const totalAllocated = ethers.utils.parseEther('6000000000');
  const secondsOf15Years = 15 * 365 * 24 * 60 * 60;
  beforeEach(async () => {
    const [deployer, addr1] = await ethers.getSigners();

    const MacondoMCDVestingWallet = await ethers.getContractFactory(
      'MacondoMCDVestingWallet'
    );
    contract = await upgrades.deployProxy(MacondoMCDVestingWallet, [
      addr1.address,
      ethers.BigNumber.from(new Date('2023-01-01').getTime() / 1000),
    ]);
    await contract.deployed();
  });
  describe('MacondoMCDVestingWallet vestingTokens', () => {
    it('vestedAmountTokenPerShare', async () => {
      const vestingTokens = await contract.vestedAmountTokenPerShare(
        totalAllocated
      );

      expect(vestingTokens).to.equal(ethers.utils.parseEther('193548387'));
    });

    it('vestedAmountCurrentReleaseAmountPerTime', async () => {
      await contract
        .vestedAmountCurrentReleaseAmountPerTime(totalAllocated, 0)
        .then((vestingTokens: BigNumber) => {
          expect(vestingTokens).to.equal(ethers.utils.parseEther('19639'));
        });
      await contract
        .vestedAmountCurrentReleaseAmountPerTime(totalAllocated, 1)
        .then((vestingTokens: BigNumber) => {
          expect(vestingTokens).to.equal(ethers.utils.parseEther('9819'));
        });
      await contract
        .vestedAmountCurrentReleaseAmountPerTime(totalAllocated, 2)
        .then((vestingTokens: BigNumber) => {
          expect(vestingTokens).to.equal(ethers.utils.parseEther('4909'));
        });
      await contract
        .vestedAmountCurrentReleaseAmountPerTime(totalAllocated, 3)
        .then((vestingTokens: BigNumber) => {
          expect(vestingTokens).to.equal(ethers.utils.parseEther('2454'));
        });
      await contract
        .vestedAmountCurrentReleaseAmountPerTime(totalAllocated, 4)
        .then((vestingTokens: BigNumber) => {
          expect(vestingTokens).to.equal(ethers.utils.parseEther('1227'));
        });
    });

    it('vestingTokens', async () => {
      const vestingTokens = await contract.vestingTokens(
        totalAllocated,
        ethers.BigNumber.from(new Date('2024-01-01').getTime() / 1000),
        ethers.BigNumber.from(new Date('2023-01-01').getTime() / 1000),
        secondsOf15Years
      );
      // seconds of 15 years
      expect(vestingTokens).to.equal(ethers.utils.parseEther('1032258064'));
    });
  });
});
