This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Clash Royale Spy Game (FastAPI backend)

This workspace also contains a FastAPI backend that powers the Spy game.

### Run backend (Windows PowerShell)

1. Create and activate a virtual environment (optional but recommended):

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r ..\backend\requirements.txt
```

3. Start the API server:

```powershell
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

You should see `http://localhost:8000/` and `/health` become available.

### Run frontend

In a separate terminal from the `clash_royale` folder:

```powershell
npm install
$env:NEXT_PUBLIC_API_BASE="http://localhost:8000"; npm run dev
```

Open http://localhost:3000 to play. Create a room, share the code with friends, and start a round. The app will assign one or more spies; non-spies get a secret Clash Royale card as their “location”.

### Cards dataset

Cards are defined in `backend/cards.json`. You can edit this list anytime; the server will use whatever is in that file on startup. If you want to use official images, host them yourself and extend the JSON to include an `image` field per card (UI currently shows names only).
