import { TokenStandard } from "./generated";

export const isFungible = (tokenStandard: TokenStandard): boolean =>
    tokenStandard === TokenStandard.Fungible ||
    tokenStandard === TokenStandard.FungibleAsset;
  
  export const isNonFungible = (tokenStandard: TokenStandard): boolean =>
    !isFungible(tokenStandard);
  
  export const isProgrammable = (tokenStandard: TokenStandard): boolean =>
    tokenStandard === TokenStandard.ProgrammableNonFungible ||
    tokenStandard === TokenStandard.ProgrammableNonFungibleEdition;