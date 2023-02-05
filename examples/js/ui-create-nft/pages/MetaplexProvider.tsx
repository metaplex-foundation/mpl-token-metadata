import { createMetaplex } from "@lorisleiva/js";
import { walletAdapterIdentity } from "@lorisleiva/js-signer-wallet-adapters";
import { useWallet } from "@solana/wallet-adapter-react";
import { MetaplexContext } from "./useMetaplex";

export const MetaplexProvider = ({
  endpoint,
  children,
}: {
  endpoint: string;
  children: React.ReactNode;
}) => {
  const wallet = useWallet();
  const metaplex = createMetaplex(endpoint).use(walletAdapterIdentity(wallet));

  return (
    <MetaplexContext.Provider value={{ metaplex }}>
      {children}
    </MetaplexContext.Provider>
  );
};
