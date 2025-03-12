import {
    appendTransactionMessageInstruction,
    createSolanaRpc,
    createSolanaRpcSubscriptions,
    createTransactionMessage,
    generateKeyPairSigner,
    getSignatureFromTransaction,
    lamports,
    none,
    pipe,
    sendAndConfirmTransactionFactory,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
    signTransactionMessageWithSigners,
  } from '@solana/kit';
  import { fetchMetadata, findMetadataPda, getCreateV1Instruction, TokenStandard } from '../src/generated';
  import test from 'ava';
  
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  
  test('create an Asset', async (t) => {
    const httpProvider = 'http://127.0.0.1:8899';
    const wssProvider = 'ws://127.0.0.1:8900';
    const rpc = createSolanaRpc(httpProvider);
    const rpcSubscriptions = createSolanaRpcSubscriptions(wssProvider);
  
    const user = await generateKeyPairSigner();
  
    const airdropSignature = await rpc
      .requestAirdrop(user.address, lamports(1000000000n), {
        commitment: 'finalized',
      })
      .send();
  
    await sleep(2000);
  
    const balance = await rpc.getBalance(user.address).send();
    t.is(balance.value, lamports(1000000000n), 'User should have 1 SOL');
  
    const asset = await generateKeyPairSigner();

    const metadataPda = await findMetadataPda({
      mint: asset.address,
    });
  
    // Create Metadata Account
    const createNftIx = getCreateV1Instruction({
      mint: asset,
      name: 'test',
      uri: 'test.com',
      payer: user,
      sellerFeeBasisPoints: 0,
      updateAuthority: user,
      tokenStandard: TokenStandard.ProgrammableNonFungible,
      isMutable: true,
      primarySaleHappened: false,
      creators: [],
      metadata: metadataPda[0],
      authority: user,
    });
  
    const latestBlockhash = await rpc.getLatestBlockhash().send();
  
    const transaction = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayer(user.address, tx),
      (tx) =>
        setTransactionMessageLifetimeUsingBlockhash(latestBlockhash.value, tx),
      (tx) => appendTransactionMessageInstruction(createNftIx, tx)
    );
  
    const signedTransaction =
      await signTransactionMessageWithSigners(transaction);
    const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
      rpc,
      rpcSubscriptions,
    });
  
    try {
      await sendAndConfirmTransaction(signedTransaction, {
        commitment: 'confirmed',
      });
      const signature = getSignatureFromTransaction(signedTransaction);
    } catch (e) {
      console.error('Transaction failed:', e);
      t.fail('Asset creation failed');
    }
  
    const fetchedAsset = await fetchMetadata(rpc, metadataPda[0]);
  
    t.is(fetchedAsset.data.name, 'test');
    t.is(fetchedAsset.data.uri, 'test.com');
    t.deepEqual(fetchedAsset.data.updateAuthority, {
      __kind: 'Address',
      fields: [user.address],
    });
  });
  