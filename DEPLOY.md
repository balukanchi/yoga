# Publish Student Yoga on GitHub Pages

The static version uses index.html, app.js, and config.js. The original PHP file is preserved but is not used by GitHub Pages.

## Configure Supabase

1. In your Supabase project's Settings > API Keys, copy the publishable key beginning with `sb_publishable_`.
2. Replace `YOUR_SUPABASE_PUBLISHABLE_KEY` in config.js with that key.
3. Browser code and this key are public. Never use a secret or service_role key.
4. Ensure Row Level Security is enabled on student_yoga and that its policies allow only the intended access. This version has no sign-in: any rows allowed for anonymous SELECT can be viewed by anyone. Only enable anonymous access if these student names are intended to be public. If the records are private, add authentication and appropriate policies before publishing.

## Upload and enable hosting

1. Open https://github.com/bkarthikeyan90/balu and choose Add file > Upload files.
2. Upload index.html, app.js, config.js, and .nojekyll into the repository root and commit the changes. Do not put them inside an extra folder.
3. Open Settings > Pages.
4. Under Build and deployment, choose Deploy from a branch.
5. Select main and / (root), then Save.
6. Wait for deployment to complete. GitHub will show the live URL, expected to be https://bkarthikeyan90.github.io/balu/.

Open the live URL and confirm the table loads. A missing key, failed connection, and denied database access show an error instead of a misleading record count.

To preview locally, run `php -S localhost:8080` from this folder and open http://localhost:8080/index.html.

The displayed total is the number of records returned by Supabase; the project's API row limit may cap it, matching the original PHP behavior.

