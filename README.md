# Purple Croc Website

This project is a Next.js + Tailwind CSS site for the Purple Croc memecoin and NFT cult.

## Firebase Hosting Deployment

### Required setup
1. Install Node.js and npm.
2. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
3. Log in to Firebase:
   ```bash
   firebase login
   ```
4. Confirm your project ID in `.firebaserc` is set to `purple-croc`:
   ```json
   {
     "projects": {
       "default": "purple-croc"
     }
   }
   ```
5. If you do not have a Firebase project, create one in the Firebase console:
   https://console.firebase.google.com/

### Deploy commands

Build and export the site:
```bash
npm install
npm run export
```

Deploy to Firebase Hosting:
```bash
firebase deploy --only hosting
```

Or run the combined script:
```bash
npm run deploy
```

## Custom Domain
If you want a custom domain, add it in Firebase Hosting settings and update your DNS provider with the records Firebase gives you.

### DNS notes
- Use the A/AAAA records Firebase provides if you want the root domain.
- Use CNAME for subdomains if requested.
- Enable HTTPS from Firebase after DNS propagation.

## Claude Code API Setup
1. Copy `.env.local.example` to `.env.local`.
2. Set your Anthropic API key:
   ```env
   ANTHROPIC_API_KEY=your-anthropic-api-key
   ```
3. Use the new API route at `/api/claude-code` with a POST body containing `prompt`.

Example client request:
```js
const response = await fetch('/api/claude-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'Write a JavaScript function that reverses a string.' }),
})
const data = await response.json()
console.log(data)
```

> Note: This route requires a server runtime. The current project is configured as a static export, so `/api/claude-code` will only work when deployed to a Node-capable environment or serverless platform, not with `next export` alone.

## Notes
- The project is configured as a static export (`output: 'export'` in `next.config.mjs`).
- All pages are currently static and ready for Firebase hosting.
