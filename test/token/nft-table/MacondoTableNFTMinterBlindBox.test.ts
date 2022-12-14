import { TransactionResponse } from '@ethersproject/abstract-provider';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

describe('MacondoTableNFTMinterBlindBox', () => {
  let macondoTableNFT: Contract;
  let contract: Contract;

  beforeEach(async () => {
    const [owner] = await ethers.getSigners();

    const MacondoTableNFT = await ethers.getContractFactory('MacondoTableNFT');
    macondoTableNFT = await upgrades.deployProxy(MacondoTableNFT);
    await macondoTableNFT.deployed();

    const MacondoTableNFTMinterBlindBox = await ethers.getContractFactory(
      'MacondoTableNFTMinterBlindBox'
    );
    contract = await upgrades.deployProxy(MacondoTableNFTMinterBlindBox, [
      macondoTableNFT.address,
      owner.address,
    ]);
    await contract.deployed();

    //grant role : MINTER_ROLE
    await macondoTableNFT.grantRole(
      await macondoTableNFT.MINTER_ROLE(),
      contract.address
    );
  });

  it('MacondoTableNFTMinterBlindBox:Deploy Test', async () => {
    const address = contract.address;
    expect(ethers.utils.isAddress(address)).to.be.any;

    const defaultConfig = await contract.defaultConfig();
    expect(defaultConfig.period).to.equal('0');
    expect(defaultConfig.price).to.equal('0');
    expect(defaultConfig.startTimestamp).to.equal('0');
    expect(defaultConfig.endTimestamp).to.equal('0');
  });

  describe.skip('MacondoTableNFTMinterBlindBox:buyWithSaleRoleSign', () => {
    beforeEach(async () => {
      await contract.setSaleConfig(
        '1',
        ethers.utils.parseEther('1'),
        Math.floor(new Date().getTime() / 1000) - 20 * 60,
        Math.floor(new Date().getTime() / 1000) + 20 * 60,
        '50'
      );
    });
    const tokenId = 1;
    const tokenURI = 'www.macondo.io';
    const price = ethers.utils.parseEther('1');
    it('success', async () => {
      const [owner, addr1] = await ethers.getSigners();

      const message = ethers.utils.solidityKeccak256(
        ['address', 'uint256', 'uint256'],
        [addr1.address, tokenId, price]
      );
      const signature = await owner.signMessage(ethers.utils.arrayify(message));

      //check balance before buy
      const ownerBalance = await ethers.provider.getBalance(owner.address);
      const addr1Balance = await ethers.provider.getBalance(addr1.address);

      const tx: TransactionResponse = await contract
        .connect(addr1)
        .buyWithSaleRoleSign(tokenId, tokenURI, price, signature, {
          value: price.mul(2),
        });
      const receipt = await tx.wait();

      //check contract balance
      const contractBalance = await ethers.provider.getBalance(
        contract.address
      );
      expect(contractBalance.toString()).to.equal(price.toString());

      //check balance after buy
      const addr1BalanceAfter = await ethers.provider.getBalance(addr1.address);

      //gas fee
      const gasFee = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);
      expect(addr1Balance.sub(addr1BalanceAfter).sub(gasFee)).to.equal(price);

      //withdraw
      const tx2: TransactionResponse = await contract.connect(owner).withdraw();
      const receipt2 = await tx2.wait();

      //gas fee
      const gasFee2 = receipt2.cumulativeGasUsed.mul(
        receipt2.effectiveGasPrice
      );

      //check balance after withdraw
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerBalanceAfter.sub(ownerBalance).add(gasFee2)).to.equal(price);
    });

    it('fail:wrong signature', async () => {
      const [owner, addr1, addr2] = await ethers.getSigners();

      const message = ethers.utils.solidityKeccak256(
        ['address', 'uint256', 'uint256'],
        [addr1.address, tokenId, price]
      );
      const signatureWithAddr1 = await addr1.signMessage(
        ethers.utils.arrayify(message)
      );

      await expect(
        contract
          .connect(addr1)
          .buyWithSaleRoleSign(tokenId, tokenURI, price, signatureWithAddr1, {
            value: price.mul(2),
          })
      ).to.be.revertedWith(
        'ErrorSaleRoleSignature("0x70997970C51812dc3A010C7d01b50e0d17dc79C8")'
      );
    });

    it('fail:cannot sale to sale role', async () => {
      const [owner, addr1, sale] = await ethers.getSigners();

      const message = ethers.utils.solidityKeccak256(
        ['address', 'uint256', 'uint256'],
        [sale.address, tokenId, price]
      );
      const hashMessage = ethers.utils.arrayify(message);
      const signature = await sale.signMessage(hashMessage);

      //grant role : SALE_ROLE
      await contract.grantRole(await contract.SALE_ROLE(), sale.address);
      //check role
      expect(await contract.hasRole(await contract.SALE_ROLE(), sale.address))
        .to.be.true;

      await expect(
        contract
          .connect(sale)
          .buyWithSaleRoleSign(tokenId, tokenURI, price, signature, {
            value: price.mul(2),
          })
      ).to.be.revertedWith('ErrorSaleRoleCannotSaleToSelf()');
    });

    it('fail:wrong price', async () => {
      const [owner, addr1] = await ethers.getSigners();

      const message = ethers.utils.solidityKeccak256(
        ['address', 'uint256', 'uint256'],
        [addr1.address, tokenId, price]
      );
      const signature = await owner.signMessage(ethers.utils.arrayify(message));

      await expect(
        contract
          .connect(addr1)
          .buyWithSaleRoleSign(tokenId, tokenURI, price, signature, {
            value: price.sub(1),
          })
      ).to.be.revertedWith('not enough money');
    });

    it('fail:wrong is pause', async () => {
      const [owner, addr1] = await ethers.getSigners();

      const message = ethers.utils.solidityKeccak256(
        ['address', 'uint256', 'uint256'],
        [addr1.address, tokenId, price]
      );
      const signature = await owner.signMessage(ethers.utils.arrayify(message));

      await contract.pause();

      await expect(
        contract
          .connect(addr1)
          .buyWithSaleRoleSign(tokenId, tokenURI, price, signature, {
            value: price.mul(2),
          })
      ).to.be.revertedWith('Pausable: paused');
    });
  });

  describe('MacondoTableNFTMinterBlindBox:sale', () => {
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

      await expect(contract.sale({ value: ethers.utils.parseEther('1') }))
        .to.emit(contract, 'SaleBox')
        .withArgs(owner.address, 200000);
      //check nft token
      expect(await macondoTableNFT.ownerOf(200000)).to.equal(owner.address);
      expect(await macondoTableNFT.tokenURI(200000)).to.equal(
        'https://macondo-nft-storage.s3.us-west-1.amazonaws.com/meta/desk-200000'
      );

      await expect(contract.sale({ value: ethers.utils.parseEther('1') }))
        .to.emit(contract, 'SaleBox')
        .withArgs(owner.address, 200001);

      //check nft token
      expect(await macondoTableNFT.ownerOf(200001)).to.equal(owner.address);
      expect(await macondoTableNFT.tokenURI(200001)).to.equal(
        'https://macondo-nft-storage.s3.us-west-1.amazonaws.com/meta/desk-200001'
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

      await expect(
        contract.sale({ value: ethers.utils.parseEther('1') })
      ).to.be.revertedWith('sale not start');

      await contract.setSaleConfig(
        '1',
        ethers.utils.parseEther('1'),
        Math.floor(new Date().getTime() / 1000) - 40 * 60,
        Math.floor(new Date().getTime() / 1000) - 20 * 60,
        '50'
      );

      await expect(
        contract.sale({ value: ethers.utils.parseEther('1') })
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

      await contract.sale({ value: ethers.utils.parseEther('1') });

      await expect(
        contract.sale({ value: ethers.utils.parseEther('1') })
      ).to.be.revertedWith('sale count limit');
    });

    it('success withdraw', async () => {
      const [owner, addr1] = await ethers.getSigners();

      expect((await contract.currentTokenId()).toNumber()).to.equal(200000);
      await contract.sale({ value: ethers.utils.parseEther('1') });
      expect((await contract.currentTokenId()).toNumber()).to.equal(200001);
      await contract.sale({ value: ethers.utils.parseEther('1') });
      expect((await contract.currentTokenId()).toNumber()).to.equal(200002);
      await contract.sale({ value: ethers.utils.parseEther('1') });
      expect((await contract.currentTokenId()).toNumber()).to.equal(200003);

      const contractBalance = await ethers.provider.getBalance(
        contract.address
      );
      expect(contractBalance).to.equal(ethers.utils.parseEther('3'));

      await contract.withdraw();

      const contractBalanceAfter = await ethers.provider.getBalance(
        contract.address
      );
      expect(contractBalanceAfter).to.equal(0);
    });

    it('fail:wrong price', async () => {
      const [owner, addr1] = await ethers.getSigners();

      await contract.setSaleConfig(
        '1',
        ethers.utils.parseEther('2'),
        Math.floor(new Date().getTime() / 1000) - 20 * 60,
        Math.floor(new Date().getTime() / 1000) + 20 * 60,
        '50'
      );

      await expect(
        contract.sale({ value: ethers.utils.parseEther('1') })
      ).to.be.revertedWith('msg.value must be equal to price,');
    });
  });

  describe('MacondoTableNFTMinterBlindBox:set Property', () => {
    it('success:setSaleConfig', async () => {
      const startTimestamp = Math.floor(new Date().getTime() / 1000) - 20 * 60;
      const endTimestamp = Math.floor(new Date().getTime() / 1000) + 20 * 60;
      await contract.setSaleConfig(
        '1',
        ethers.utils.parseEther('2'),
        startTimestamp,
        endTimestamp,
        '50'
      );

      expect(await contract.soldCount()).to.equal(0);
      const saleConfig = await contract.defaultConfig();
      expect(saleConfig.period).to.equal(1);
      expect(saleConfig.price).to.equal(ethers.utils.parseEther('2'));
      expect(saleConfig.startTimestamp).to.equal(startTimestamp);
      expect(saleConfig.endTimestamp).to.equal(endTimestamp);
      expect(await contract.totalSupply()).to.equal(50);
    });

    it('success:setInitialTokenId', async () => {
      await contract.setInitialTokenId(200000);
      expect(await contract.currentTokenId()).to.equal(200000);
      //sale
      await contract.setSaleConfig(
        '1',
        ethers.utils.parseEther('1'),
        Math.floor(new Date().getTime() / 1000) - 20 * 60,
        Math.floor(new Date().getTime() / 1000) + 20 * 60,
        '50'
      );

      await contract.sale({ value: ethers.utils.parseEther('1') });
      expect(await contract.currentTokenId()).to.equal(200001);

      await expect(contract.setInitialTokenId(200000)).revertedWith(
        'initial token id is in sold list'
      );
      await contract.setInitialTokenId(200001);
      expect(await contract.currentTokenId()).to.equal(200001);
    });

    it('success:setSaleConfigPrice', async () => {
      await contract.setSaleConfigPrice(ethers.utils.parseEther('2'));
      const saleConfig = await contract.defaultConfig();
      expect(saleConfig.price).to.equal(ethers.utils.parseEther('2'));
    });

    it('success:setSaleConfigPeriod', async () => {
      const startTimestamp = Math.floor(new Date().getTime() / 1000) - 20 * 60;
      const endTimestamp = Math.floor(new Date().getTime() / 1000) + 20 * 60;
      await contract.setSaleConfigPeriod(1, startTimestamp, endTimestamp);
      const saleConfig = await contract.defaultConfig();
      expect(saleConfig.period).to.equal(1);
      expect(saleConfig.startTimestamp).to.equal(startTimestamp);
      expect(saleConfig.endTimestamp).to.equal(endTimestamp);
    });

    it('success:setTotalSupply', async () => {
      await contract.setTotalSupply(100);
      expect(await contract.totalSupply()).to.equal(100);
    });

    it('success:addTotalSupply', async () => {
      await contract.setTotalSupply(100);
      expect(await contract.totalSupply()).to.equal(100);
      await contract.addTotalSupply(100);
      expect(await contract.totalSupply()).to.equal(200);
      await contract.addTotalSupply(100);
      expect(await contract.totalSupply()).to.equal(300);
    });
  });
});
