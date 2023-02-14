# Upload and Create NFTs using a Derived Signer

- Uses wallet adapters to connect to a wallet in the browser.
- Creates, funds and uses a derived signer.
- Uploads image and metadata via Bundlr.
- Creates an NFT from the uploaded image and metadata.

```shell
# Create a new Next app with all default values.
npx create-next-app@latest ui-create-nft
cd ui-create-nft

# Install dependencies.
npm install @metaplex-foundation/umi \
  @metaplex-foundation/umi-signer-wallet-adapters \
  @metaplex-foundation/umi-uploader-bundlr \
  @metaplex-foundation/umi-signer-derived \
  @metaplex-foundation/mpl-essentials \
  @lorisleiva/mpl-digital-asset \
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
