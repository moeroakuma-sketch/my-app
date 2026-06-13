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

## Local Database Snapshot

The repository stores the local PostgreSQL schema in `prisma/schema.prisma` and
the saved table contents in `prisma/snapshots/local.json`.

Export the current local database:

```bash
make db-snapshot
```

Reset the database configured by `.env` and restore the saved snapshot:

```bash
make db-reset
```

The reset command displays a destructive-operation warning and only continues
after entering `RESET`. For a non-interactive development environment, set
`DB_RESET_CONFIRM=1`.

On Windows systems without GNU Make, use the equivalent npm commands:

```bash
npm run db:snapshot
npm run db:reset
```

The snapshot contains all development rows, including users, password hashes,
orders, reviews, and payment method metadata. Do not put production or other
sensitive personal data in the local database before exporting it.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
