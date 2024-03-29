import { expect } from 'chai';
import { randomInt } from 'crypto';
import { Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

describe('Contract TokenSafeBox', function () {
  let contract: Contract;

  beforeEach(async function () {
    const TokenSafeBox = await ethers.getContractFactory('TokenSafeBox');
    contract = await upgrades.deployProxy(TokenSafeBox, []);
    await contract.deployed();
    //grant role
    // const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    // await contract.grantRole(ethers.utils.id('WITHDRAW'), owner.address);
  });

  it('TokenSafeBox Transfer And withdraw Test', async function () {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    contract.grantRole(ethers.utils.id('WITHDRAW'), addr3.address);

    const tx = await addr1.sendTransaction({
      to: contract.address,
      value: ethers.utils.parseEther('1'),
    });
    await tx.wait();

    await ethers.provider.getBalance(contract.address).then((balance) => {
      expect(balance).to.equal(ethers.utils.parseEther('1'));
    });

    await expect(
      contract.withdraw(addr1.address, ethers.utils.parseEther('1'))
    ).to.revertedWith(
      'AccessControl: account 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 is missing role 0x7a8dc26796a1e50e6e190b70259f58f6a4edd5b22280ceecc82b687b8e982869'
    );

    await expect(
      contract
        .connect(addr3)
        .withdraw(addr1.address, ethers.utils.parseEther('1'))
    )
      .emit(contract, 'Withdraw')
      .withArgs(addr1.address, ethers.utils.parseEther('1'));

    await ethers.provider.getBalance(contract.address).then((balance) => {
      expect(balance).to.equal(ethers.utils.parseEther('0'));
    });
  });

  it('TokenSafeBox Transfer And withdraw ERC20 Test', async function () {
    const MacondoUSDT = await ethers.getContractFactory('MacondoUSDT');
    const macondoUSDT = await upgrades.deployProxy(MacondoUSDT);
    await macondoUSDT.deployed();

    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    contract.grantRole(ethers.utils.id('WITHDRAW'), addr3.address);

    await macondoUSDT.mint(addr1.address, ethers.utils.parseEther('100'));

    await macondoUSDT
      .connect(addr1)
      .transfer(contract.address, ethers.utils.parseEther('100'));

    await macondoUSDT.balanceOf(contract.address).then((balance: string) => {
      expect(balance).to.equal(ethers.utils.parseEther('100'));
    });

    await expect(
      contract.withdrawERC20(
        macondoUSDT.address,
        addr1.address,
        ethers.utils.parseEther('100')
      )
    ).to.revertedWith(
      'AccessControl: account 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 is missing role 0x7a8dc26796a1e50e6e190b70259f58f6a4edd5b22280ceecc82b687b8e982869'
    );

    await expect(
      contract
        .connect(addr3)
        .withdrawERC20(
          macondoUSDT.address,
          addr1.address,
          ethers.utils.parseEther('100')
        )
    )
      .to.emit(contract, 'WithdrawERC20')
      .withArgs(
        macondoUSDT.address,
        addr1.address,
        ethers.utils.parseEther('100')
      );

    await macondoUSDT.balanceOf(contract.address).then((balance: string) => {
      expect(balance).to.equal(ethers.utils.parseEther('0'));
    });

    await macondoUSDT.balanceOf(addr1.address).then((balance: string) => {
      expect(balance).to.equal(ethers.utils.parseEther('100'));
    });
  });

  it('TokenSafeBox Transfer And withdraw ERC721 Test', async function () {
    const MacondoNFT = await ethers.getContractFactory('MacondoTableNFT');
    const macondoNFT = await upgrades.deployProxy(MacondoNFT);
    await macondoNFT.deployed();

    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    contract.grantRole(ethers.utils.id('WITHDRAW'), addr3.address);

    const uri =
      'https://ipfs.filebase.io/ipfs/QmeNbXJvrXS8MwSV6zMoQQFey46dM4WqDR5NLnC5Qi24GU';

    const tokenId = randomInt(1000000);
    await macondoNFT.safeMint(addr1.address, tokenId, uri);

    await macondoNFT
      .connect(addr1)
      .transferFrom(addr1.address, contract.address, tokenId);

    await macondoNFT.balanceOf(contract.address).then((balance: string) => {
      expect(balance).to.equal('1');
    });

    await expect(
      contract.withdrawERC721(macondoNFT.address, addr1.address, tokenId)
    ).to.revertedWith(
      'AccessControl: account 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 is missing role 0x7a8dc26796a1e50e6e190b70259f58f6a4edd5b22280ceecc82b687b8e982869'
    );

    await expect(
      contract
        .connect(addr3)
        .withdrawERC721(macondoNFT.address, addr1.address, tokenId)
    )
      .emit(contract, 'WithdrawERC721')
      .withArgs(macondoNFT.address, addr1.address, tokenId);

    await macondoNFT.balanceOf(contract.address).then((balance: string) => {
      expect(balance).to.equal('0');
    });

    await macondoNFT.balanceOf(addr1.address).then((balance: string) => {
      expect(balance).to.equal('1');
    });
  });
});
