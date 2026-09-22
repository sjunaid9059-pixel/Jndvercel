# Firebase Merge Panel

A small Vercel-ready static panel that accepts a configuration through `?s=`.

## Format

The decoded payload can be:

```text
MERGED:::[{"url":"https://your-project-default-rtdb.firebaseio.com","key":"A"}]
```

The complete payload is Base64URL encoded and placed in:

```text
https://your-domain.vercel.app/?s=ENCODED_VALUE
```

## Important

This project only reads Firebase Realtime Database endpoints that the browser is actually permitted to read by the database's security rules. Do not put Firebase Admin SDK credentials, service-account private keys, passwords, or other secrets in the URL.

## Deploy

1. Upload the files to a GitHub repository.
2. Import the repository into Vercel.
3. Keep the framework preset as **Other** / static if Vercel asks.
4. Deploy.

No build command or environment variables are required.
