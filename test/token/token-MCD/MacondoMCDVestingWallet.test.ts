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
          expect(vestingTokens).to.equal(ethers.utils.parseEther('19621'));
        });
      await contract
        .vestedAmountCurrentReleaseAmountPerTime(totalAllocated, 1)
        .then((vestingTokens: BigNumber) => {
          expect(vestingTokens).to.equal(ethers.utils.parseEther('9810'));
        });
      await contract
        .vestedAmountCurrentReleaseAmountPerTime(totalAllocated, 2)
        .then((vestingTokens: BigNumber) => {
          expect(vestingTokens).to.equal(ethers.utils.parseEther('4909'));
        });
      await contract
        .vestedAmountCurrentReleaseAmountPerTime(totalAllocated, 3)
        .then((vestingTokens: BigNumber) => {
          expect(vestingTokens).to.equal(ethers.utils.parseEther('2452'));
        });
      await contract
        .vestedAmountCurrentReleaseAmountPerTime(totalAllocated, 4)
        .then((vestingTokens: BigNumber) => {
          expect(vestingTokens).to.equal(ethers.utils.parseEther('1226'));
        });
    });

    it('vestAmountTokenCurrentReleaseTimes', async () => {
      await contract
        .vestAmountTokenCurrentReleaseTimes(
          ethers.BigNumber.from(new Date('2024-01-01').getTime() / 1000),
          ethers.BigNumber.from(new Date('2023-01-01').getTime() / 1000)
        )
        .then((vestingTokens: BigNumber) => {
          expect(vestingTokens).to.equal((365 * 24 * 60 * 60) / 10 / 60);
        });
    });

    it('verify releaseLevels', async () => {
      await contract.releaseLevels(0).then((releaseLevel: any) => {
        expect(releaseLevel.level).to.equal(0);
        expect(releaseLevel.releaseTotalTimes).to.equal(52560 + 52704 + 52560);
        expect(releaseLevel.releaseRatio).to.equal(16);
      });

      await contract.releaseLevels(1).then((releaseLevel: any) => {
        expect(releaseLevel.level).to.equal(1);
        expect(releaseLevel.releaseTotalTimes).to.equal(52560 + 52560 + 52704);
        expect(releaseLevel.releaseRatio).to.equal(8);
      });

      await contract.releaseLevels(2).then((releaseLevel: any) => {
        expect(releaseLevel.level).to.equal(2);
        expect(releaseLevel.releaseTotalTimes).to.equal(52560 + 52560 + 52560);
        expect(releaseLevel.releaseRatio).to.equal(4);
      });

      await contract.releaseLevels(3).then((releaseLevel: any) => {
        expect(releaseLevel.level).to.equal(3);
        expect(releaseLevel.releaseTotalTimes).to.equal(52704 + 52560 + 52560);
        expect(releaseLevel.releaseRatio).to.equal(2);
      });

      await contract.releaseLevels(4).then((releaseLevel: any) => {
        expect(releaseLevel.level).to.equal(4);
        expect(releaseLevel.releaseTotalTimes).to.equal(52560 + 52704 + 52560);
        expect(releaseLevel.releaseRatio).to.equal(1);
      });
    });

    it('calculateReleaseLevel', async () => {
      await contract
        .calculateReleaseLevel(0)
        .then((releaseLevel: BigNumber) => {
          expect(releaseLevel).to.equal(0);
        });
      await contract
        .calculateReleaseLevel(157823)
        .then((releaseLevel: BigNumber) => {
          expect(releaseLevel).to.equal(0);
        });
      await contract
        .calculateReleaseLevel(157824)
        .then((releaseLevel: BigNumber) => {
          expect(releaseLevel).to.equal(1);
        });
      await contract
        .calculateReleaseLevel(315648 - 1)
        .then((releaseLevel: BigNumber) => {
          expect(releaseLevel).to.equal(1);
        });

      await contract
        .calculateReleaseLevel(315648)
        .then((releaseLevel: BigNumber) => {
          expect(releaseLevel).to.equal(2);
        });
      await contract
        .calculateReleaseLevel(473328 - 1)
        .then((releaseLevel: BigNumber) => {
          expect(releaseLevel).to.equal(2);
        });

      await contract
        .calculateReleaseLevel(473328)
        .then((releaseLevel: BigNumber) => {
          expect(releaseLevel).to.equal(3);
        });
      await contract
        .calculateReleaseLevel(631152 - 1)
        .then((releaseLevel: BigNumber) => {
          expect(releaseLevel).to.equal(3);
        });

      await contract
        .calculateReleaseLevel(631152)
        .then((releaseLevel: BigNumber) => {
          expect(releaseLevel).to.equal(4);
        });
      await contract
        .calculateReleaseLevel(788976 - 1)
        .then((releaseLevel: BigNumber) => {
          expect(releaseLevel).to.equal(4);
        });
      await expect(contract.calculateReleaseLevel(788976)).to.be.revertedWith(
        'currentReleaseTimes is error'
      );
    });

    it('vestingTokens', async () => {
      await contract
        .vestingTokens(
          totalAllocated,
          ethers.BigNumber.from(new Date('2024-01-01').getTime() / 1000),
          ethers.BigNumber.from(new Date('2023-01-01').getTime() / 1000)
        )
        .then((vestingTokens: BigNumber) => {
          expect(vestingTokens).to.equal(ethers.utils.parseEther('1031279760'));
        });

      await contract
        .vestingTokens(
          totalAllocated,
          ethers.BigNumber.from(new Date('2025-01-01').getTime() / 1000),
          ethers.BigNumber.from(new Date('2023-01-01').getTime() / 1000)
        )
        .then((vestingTokens: BigNumber) => {
          expect(vestingTokens).to.equal(ethers.utils.parseEther('2065384944'));
        });
    });
  });
});
