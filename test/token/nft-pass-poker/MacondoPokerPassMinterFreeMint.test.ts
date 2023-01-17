import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber, Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

describe('MacondoPokerPassMinterFreeMint', () => {
  let macondoPokerPass: Contract;
  let contract: Contract;

  async function signMessage(
    signer: SignerWithAddress,
    nonce: BigNumber
  ): Promise<string> {
    const messageHash = ethers.utils.solidityKeccak256(
      ['address', 'uint256'],
      [signer.address, nonce.toNumber()]
    );
    const signature = await signer.signMessage(
      ethers.utils.arrayify(messageHash)
    );
    return signature;
  }

  beforeEach(async () => {
    const [owner] = await ethers.getSigners();

    const MacondoPokerPass = await ethers.getContractFactory(
      'MacondoPokerPass'
    );
    macondoPokerPass = await upgrades.deployProxy(MacondoPokerPass);
    await macondoPokerPass.deployed();

    const MacondoPokerPassMinterFreeMint = await ethers.getContractFactory(
      'MacondoPokerPassMinterFreeMint'
    );
    contract = await upgrades.deployProxy(MacondoPokerPassMinterFreeMint, [
      macondoPokerPass.address,
      owner.address,
    ]);
    await contract.deployed();

    //grant role : MINTER_ROLE
    await macondoPokerPass.grantRole(
      await macondoPokerPass.MINTER_ROLE(),
      contract.address
    );
  });

  it('MacondoPokerPassMinterFreeMint:Deploy Test', async () => {
    const address = contract.address;
    expect(ethers.utils.isAddress(address)).to.be.any;

    const defaultConfig = await contract.defaultConfig();
    expect(defaultConfig.period).to.equal('0');
    expect(defaultConfig.price).to.equal('0');
    expect(defaultConfig.startTimestamp).to.equal('0');
    expect(defaultConfig.endTimestamp).to.equal('0');
  });

  describe('MacondoPokerPassMinterFreeMint:freeMint', () => {
    beforeEach(async () => {
      await contract.setSaleConfig(
        '1',
        ethers.utils.parseEther('1'),
        Math.floor(new Date().getTime() / 1000) - 20 * 60,
        Math.floor(new Date().getTime() / 1000) + 20 * 60,
        '50'
      );

      await contract.setInitialTokenId(200000);
    });

    it('success', async () => {
      const [owner, addr1] = await ethers.getSigners();

      const nonce: BigNumber = await contract.getNonce();
      expect(nonce.toNumber()).to.equal(0);

      const signature = await signMessage(owner, nonce);
      console.log('Signature: ', signature, '\n');

      await expect(contract.freeMint(owner.address, signature))
        .to.emit(contract, 'SaleBox')
        .withArgs(owner.address, 200000);

      const nonce1: BigNumber = await contract.getNonce();
      expect(nonce1.toNumber()).to.equal(1);

      expect(await contract.soldCountByAddress(owner.address)).to.equal(1);

      //check nft token
      expect(await macondoPokerPass.ownerOf(200000)).to.equal(owner.address);
      expect(await macondoPokerPass.tokenURI(200000)).to.equal(
        'https://macondo-nft-storage.s3.us-west-1.amazonaws.com/meta/poker-pass-200000'
      );
    });

    it('fail:not in period', async () => {
      const [owner, addr1] = await ethers.getSigners();

      await contract.setSaleConfig(
        '1',
        ethers.utils.parseEther('1'),
        Math.floor(new Date().getTime() / 1000) + 10 * 60,
        Math.floor(new Date().getTime() / 1000) + 20 * 60,
        '50'
      );

      const nonce: BigNumber = await contract.getNonce();
      const signature = await signMessage(owner, nonce);
      await expect(
        contract.freeMint(owner.address, signature)
      ).to.be.revertedWith('sale not start');

      await contract.setSaleConfig(
        '1',
        ethers.utils.parseEther('1'),
        Math.floor(new Date().getTime() / 1000) - 40 * 60,
        Math.floor(new Date().getTime() / 1000) - 20 * 60,
        '50'
      );

      await expect(
        contract.freeMint(owner.address, signature)
      ).to.be.revertedWith('sale end');
    });

    it('fail:reach sale count limit', async () => {
      const [owner, addr1] = await ethers.getSigners();

      await contract.setSaleConfig(
        '1',
        ethers.utils.parseEther('1'),
        Math.floor(new Date().getTime() / 1000) - 20 * 60,
        Math.floor(new Date().getTime() / 1000) + 20 * 60,
        '1'
      );

      const nonce: BigNumber = await contract.getNonce();
      const signature = await signMessage(owner, nonce);

      await contract.freeMint(owner.address, signature);

      const signature1 = await signMessage(owner, await contract.getNonce());

      await expect(
        contract.freeMint(owner.address, signature1)
      ).to.be.revertedWith('sale count limit');
    });
  });
});
