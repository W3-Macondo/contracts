import { expect } from 'chai';
import { BigNumber, BigNumberish, Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

function randomWithSeed(
  seed: BigNumberish,
  index: BigNumberish,
  maxNumber?: BigNumberish
): BigNumber {
  const random = BigNumber.from(
    ethers.utils.solidityKeccak256(['uint256', 'uint256'], [seed, index])
  );
  if (maxNumber) {
    return random.mod(maxNumber);
  }
  return random;
}

/**
 * get random card
 * @param randomSeed  random seed
 * @param totalCards  total cards
 * @returns  {number[]}
 */
function getRandomCards(
  randomSeed: BigNumberish,
  totalCards: number
): number[] {
  const cards = [];
  for (let i = 0; i < totalCards; i++) {
    cards.push(i);
  }
  for (let i = 0; i < totalCards; i++) {
    const j = i + randomWithSeed(randomSeed, i, totalCards - i).toNumber();
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

describe('PokerValidator', () => {
  let contract: Contract;

  beforeEach(async () => {
    const PokerValidator = await ethers.getContractFactory('PokerValidator');
    contract = await upgrades.deployProxy(PokerValidator);
    await contract.deployed();
  });

  it('should getRandomCards', async () => {
    const randomSeed =
      '0x814cc265bde15991d28d4212ac5dabe95c5ed2c7c8ff5c8d7c89217eccabd429';
    const totalCards = 52;
    const result: BigNumber[] = await contract.getRandomCards(
      randomSeed,
      totalCards
    );
    expect(result.length).to.equal(totalCards);
    //check unique
    const set = new Set(result);
    expect(set.size).to.equal(totalCards);

    //check max number is totalCards - 1
    const maxNumber = result.reduce((a, b) => (a.gt(b) ? a : b));
    expect(maxNumber).to.equal(totalCards - 1);

    //check min number is 0
    const minNumber = result.reduce((a, b) => (a.lt(b) ? a : b));
    expect(minNumber).to.equal(0);

    //convert result to int array
    const resultInt = result.map((item) => item.toNumber());
    console.log(resultInt);
    expect(resultInt).to.eql([
      46, 2, 24, 10, 11, 31, 47, 5, 28, 0, 50, 14, 33, 35, 49, 18, 36, 45, 39,
      34, 37, 26, 43, 21, 20, 29, 9, 48, 42, 44, 3, 15, 1, 25, 8, 38, 7, 23, 13,
      12, 41, 40, 32, 19, 30, 16, 4, 22, 27, 6, 51, 17,
    ]);
  });

  it('should getRandomCards equal with Typescript function', async () => {
    const randomSeed =
      '0x814cc265bde15991d28d4212ac5dabe95c5ed2c7c8ff5c8d7c89217eccabd429';
    const totalCards = 52;
    const result: BigNumber[] = await contract.getRandomCards(
      randomSeed,
      totalCards
    );
    const resultInt = result.map((item) => item.toNumber());
    const resultInt2 = getRandomCards(randomSeed, totalCards);
    expect(resultInt).to.eql(resultInt2);
  });

  it('should getRandomCards  equal with Typescript Function', async () => {
    // const randomSeeds: string[] = [
    //   '107521282452083442942778140544899208234391751404817728678141304530336436322094',
    //   '97878143876935261352391833099684199474762365881877747487805502822929548130005',
    //   '1504509274107804546277377143806668580935839962572753255425973134488174136353',
    //   '2462945751385833770614902212125149530037428929362696843451465268768348256823',
    //   '6554783939756707108942310882172489785491519690845549519559229584357403854277',
    //   '50247740545331234847807503122653642251389570635599461068852626949111619119304',
    //   '114512933922435482068185014210129988796383059753042967951198314233375325675277',
    //   '37849856365572051777116232472957641950827619971420014038652888675586501510865',
    //   '8542771138391846997228655208707376812718834447783696647746797651410096244809',
    //   '63166099702757767886170554724988602847113890997123801763052614328077542648896',
    // ];

    const randomVerifyCards: Map<string, number[]> = new Map();
    randomVerifyCards.set(
      '107521282452083442942778140544899208234391751404817728678141304530336436322094',
      [
        0, 43, 10, 49, 35, 25, 7, 51, 20, 22, 21, 50, 18, 4, 38, 24, 3, 39, 17,
        28, 1, 44, 5, 11, 9, 42, 32, 37, 45, 36, 40, 30, 14, 19, 8, 15, 33, 23,
        6, 47, 48, 29, 26, 12, 16, 13, 31, 2, 34, 27, 46, 41,
      ]
    );
    randomVerifyCards.set(
      '97878143876935261352391833099684199474762365881877747487805502822929548130005',
      [
        3, 45, 14, 35, 34, 1, 5, 41, 16, 19, 11, 31, 48, 18, 44, 38, 32, 0, 8,
        6, 4, 40, 17, 2, 47, 36, 51, 25, 26, 49, 15, 20, 46, 10, 13, 23, 50, 22,
        12, 42, 24, 43, 21, 30, 28, 7, 29, 39, 9, 27, 33, 37,
      ]
    );
    randomVerifyCards.set(
      '1504509274107804546277377143806668580935839962572753255425973134488174136353',
      [
        36, 32, 7, 41, 1, 4, 51, 28, 10, 38, 12, 30, 16, 43, 26, 3, 49, 39, 6,
        27, 23, 45, 9, 35, 37, 19, 18, 25, 21, 11, 29, 24, 48, 34, 22, 15, 33,
        13, 50, 31, 0, 46, 14, 17, 2, 8, 44, 42, 5, 47, 20, 40,
      ]
    );
    const totalCards = 52;
    for (const [randomSeed, verifyCards] of randomVerifyCards) {
      const result: number[] = getRandomCards(randomSeed, totalCards);
      expect(result).to.eql(verifyCards);
    }
  });
});
