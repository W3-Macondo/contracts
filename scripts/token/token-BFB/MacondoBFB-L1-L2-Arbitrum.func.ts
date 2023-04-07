import { Erc20Bridger, getL2Network } from '@arbitrum/sdk';
import { BigNumber, ethers, providers, Wallet } from 'ethers';
import { getContractDeployAddress } from '../../consts/deploy.address.const';
import { deployNetwork } from '../../consts/deploy.const';

/**
 * Set up: instantiate L1 / L2 wallets connected to providers
 */
const walletPrivateKey = process.env.ETH_TESTNET_DEPLOYER_PRIVATE_KEY as string;

const l1Provider = new providers.JsonRpcProvider(process.env.ETH_TESTNET_URL);
const l2Provider = new providers.JsonRpcProvider(
  process.env.ARBITRUM_TESTNET_URL
);

const l1Wallet = new Wallet(walletPrivateKey, l1Provider);
const l2Wallet = new Wallet(walletPrivateKey, l2Provider);

const ethTestConfig = getContractDeployAddress(deployNetwork.eth_testnet);
const erc20Address = ethTestConfig.MacondoBFB as string;

async function cancelTx() {
  const txHashes = [
    '0x7bb371330209101be2fe1ddc072a73337c64735c81ec7aedc6a88770c4849e5d',
    '0x81940c0295c2d9cf66757daad9f2223e833c38114998b7ea8092faf63410919b',
    '0x4aa2c1bab48d9903551024518a6ba00172904738e33dcac69254312d53548ab5',
    '0x3ffe94cf2a4e6bc7feeeddea5c70f4a36d0fb67247b68b586395f95ec8598901',
    '0xba9b332d112eb11d5bd77208e18be95950c8af7f7dfa80d6df253a73708e23cb',
    '0x84b15346266ece59b60871244a6511a6847e98d7b19cb9625c1aebf534bc8a83',
  ];

  const tx = await l1Provider.getTransaction(txHashes[5]);
  console.log('tx', tx);
  if (!tx) {
    console.log('交易不存在');
    return;
  }

  const cancelTx = {
    nonce: tx.nonce,
    gasPrice: tx.gasPrice,
    gasLimit: 21000, // 默认gasLimit
    to: tx.to,
    value: 0,
    data: '0x',
    chainId: tx.chainId,
  };
  const signedCancelTx = await l1Wallet.signTransaction(cancelTx);
  console.log('signedCancelTx', signedCancelTx);

  const cancelTxHash = await l1Provider.sendTransaction(signedCancelTx);

  console.log('取消交易哈希值：', cancelTxHash);
  await cancelTxHash.wait().then((receipt) => {
    console.log('取消交易成功：', receipt);
  });
}

async function tokenL1ToL2() {
  console.log('tokenL1ToL2');
  console.log('erc20Address', erc20Address);

  //   await cancelTx();
  //   return;
  const erc20HumanReadable = [
    'function balanceOf(address account) external view returns (uint256)',
    'function approve(address spender, uint256 amount) external returns (bool)',
  ];

  const L1DappToken = new ethers.Contract(
    erc20Address,
    erc20HumanReadable,
    l1Provider
  );

  /**
   * Use l2Network to create an Arbitrum SDK Erc20Bridger instance
   * We'll use Erc20Bridger for its convenience methods around transferring token to L2 and back to L1
   */
  const l2Network = await getL2Network(l2Provider);
  const erc20Bridge = new Erc20Bridger(l2Network);

  //check balance
  const ethBalance = await l1Wallet.getBalance();
  console.log('l1Wallet ETH balance: ', ethers.utils.formatEther(ethBalance));

  const balance = await L1DappToken.balanceOf(l1Wallet.address);
  console.log('l1Wallet ERC20 balance: ', ethers.utils.formatEther(balance));

  const getGasPrice = async () => {
    const gasFeeData = await l1Provider.getFeeData();
    console.log(
      'origin gasFeeData',
      gasFeeData.gasPrice?.toString(),
      gasFeeData.maxFeePerGas?.toString(),
      gasFeeData.maxPriorityFeePerGas?.toString()
    );
    const gasPrice = gasFeeData.gasPrice?.mul(200).div(100) as ethers.BigNumber;
    console.log('gasPrice GWEI:', ethers.utils.formatUnits(gasPrice, 'gwei'));
    return gasPrice;
  };

  const approvalToBridge = async () => {
    console.log('Approving:');

    /**
     * The Standard Gateway contract will ultimately be making the token transfer call; thus, that's the contract we need to approve.
     * erc20Bridge.approveToken handles this approval
     * Arguments required are:
     * (1) l1Signer: The L1 address transferring token to L2
     * (2) erc20L1Address: L1 address of the ERC20 token to be deposited to L2
     */
    const approveTx = await erc20Bridge.approveToken({
      l1Signer: l1Wallet,
      erc20L1Address: erc20Address,
      overrides: {
        gasPrice: await getGasPrice(),
      },
    });
    console.log('approveTx', approveTx);
    const approveRec = await approveTx.wait();
    console.log(
      `You successfully allowed the Arbitrum Bridge to spend DappToken ${approveRec.transactionHash}`
    );
  };

  const depositToL2 = async (amount: BigNumber) => {
    console.log('Depositing:');
    /**
     * Deposit DappToken to L2 using erc20Bridge. This will escrow funds in the Gateway contract on L1, and send a message to mint tokens on L2.
     * The erc20Bridge.deposit method handles computing the necessary fees for automatic-execution of retryable tickets — maxSubmission cost & l2 gas price * gas — and will automatically forward the fees to L2 as callvalue
     * Also note that since this is the first DappToken deposit onto L2, a standard Arb ERC20 contract will automatically be deployed.
     * Arguments required are:
     * (1) amount: The amount of tokens to be transferred to L2
     * (2) erc20L1Address: L1 address of the ERC20 token to be depositted to L2
     * (2) l1Signer: The L1 address transferring token to L2
     * (3) l2Provider: An l2 provider
     */
    const depositTx = await erc20Bridge.deposit({
      amount: amount,
      erc20L1Address: erc20Address,
      l1Signer: l1Wallet,
      l2Provider: l2Provider,
      overrides: {
        gasPrice: await getGasPrice(),
      },
    });
    console.log('depositTx', depositTx);
    /**
     * Now we wait for L1 and L2 side of transactions to be confirmed
     */
    const depositRec = await depositTx.wait();
    console.log(
      `You successfully deposited DappToken to L2 ${depositRec.transactionHash}`
    );
    const l2Result = await depositRec.waitForL2(l2Provider);
    /**
     * The `complete` boolean tells us if the l1 to l2 message was successful
     */
    l2Result.complete
      ? console.log(`L2 message successful: status: ${l2Result.status}`)
      : console.log(`L2 message failed: status ${l2Result.status}`);
  };

  const getBridgeTokenBalance = async () => {
    console.log('Getting Bridge token balance:');
    /**
     * We get the address of L1 Gateway for our DappToken, which later helps us to get the initial token balance of Bridge (before deposit)
     */
    const expectedL1GatewayAddress = await erc20Bridge.getL1GatewayAddress(
      erc20Address,
      l1Provider
    );
    /**
     * Get the Bridge token balance
     */
    const finalBridgeTokenBalance = await L1DappToken.balanceOf(
      expectedL1GatewayAddress
    );
    console.log(
      'Bridge token balance: ',
      ethers.utils.formatEther(finalBridgeTokenBalance)
    );
  };

  const checkL2Balance = async () => {
    console.log('Checking L2 balance:');
    /**
     * Check if our l2Wallet DappToken balance has been updated correctly
     * To do so, we use erc20Bridge to get the l2Token address and contract
     */
    const l2TokenAddress = await erc20Bridge.getL2ERC20Address(
      erc20Address,
      l1Provider
    );
    console.log('l2TokenAddress:', l2TokenAddress);
    const l2Token = erc20Bridge.getL2TokenContract(l2Provider, l2TokenAddress);
    const l2TokenBalance = await l2Token.functions.balanceOf(l2Wallet.address);

    console.log(
      'l2Wallet DappToken balance:',
      ethers.utils.formatEther(l2TokenBalance[0])
    );
  };

  // await approvalToBridge();
  await depositToL2(ethers.utils.parseEther('10'));
  await getBridgeTokenBalance();
  await checkL2Balance();
}

async function tokenL2ToL1() {
  console.log('tokenL2ToL1');
  console.log('erc20Address', erc20Address);

  /**
   * Use l2Network to create an Arbitrum SDK Erc20Bridger instance
   * We'll use Erc20Bridger for its convenience methods around transferring token to L2 and back to L1
   */
  const l2Network = await getL2Network(l2Provider);
  const erc20Bridge = new Erc20Bridger(l2Network);

  const withdraw = async (tokenWithdrawAmount: BigNumber) => {
    console.log('Withdrawing:');

    /**
     * ... Okay, Now we begin withdrawing DappToken from L2. To withdraw, we'll use Erc20Bridger helper method withdraw
     * withdraw will call our L2 Gateway Router to initiate a withdrawal via the Standard ERC20 gateway
     * This transaction is constructed and paid for like any other L2 transaction (it just happens to (ultimately) make a call to ArbSys.sendTxToL1)
     * Arguments required are:
     * (1) amount: The amount of tokens to be transferred to L1
     * (2) erc20L1Address: L1 address of the ERC20 token
     * (3) l2Signer: The L2 address transferring token to L1
     */

    const withdrawTx = await erc20Bridge.withdraw({
      amount: tokenWithdrawAmount,
      destinationAddress: l2Wallet.address,
      erc20l1Address: erc20Address,
      l2Signer: l2Wallet,
    });

    console.log('withdrawTx', withdrawTx.hash);

    const withdrawRec = await withdrawTx.wait();
    console.log(
      `Token withdrawal initiated! 🥳 ${withdrawRec.transactionHash}`
    );
  };

  const checkL2Balance = async () => {
    /**
     * And with that, our withdrawal is initiated! No additional time-sensitive actions are required.
     * Any time after the transaction's assertion is confirmed, funds can be transferred out of the bridge via the outbox contract
     * We'll check our l2Wallet DappToken balance here:
     */

    const l2Token = erc20Bridge.getL2TokenContract(
      l2Provider,
      await erc20Bridge.getL2ERC20Address(erc20Address, l1Provider)
    );

    const l2WalletBalance = (
      await l2Token.functions.balanceOf(await l2Wallet.getAddress())
    )[0];

    console.log(
      'l2Wallet DappToken balance:',
      ethers.utils.formatEther(l2WalletBalance)
    );
  };

  await checkL2Balance();
  const tokenWithdrawAmount = ethers.utils.parseEther('0.01');
  await withdraw(tokenWithdrawAmount);
  await checkL2Balance();
}

async function main() {
  // await tokenL1ToL2();
  // await tokenL2ToL1();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
