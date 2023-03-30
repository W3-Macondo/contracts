import { expect } from 'chai';
import { randomInt } from 'crypto';
import { BigNumber, Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

function getMessageHash(to: string, value: string, nonce: BigNumber) {
  const messageHash = ethers.utils.solidityKeccak256(
    ['address', 'uint256', 'uint256'],
    [to, value, nonce]
  );

  return ethers.utils.arrayify(messageHash);
}

const ERC721_URI =
  'https://ipfs.filebase.io/ipfs/QmeNbXJvrXS8MwSV6zMoQQFey46dM4WqDR5NLnC5Qi24GU';

describe('Contract TokenCollection', function () {
  let contract: Contract;

  beforeEach(async function () {
    const TokenCollection = await ethers.getContractFactory('TokenCollection');
    contract = await upgrades.deployProxy(TokenCollection, []);
    await contract.deployed();
  });

  it('TokenCollection Transfer And withdraw Test', async function () {
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

  it('TokenCollection Transfer And withdraw ERC20 Test', async function () {
    const MacondoUSDT = await ethers.getContractFactory('MacondoUSDT');
    const macondoUSDT = await upgrades.deployProxy(MacondoUSDT);
    await macondoUSDT.deployed();

    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    contract.grantRole(ethers.utils.id('WITHDRAW_ERC20'), addr3.address);

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
      'AccessControl: account 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 is missing role 0xa330ce73e09a78b66adf5d63034fbc76118eb63ebf42f8a90adff6eede66bd61'
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
      .to.emit(contract, 'ERC20Withdraw')
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

  it('TokenCollection Transfer And withdraw ERC721 Test', async function () {
    const MacondoNFT = await ethers.getContractFactory('MacondoTableNFT');
    const macondoNFT = await upgrades.deployProxy(MacondoNFT);
    await macondoNFT.deployed();

    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    contract.grantRole(ethers.utils.id('WITHDRAW_ERC721'), addr3.address);

    const tokenId = randomInt(1000000);
    await macondoNFT.safeMint(addr1.address, tokenId, ERC721_URI);

    await macondoNFT
      .connect(addr1)
      .transferFrom(addr1.address, contract.address, tokenId);

    await macondoNFT.balanceOf(contract.address).then((balance: string) => {
      expect(balance).to.equal('1');
    });

    await expect(
      contract.withdrawERC721(macondoNFT.address, addr1.address, tokenId)
    ).to.revertedWith(
      'AccessControl: account 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 is missing role 0xb5aa82721752f7d9fd086b2cd0b25a64b0fb9143afee5faf5191cb2903462466'
    );

    await expect(
      contract
        .connect(addr3)
        .withdrawERC721(macondoNFT.address, addr1.address, tokenId)
    )
      .emit(contract, 'ERC721Withdraw')
      .withArgs(macondoNFT.address, addr1.address, tokenId);

    await macondoNFT.balanceOf(contract.address).then((balance: string) => {
      expect(balance).to.equal('0');
    });

    await macondoNFT.balanceOf(addr1.address).then((balance: string) => {
      expect(balance).to.equal('1');
    });
  });

  it('TokenCollection withdrawERC20WithMint Test', async function () {
    const MacondoBFB = await ethers.getContractFactory('MacondoBFB');
    const macondoBFB = await upgrades.deployProxy(MacondoBFB);
    await macondoBFB.deployed();

    //grant minter role
    await macondoBFB.grantRole(
      ethers.utils.id('MINTER_ROLE'),
      contract.address
    );

    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    await contract.grantRole(ethers.utils.id('WITHDRAW_ERC20'), addr3.address);

    await expect(
      contract
        .connect(addr3)
        .withdrawERC20WithMint(
          macondoBFB.address,
          addr1.address,
          ethers.utils.parseEther('100')
        )
    )
      .to.emit(contract, 'ERC20Withdraw')
      .withArgs(
        macondoBFB.address,
        addr1.address,
        ethers.utils.parseEther('100')
      );

    await macondoBFB.balanceOf(contract.address).then((balance: string) => {
      expect(balance).to.equal(ethers.utils.parseEther('0'));
    });

    await macondoBFB.balanceOf(addr1.address).then((balance: string) => {
      expect(balance).to.equal(ethers.utils.parseEther('100'));
    });

    //mint 50 ether to contract
    await macondoBFB.mint(contract.address, ethers.utils.parseEther('50'));

    //expect macondoUSDT total supply is 150
    await macondoBFB.totalSupply().then((totalSupply: string) => {
      expect(totalSupply).to.equal(ethers.utils.parseEther('150'));
    });

    await expect(
      contract
        .connect(addr3)
        .withdrawERC20WithMint(
          macondoBFB.address,
          addr1.address,
          ethers.utils.parseEther('100')
        )
    )
      .to.emit(contract, 'ERC20Withdraw')
      .withArgs(
        macondoBFB.address,
        addr1.address,
        ethers.utils.parseEther('100')
      );

    await macondoBFB.balanceOf(contract.address).then((balance: string) => {
      expect(balance).to.equal(ethers.utils.parseEther('0'));
    });

    await macondoBFB.balanceOf(addr1.address).then((balance: string) => {
      expect(balance).to.equal(ethers.utils.parseEther('200'));
    });
  });
});

describe('Contract TokenCollection Withdraw using Signature', function () {
  let contract: Contract;

  beforeEach(async function () {
    const TokenCollection = await ethers.getContractFactory('TokenCollection');
    contract = await upgrades.deployProxy(TokenCollection, []);
    await contract.deployed();
  });

  it('TokenCollection withdrawERC20WithMintWithSignature Test', async function () {
    const MacondoBFB = await ethers.getContractFactory('MacondoBFB');
    const macondoBFB = await upgrades.deployProxy(MacondoBFB);
    await macondoBFB.deployed();

    //grant minter role
    await macondoBFB.grantRole(
      ethers.utils.id('MINTER_ROLE'),
      contract.address
    );

    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    await contract.grantRole(ethers.utils.id('WITHDRAW_ERC20'), addr3.address);

    const nonce: BigNumber = await contract.connect(addr1).getNonce();
    expect(nonce.toString()).to.equal('0');

    const amount = ethers.utils.parseEther('100');

    const hash = getMessageHash(addr1.address, amount.toString(), nonce);
    const signature = await addr3.signMessage(hash);
    const recovery = await contract.recoverSigner(hash, signature);
    expect(recovery).to.equal(addr3.address);

    await expect(
      contract
        .connect(addr1)
        .withdrawERC20WithMintWithSignature(
          macondoBFB.address,
          amount,
          signature
        )
    )
      .to.emit(contract, 'ERC20Withdraw')
      .withArgs(macondoBFB.address, addr1.address, amount);

    await macondoBFB.balanceOf(contract.address).then((balance: string) => {
      expect(balance).to.equal(ethers.utils.parseEther('0'));
    });

    await macondoBFB.balanceOf(addr1.address).then((balance: string) => {
      expect(balance).to.equal(amount);
    });

    //mint 50 ether to contract
    await macondoBFB.mint(contract.address, ethers.utils.parseEther('50'));

    //expect macondoUSDT total supply is 150
    await macondoBFB.totalSupply().then((totalSupply: string) => {
      expect(totalSupply).to.equal(ethers.utils.parseEther('150'));
    });

    const secondNonce: BigNumber = await contract.connect(addr1).getNonce();
    expect(secondNonce.toString()).to.equal('1');
    const secondAmount = ethers.utils.parseEther('100');

    const secondHash = getMessageHash(
      addr1.address,
      secondAmount.toString(),
      secondNonce
    );
    const secondSignature = await addr3.signMessage(secondHash);
    const secondRecovery = await contract.recoverSigner(
      secondHash,
      secondSignature
    );
    expect(secondRecovery).to.equal(addr3.address);
    await expect(
      contract
        .connect(addr1)
        .withdrawERC20WithMintWithSignature(
          macondoBFB.address,
          amount,
          secondSignature
        )
    )
      .to.emit(contract, 'ERC20Withdraw')
      .withArgs(macondoBFB.address, addr1.address, secondAmount);

    await macondoBFB.balanceOf(contract.address).then((balance: string) => {
      expect(balance).to.equal(ethers.utils.parseEther('0'));
    });

    await macondoBFB.balanceOf(addr1.address).then((balance: string) => {
      expect(balance).to.equal(amount.add(secondAmount));
    });
  });

  it('TokenCollection Transfer And withdrawWithSignature Test', async function () {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const role = ethers.utils.id('WITHDRAW');
    contract.grantRole(role, addr3.address);

    const amount = ethers.utils.parseEther('1');

    const tx = await addr1.sendTransaction({
      to: contract.address,
      value: amount,
    });
    await tx.wait();

    await ethers.provider.getBalance(contract.address).then((balance) => {
      expect(balance).to.equal(amount);
    });

    await expect(contract.withdraw(addr1.address, amount)).to.revertedWith(
      'AccessControl: account 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 is missing role 0x7a8dc26796a1e50e6e190b70259f58f6a4edd5b22280ceecc82b687b8e982869'
    );

    let nonce: BigNumber = await contract.connect(addr1).getNonce();
    expect(nonce.toString()).to.equal('0');
    let hash = getMessageHash(addr1.address, amount.toString(), nonce);
    let signature = await addr3.signMessage(hash);
    let recovery = await contract.recoverSigner(hash, signature);
    expect(recovery).to.equal(addr3.address);

    await expect(
      contract.connect(addr1).withdrawWithSignature(amount, signature)
    )
      .emit(contract, 'Withdraw')
      .withArgs(addr1.address, amount);

    const balanceNone = ethers.utils.parseEther('0');
    await ethers.provider.getBalance(contract.address).then((balance) => {
      expect(balance).to.equal(balanceNone);
    });

    nonce = await contract.connect(addr1).getNonce();
    expect(nonce.toString()).to.equal('1');
    hash = getMessageHash(addr1.address, amount.toString(), nonce);
    signature = await addr3.signMessage(hash);
    recovery = await contract.recoverSigner(hash, signature);
    expect(recovery).to.equal(addr3.address);

    await expect(
      contract.connect(addr1).withdrawWithSignature(amount, signature)
    ).to.revertedWith('Address: insufficient balance');
  });

  it('TokenCollection Transfer And withdraw ERC20 using signature Test', async function () {
    const MacondoUSDT = await ethers.getContractFactory('MacondoUSDT');
    const macondoUSDT = await upgrades.deployProxy(MacondoUSDT);
    await macondoUSDT.deployed();

    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const role = ethers.utils.id('WITHDRAW_ERC20');
    contract.grantRole(role, addr3.address);

    const amount = ethers.utils.parseEther('100');
    await macondoUSDT.mint(addr1.address, amount);

    // transfer 100 macondoUSDT to contract
    await macondoUSDT.connect(addr1).transfer(contract.address, amount);

    await macondoUSDT.balanceOf(contract.address).then((balance: string) => {
      expect(balance).to.equal(amount);
    });

    let nonce: BigNumber = await contract.connect(addr1).getNonce();
    expect(nonce.toString()).to.equal('0');
    let hash = getMessageHash(addr1.address, amount.toString(), nonce);
    let signature = await addr3.signMessage(hash);
    let recovery = await contract.recoverSigner(hash, signature);
    expect(recovery).to.equal(addr3.address);

    await expect(
      contract
        .connect(addr1)
        .withdrawERC20WithSignature(macondoUSDT.address, amount, signature)
    )
      .to.emit(contract, 'ERC20Withdraw')
      .withArgs(macondoUSDT.address, addr1.address, amount);

    const balanceEmpty = ethers.utils.parseEther('0');
    await macondoUSDT.balanceOf(contract.address).then((balance: string) => {
      expect(balance).to.equal(balanceEmpty);
    });

    await macondoUSDT.balanceOf(addr1.address).then((balance: string) => {
      expect(balance).to.equal(amount);
    });

    nonce = await contract.connect(addr1).getNonce();
    expect(nonce.toString()).to.equal('1');
    hash = getMessageHash(addr1.address, amount.toString(), nonce);
    signature = await addr3.signMessage(hash);
    recovery = await contract.recoverSigner(hash, signature);
    expect(recovery).to.equal(addr3.address);

    await expect(
      contract
        .connect(addr1)
        .withdrawERC20WithSignature(macondoUSDT.address, amount, signature)
    ).to.revertedWith('ERC20: transfer amount exceeds balance');
  });

  it('TokenCollection Transfer And withdraw ERC721 using signature Test', async function () {
    const MacondoNFT = await ethers.getContractFactory('MacondoTableNFT');
    const macondoNFT = await upgrades.deployProxy(MacondoNFT);
    await macondoNFT.deployed();

    const role = ethers.utils.id('WITHDRAW_ERC721');
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    contract.grantRole(role, addr3.address);

    // mint nft
    const tokenId = randomInt(1000000);
    await macondoNFT.safeMint(addr1.address, tokenId, ERC721_URI);

    // transfer nft to contract
    await macondoNFT
      .connect(addr1)
      .transferFrom(addr1.address, contract.address, tokenId);

    await macondoNFT.balanceOf(contract.address).then((balance: string) => {
      expect(balance).to.equal('1');
    });

    await macondoNFT.balanceOf(addr1.address).then((balance: string) => {
      expect(balance).to.equal('0');
    });

    let nonce: BigNumber = await contract.connect(addr1).getNonce();
    expect(nonce.toString()).to.equal('0');
    let hash = getMessageHash(addr1.address, tokenId.toString(), nonce);
    let signature = await addr3.signMessage(hash);
    let recovery = await contract.recoverSigner(hash, signature);
    expect(recovery).to.equal(addr3.address);

    await expect(
      contract
        .connect(addr1)
        .withdrawERC721WithSignature(macondoNFT.address, tokenId, signature)
    )
      .emit(contract, 'ERC721Withdraw')
      .withArgs(macondoNFT.address, addr1.address, tokenId);

    await macondoNFT.balanceOf(contract.address).then((balance: string) => {
      expect(balance).to.equal('0');
    });

    await macondoNFT.balanceOf(addr1.address).then((balance: string) => {
      expect(balance).to.equal('1');
    });

    nonce = await contract.connect(addr1).getNonce();
    expect(nonce.toString()).to.equal('1');
    hash = getMessageHash(addr1.address, tokenId.toString(), nonce);
    signature = await addr3.signMessage(hash);
    recovery = await contract.recoverSigner(hash, signature);
    expect(recovery).to.equal(addr3.address);

    await expect(
      contract
        .connect(addr1)
        .withdrawERC721WithSignature(macondoNFT.address, tokenId, signature)
    ).to.revertedWith('ERC721: caller is not token owner or approved');
  });
});
