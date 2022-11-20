import { expect } from 'chai';
import { BigNumber, Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

describe('MacondoMCDVestingWallet', () => {
  let contract: Contract;
  const totalAllocated = ethers.utils.parseEther('6000000000');
  const secondsOf15Years = 15 * 365 * 24 * 60 * 60;
  const yearStart = new Date('2023-01-01 00:00:00').getTime() / 1000;
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
      const start = new Date('2023-01-01').getTime() / 1000;
      await contract
        .vestAmountTokenCurrentReleaseTimes(
          ethers.BigNumber.from(new Date('2024-01-01').getTime() / 1000),
          start
        )
        .then((vestingTokens: BigNumber) => {
          expect(vestingTokens).to.equal(52560 + 1);
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
        .calculateReleaseLevel(157824)
        .then((releaseLevel: BigNumber) => {
          expect(releaseLevel).to.equal(0);
        });
      await contract
        .calculateReleaseLevel(157824 + 1)
        .then((releaseLevel: BigNumber) => {
          expect(releaseLevel).to.equal(1);
        });
      await contract
        .calculateReleaseLevel(315648)
        .then((releaseLevel: BigNumber) => {
          expect(releaseLevel).to.equal(1);
        });

      await contract
        .calculateReleaseLevel(315648 + 1)
        .then((releaseLevel: BigNumber) => {
          expect(releaseLevel).to.equal(2);
        });
      await contract
        .calculateReleaseLevel(473328)
        .then((releaseLevel: BigNumber) => {
          expect(releaseLevel).to.equal(2);
        });

      await contract
        .calculateReleaseLevel(473328 + 1)
        .then((releaseLevel: BigNumber) => {
          expect(releaseLevel).to.equal(3);
        });
      await contract
        .calculateReleaseLevel(631152)
        .then((releaseLevel: BigNumber) => {
          expect(releaseLevel).to.equal(3);
        });

      await contract
        .calculateReleaseLevel(631152 + 1)
        .then((releaseLevel: BigNumber) => {
          expect(releaseLevel).to.equal(4);
        });
      await contract
        .calculateReleaseLevel(788976)
        .then((releaseLevel: BigNumber) => {
          expect(releaseLevel).to.equal(4);
        });
      await expect(
        contract.calculateReleaseLevel(788976 + 1)
      ).to.be.revertedWith('currentReleaseTimes is error');
    });

    it('calculateCurrentLevelReleaseTimes', async () => {
      await contract
        .calculateCurrentLevelReleaseTimes(1)
        .then((currentLevelReleaseTimes: BigNumber) => {
          expect(currentLevelReleaseTimes).to.equal(1);
        });
      await contract
        .calculateCurrentLevelReleaseTimes(315648 + 7890)
        .then((currentLevelReleaseTimes: BigNumber) => {
          expect(currentLevelReleaseTimes).to.equal(7890);
        });
    });

    it('vestingTokens by years', async () => {
      const start = new Date('2023-01-01').getTime() / 1000;

      const yearsVestings: Map<number, string> = new Map();
      yearsVestings.set(2023, '1031279760');
      yearsVestings.set(2024, '2065384944');
      yearsVestings.set(2025, '3096664704');
      yearsVestings.set(2026, '3612278304');
      yearsVestings.set(2027, '4127891904');
      yearsVestings.set(2028, '4644918144');
      yearsVestings.set(2029, '4902935184');
      yearsVestings.set(2030, '5160952224');
      yearsVestings.set(2031, '5418969264');
      yearsVestings.set(2032, '5548199472');
      yearsVestings.set(2033, '5677076592');
      yearsVestings.set(2034, '5805953712');
      yearsVestings.set(2035, '5870392272');
      yearsVestings.set(2036, '5935007376');
      yearsVestings.set(2037, '5999445936');

      for (const [year, vesting] of yearsVestings) {
        await contract
          .vestingTokens(
            totalAllocated,
            ethers.BigNumber.from(
              new Date(`${year + 1}-01-01`).getTime() / 1000
            ),
            start
          )
          .then((vestingTokens: BigNumber) => {
            expect(vestingTokens).to.equal(ethers.utils.parseEther(vesting));
          });
      }
    });

    it('vestingTokens by years special', async () => {
      const yearsVestings: Map<
        number,
        {
          releaseTimes: string;
          vestingTokens: string;
          releaseLevel: number;
          releaseAmountPerTime: string;
        }
      > = new Map();
      // yearsVestings.set(2023, {
      //   releaseTimes: '52560',
      //   vestingTokens: '1031279760',
      //   releaseLevel: 0,
      //   releaseAmountPerTime: '19621',
      // });

      yearsVestings.set(2028, {
        releaseTimes: '315648',
        vestingTokens: '4644918144',
        releaseLevel: 1,
        releaseAmountPerTime: '9810',
      });

      for (const [year, vesting] of yearsVestings) {
        const yearEnd = new Date(`${year}-12-31 23:59:59`).getTime() / 1000;
        // check releaseTimes
        await contract
          .vestAmountTokenCurrentReleaseTimes(yearEnd, yearStart)
          .then((vestingTokens: BigNumber) => {
            expect(vestingTokens).to.equal(vesting.releaseTimes);
          });

        // check releaseLevel
        await contract
          .calculateReleaseLevel(vesting.releaseTimes)
          .then((releaseLevel: BigNumber) => {
            expect(releaseLevel).to.equal(vesting.releaseLevel);
          });
        // check releaseAmountPerTime
        await contract
          .vestedAmountCurrentReleaseAmountPerTime(
            totalAllocated,
            vesting.releaseLevel
          )
          .then((vestingTokens: BigNumber) => {
            expect(vestingTokens).to.equal(
              ethers.utils.parseEther(vesting.releaseAmountPerTime)
            );
          });

        // check vestingTokens
        await contract
          .vestingTokens(totalAllocated, yearEnd, yearStart)
          .then((vestingTokens: BigNumber) => {
            expect(vestingTokens).to.equal(
              ethers.utils.parseEther(vesting.vestingTokens)
            );
          });
      }
    });
  });
});
