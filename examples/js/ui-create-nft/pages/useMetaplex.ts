import type { Umi } from "@metaplex-foundation/umi";
import { createContext, useContext } from "react";

type MetaplexContext = {
  metaplex: Umi | null;
};

const DEFAULT_CONTEXT: MetaplexContext = {
  metaplex: null,
};

export const MetaplexContext = createContext<MetaplexContext>(DEFAULT_CONTEXT);

export function useMetaplex(): Umi {
  const metaplex = useContext(MetaplexContext).metaplex;
  if (!metaplex) {
    throw new Error(
      "Metaplex context was not initialized. " +
        "Did you forget to wrap your app with <MetaplexProvider />?"
    );
  }
  return metaplex;
}
