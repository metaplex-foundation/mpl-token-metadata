import { createMetaplex } from "@lorisleiva/js";
import { walletAdapterIdentity } from "@lorisleiva/js-signer-wallet-adapters";
import { bundlrUploader } from "@lorisleiva/js-uploader-bundlr";
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
  const metaplex = createMetaplex(endpoint)
    .use(walletAdapterIdentity(wallet))
    .use(bundlrUploader())
    .use(mplDigitalAsset());

  return (
    <MetaplexContext.Provider value={{ metaplex }}>
      {children}
    </MetaplexContext.Provider>
  );
};
