import { createUmi } from "@metaplex-foundation/umi";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { nftStorageUploader } from "@metaplex-foundation/umi-uploader-nft-storage";
import { mplDigitalAsset } from "@lorisleiva/mpl-digital-asset";
import { useWallet } from "@solana/wallet-adapter-react";
import { ReactNode } from "react";
import { MetaplexContext } from "./useMetaplex";

export const MetaplexProvider = ({
  endpoint,
  children,
}: {
  endpoint: string;
  children: ReactNode;
}) => {
  const wallet = useWallet();
  const metaplex = createUmi(endpoint)
    .use(walletAdapterIdentity(wallet))
    .use(nftStorageUploader())
    .use(mplDigitalAsset());

  return (
    <MetaplexContext.Provider value={{ metaplex }}>
      {children}
    </MetaplexContext.Provider>
  );
};
