import { createMetaplex } from "@lorisleiva/js";
import {
  createSignerFromWalletAdapter,
  walletAdapterIdentity,
} from "@lorisleiva/js-signer-wallet-adapters";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";
import { MetaplexContext } from "./useMetaplex";

export const MetaplexProvider = ({ children }: any) => {
  const wallet = useWallet();
  const metaplex = createMetaplex("");

  useEffect(() => {
    metaplex.use(walletAdapterIdentity(wallet));
  }, [metaplex, wallet]);

  return (
    <MetaplexContext.Provider value={{ metaplex }}>
      {children}
    </MetaplexContext.Provider>
  );
};
