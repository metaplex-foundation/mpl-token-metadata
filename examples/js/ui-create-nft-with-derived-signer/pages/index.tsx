import {
  addAmounts,
  base58PublicKey,
  createGenericFileFromBrowserFile,
  createGenericFileFromJson,
  generateRandomString,
  generateSigner,
  Metaplex,
  percentAmount,
  PublicKey,
  signerPayer,
  SolAmount,
  transactionBuilder,
} from "@lorisleiva/js";
import { createNft } from "@lorisleiva/mpl-digital-asset";
import { Inter } from "@next/font/google";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import Head from "next/head";
import { FormEvent, useState } from "react";
import { useMetaplex } from "./useMetaplex";

import styles from "@/styles/Home.module.css";
import { createDerivedSigner } from "@lorisleiva/js-signer-derived";
import { bundlrUploader } from "@lorisleiva/js-uploader-bundlr";
import { transferAllSol, transferSol } from "@lorisleiva/mpl-essentials";
const inter = Inter({ subsets: ["latin"] });

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

async function uploadAndCreateNft(
  metaplex: Metaplex,
  name: string,
  file: File
) {
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
    description: "A test NFT created using the Metaplex JS SDK.",
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
    metaplex,
    metaplex.payer,
    derivedMessage
  );

  // Compute amount to fund the derived signer.
  const uploadAmount = (await metaplex.uploader.getUploadPrice([
    imageFile,
    mockMetadataFile,
  ])) as SolAmount;
  const transactionAmount = await transactionBuilder(metaplex)
    .add(
      createNft(metaplex, {
        mint: generateSigner(metaplex),
        name,
        uri: mockUri,
        sellerFeeBasisPoints: percentAmount(5.5),
      })
    )
    .getRentCreatedOnChain();

  // Fund and use the derived signer.
  await transactionBuilder(metaplex)
    .add(
      transferSol(metaplex, {
        source: derivedSigner.originalSigner,
        destination: derivedSigner.publicKey,
        amount: addAmounts(uploadAmount, transactionAmount),
      })
    )
    .sendAndConfirm();
  metaplex.use(signerPayer(derivedSigner));

  // Re-initialize the Bundlr uploader as each Bundlr instance
  // is tied to a specific signer.
  // TODO: Fix this in the Bundlr uploader.
  // Check if Bundlr signer is different to Metaplex signer
  // And re-initialize if so.
  metaplex.use(bundlrUploader());

  // Upload image and JSON data.
  const [imageUri] = await metaplex.uploader.upload([imageFile]);
  const uri = await metaplex.uploader.uploadJson({
    name,
    description: "A test NFT created using the Metaplex JS SDK.",
    image: imageUri,
  });

  // Create the NFT and transfer any leftover SOL.
  const mint = generateSigner(metaplex);
  const sellerFeeBasisPoints = percentAmount(5.5, 2);
  await transactionBuilder(metaplex)
    .add(createNft(metaplex, { mint, name, uri, sellerFeeBasisPoints }))
    .add(
      transferAllSol(metaplex, {
        source: derivedSigner,
        destination: derivedSigner.originalSigner.publicKey,
      })
    )
    .sendAndConfirm();

  // Revert to the original signer.
  metaplex.use(signerPayer(derivedSigner.originalSigner));

  // Return the mint address.
  return mint.publicKey;
}

export default function Home() {
  const wallet = useWallet();
  const metaplex = useMetaplex();
  const [loading, setLoading] = useState(false);
  const [mintCreated, setMintCreated] = useState<PublicKey | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.target as HTMLFormElement);
    const data = Object.fromEntries(formData) as { name: string; image: File };

    try {
      const mint = await uploadAndCreateNft(metaplex, data.name, data.image);
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
