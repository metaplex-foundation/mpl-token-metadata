import { createMetaplex, defaultPlugins } from "@lorisleiva/js";
import { walletAdapterIdentity } from "@lorisleiva/js-signer-wallet-adapters";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";
import { MetaplexContext } from "./useMetaplex";

export const MetaplexProvider = ({
  endpoint,
  children,
}: {
  endpoint: string;
  children: React.ReactNode;
}) => {
  const wallet = useWallet();
  const metaplex = createMetaplex(endpoint);

  useEffect(() => {
    metaplex.use(defaultPlugins(endpoint));
  }, [metaplex, endpoint]);

  useEffect(() => {
    metaplex.use(walletAdapterIdentity(wallet));
  }, [metaplex, wallet]);

  return (
    <MetaplexContext.Provider value={{ metaplex }}>
      {children}
    </MetaplexContext.Provider>
  );
};
