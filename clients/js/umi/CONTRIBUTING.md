# Contributing to the JavaScript client

This is a quick guide to help you contribute to the JavaScript client of Mpl Token Metadata.

## Getting started

[Ensure you have pnpm installed](https://pnpm.io/installation) and run the following command to install the client's dependencies.

```sh
pnpm install
```

You can then run the following commands to build, test and lint the client.

```sh
# Build the client.
pnpm build

# Test the client (requires building first).
pnpm build && pnpm test

# Test a specific file or set of files.
pnpm build && pnpm test test/somefile.test.js
pnpm build && pnpm test test/somePattern*

# Lint and/or format the client.
pnpm lint:fix
pnpm format:fix
```

When something changes in the program(s), make sure to run `pnpm generate` in the root directory, to re-generate the clients accordingly.

## Deploying the JavaScript client

You can deploy a new version of the JavaScript client by manually dispatching the "Deploy JS Client" workflow in the GitHub Actions tab of the repository.

![Click on the "Actions" tab, then on the "Deploy JS Client" workflow, then on the "Run workflow" dropdown. Select your options before clicking on the final "Run workflow" button inside the dropdown body.](https://user-images.githubusercontent.com/3642397/235444901-6ee95f30-ed84-4eef-b1c4-8b8474ab82a4.png)

For this to work, some initial setup is required on the repository as explained below.

## Setting up GitHub actions

To deploy JavaScript clients using GitHub actions, we first need the following secret variables to be set up on the repository.

- `NPM_TOKEN` — An access token that can publish your packages to NPM.
- `VERCEL_TOKEN` — An access token that can deploy to Vercel.
- `VERCEL_ORG_ID` — The ID of the Vercel organization you want to deploy to.

Then, we'll need to create a new GitHub environment called `js-client-documentation` for the generated documentation of the JavaScript client. We can then select the `main` branch only and add the following secret variable to this specific environment.

- `VERCEL_PROJECT_ID` — The ID of the Vercel project you want to deploy to.
  The convention for Metaplex is to create a new Vercel project named `mpl-token-metadata-js-docs` with the following deployment settings:

  - Build Command: `pnpm run build:docs`
  - Output Directory: `docs`
  - Install Command: `pnpm install`
  - Development Command: _None_

With all that set up, you can now run the "Deploy JS Client" workflow by dispatching it from the GitHub UI.
