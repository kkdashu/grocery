# Grocery Resource Viewer

A simple, modern file browser for Cloudflare R2 buckets, built with React, Vite, and Cloudflare Workers.

## Features

-   **Browse Files**: Navigate through folders and files in your R2 bucket.
-   **Direct Download**: Click files to download them directly (using `Content-Disposition`).
-   **Token-Protected Downloads**: File downloads require a token stored in KV to prevent public access.
-   **Modern UI**: Clean interface with formatted file sizes and icons.
-   **SPA Architecture**: Fast React-based frontend served via Cloudflare Assets.

## Prerequisites

-   Node.js (v18+)
-   pnpm (recommended) or npm
-   Cloudflare Wrangler CLI

## Setup

1.  **Install dependencies**:
    ```bash
    pnpm install
    ```

2.  **Configure Wrangler**:
    Ensure `wrangler.jsonc` is configured with your R2 bucket.

    ```jsonc
    "r2_buckets": [
        {
            "binding": "AssetsStore",
            "bucket_name": "your-bucket-name",
            "preview_bucket_name": "your-dev-bucket-name" // Optional, for local preview
        }
    ]
    ```

3.  **Configure KV token** (one-time): put a secret token into your KV namespace bound as `KV`.
    - Recommended key: `download_token` (fallback key: `token`).
    - Example (use your namespace):
      ```bash
      wrangler kv key put --namespace-id <YOUR_NS_ID> download_token <YOUR_SECRET_TOKEN>
      ```

## Development

### Local Development (Mocked Data)
Run the Vite dev server with Cloudflare emulation (Miniflare):
```bash
pnpm dev
```
*Note: This uses a temporary local bucket. You won't see your remote files.*

### Preview (Remote Data)
To verify against your real remote R2 bucket:
```bash
pnpm preview
```
*Note: Requires `preview_bucket_name` to be set if you want to test with a specific dev bucket, or it will use your production bucket if authenticated.*

## Authentication & Downloads

- The Worker checks the token from one of: `Authorization: Bearer <token>`, `Authorization: <token>`, header `x-token`, or query `?token=...`.
- The frontend now assists users:
  - On first click to download, if `auth_token` is not in `localStorage`, the browser prompts for it and saves it locally.
  - All subsequent downloads automatically append `?token=<auth_token>` so the request passes server validation.
- To rotate the token, update the KV value and clear the browser's `localStorage` entry `auth_token`.

## Deployment

To build and deploy to Cloudflare Workers:
```bash
pnpm run deploy
```

## Architecture

-   **Frontend**: React + Vite (in `src/`). Built to `dist/client`.
-   **Backend**: Cloudflare Worker (in `worker/`). Handles API requests (`/api/list`, `/api/file/*`) and serves index.html fallback.
-   **Routing**:
    -   `/api/*`: Handled by Worker.
    -   Static Assets: Served by Cloudflare Asset Service (from `dist/client`).
    -   Other routes: Fallback to `index.html` (handled by Worker manual fallback).
