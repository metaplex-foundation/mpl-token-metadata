import {
  addAmounts,
  base58PublicKey,
  createGenericFileFromBrowserFile,
  createGenericFileFromJson,
  generateRandomString,
  generateSigner,
  Umi,
  percentAmount,
  PublicKey,
  signerPayer,
  SolAmount,
  transactionBuilder,
} from "@metaplex-foundation/umi";
import { createNft } from "@metaplex-foundation/mpl-token-metadata";
import { Inter } from "@next/font/google";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import Head from "next/head";
import { FormEvent, useState } from "react";
import { useUmi } from "./useUmi";

import styles from "@/styles/Home.module.css";
import { createDerivedSigner } from "@metaplex-foundation/umi-signer-derived";
import {
  transferAllSol,
  transferSol,
} from "@metaplex-foundation/mpl-essentials";
const inter = Inter({ subsets: ["latin"] });

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

async function uploadAndCreateNft(umi: Umi, name: string, file: File) {
  // Ensure input is valid.
  if (!name) {
    throw new Error("Please enter a name for your NFT.");
  }
  if (!file || file.size === 0) {
    throw new Error("Please select an image for your NFT.");
  }

  // Get files to upload and mock metadata.
  const imageFile = await createGenericFileFromBrowserFile(file);
  const mockUri = "x".repeat(200);
  const mockMetadataFile = createGenericFileFromJson({
    name,
    description: "A test NFT created via Umi.",
    image: mockUri,
  });

  // Create derived signer.
  const derivedMessage =
    "By signing this message, it allows us to create " +
    "a temporary derived keypair that only you can access. " +
    "This improves the user experience as you only need to fund " +
    "that keypair once instead of having to approve dozens of " +
    "transactions. For security purpose, it is best practice to " +
    "add a nonce to the message to prevent replay attacks.\n\n" +
    `[Nonce: ${generateRandomString()}]`;
  const derivedSigner = await createDerivedSigner(
    umi,
    umi.payer,
    derivedMessage
  );

  // Compute amount to fund the derived signer.
  const uploadAmount = (await umi.uploader.getUploadPrice([
    imageFile,
    mockMetadataFile,
  ])) as SolAmount;
  const transactionAmount = await createNft(umi, {
    mint: generateSigner(umi),
    name,
    uri: mockUri,
    sellerFeeBasisPoints: percentAmount(5.5),
  }).getRentCreatedOnChain(umi);

  // Fund and use the derived signer.
  await transferSol(umi, {
    source: derivedSigner.originalSigner,
    destination: derivedSigner.publicKey,
    amount: addAmounts(uploadAmount, transactionAmount),
  }).sendAndConfirm(umi);
  umi.use(signerPayer(derivedSigner));

  // Upload image and JSON data.
  const [imageUri] = await umi.uploader.upload([imageFile]);
  const uri = await umi.uploader.uploadJson({
    name,
    description: "A test NFT created using the umi JS SDK.",
    image: imageUri,
  });

  // Create the NFT and transfer any leftover SOL.
  // Note that, the original signer will need to sign this transaction as well
  // in order to be a verified creator of the NFT. If that was not a requirement,
  // we could save an extra wallet approval.
  const mint = generateSigner(umi);
  const sellerFeeBasisPoints = percentAmount(5.5, 2);
  await transactionBuilder()
    .add(createNft(umi, { mint, name, uri, sellerFeeBasisPoints }))
    .add(
      transferAllSol(umi, {
        source: derivedSigner,
        destination: derivedSigner.originalSigner.publicKey,
      })
    )
    .sendAndConfirm(umi);

  // Revert to the original signer.
  umi.use(signerPayer(derivedSigner.originalSigner));

  // Return the mint address.
  return mint.publicKey;
}

export default function Home() {
  const wallet = useWallet();
  const umi = useUmi();
  const [loading, setLoading] = useState(false);
  const [mintCreated, setMintCreated] = useState<PublicKey | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.target as HTMLFormElement);
    const data = Object.fromEntries(formData) as { name: string; image: File };

    try {
      const mint = await uploadAndCreateNft(umi, data.name, data.image);
      setMintCreated(mint);
    } finally {
      setLoading(false);
    }
  };

  const PageContent = () => {
    if (!wallet.connected) {
      return <p>Please connect your wallet to get started.</p>;
    }

    if (loading) {
      return (
        <div className={styles.loading}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="192"
            height="192"
            fill="currentColor"
            viewBox="0 0 256 256"
          >
            <rect width="256" height="256" fill="none"></rect>
            <path
              d="M168,40.7a96,96,0,1,1-80,0"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="24"
            ></path>
          </svg>
          <p>Creating the NFT...</p>
        </div>
      );
    }

    if (mintCreated) {
      return (
        <a
          className={styles.success}
          target="_blank"
          href={
            "https://www.solaneyes.com/address/" +
            base58PublicKey(mintCreated) +
            "?cluster=devnet"
          }
          rel="noreferrer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="192"
            height="192"
            fill="currentColor"
            viewBox="0 0 256 256"
          >
            <rect width="256" height="256" fill="none"></rect>
            <polyline
              points="172 104 113.3 160 84 132"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="24"
            ></polyline>
            <circle
              cx="128"
              cy="128"
              r="96"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="24"
            ></circle>
          </svg>
          <div>
            <p>
              <strong>NFT Created</strong> at the following address
            </p>
            <p>
              <code>{base58PublicKey(mintCreated)}</code>
            </p>
          </div>
        </a>
      );
    }

    return (
      <form method="post" onSubmit={onSubmit} className={styles.form}>
        <label className={styles.field}>
          <span>Name</span>
          <input name="name" defaultValue="My NFT" />
        </label>
        <label className={styles.field}>
          <span>Image</span>
          <input name="image" type="file" />
        </label>
        <button type="submit">
          <span>Create NFT</span>
          <svg
            aria-hidden="true"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 448 512"
          >
            <path
              fill="currentColor"
              d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"
            ></path>
          </svg>
        </button>
      </form>
    );
  };

  return (
    <>
      <Head>
        <title>Create NFT</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={inter.className}>
        <div className={styles.wallet}>
          <WalletMultiButtonDynamic />
        </div>

        <div className={styles.center}>
          <PageContent />
        </div>
      </main>
    </>
  );
}
