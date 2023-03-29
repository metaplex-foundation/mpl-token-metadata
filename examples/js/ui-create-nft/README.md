# Upload and Create NFTs using Wallet Adapters

- Uses wallet adapters to connect to a wallet in the browser.
- Uploads image and metadata via NFT Storage.
- Creates an NFT from the uploaded image and metadata.

```shell
# Create a new Next app with all default values.
npx create-next-app@latest ui-create-nft
cd ui-create-nft

# Install dependencies.
npm install @metaplex-foundation/umi \
  @metaplex-foundation/umi-signer-wallet-adapters \
  @metaplex-foundation/umi-uploader-nft-storage \
  @metaplex-foundation/mpl-token-metadata@alpha \
  @solana/web3.js \
  @solana/wallet-adapter-base \
  @solana/wallet-adapter-react \
  @solana/wallet-adapter-react-ui \
  @solana/wallet-adapter-wallets

# Check out the code for the index page.
cat pages/index.tsx

# Run locally.
npm run dev
```
