Self-hosted fonts for CamSound frontend

Place the following WOFF2 files in this folder (best practice: subset and serve WOFF2):

- Inter-Regular.woff2
- Inter-Medium.woff2
- Inter-SemiBold.woff2
- Inter-Bold.woff2
- Roboto-Regular.woff2
- Roboto-Bold.woff2

Recommended sources:
- Download variable/woff2 builds from Google Fonts (use the `Download family` option) and extract the WOFF2 files.
- Use a font subsetting tool (glyphhanger, google-webfonts-helper, or FontTools) to reduce file size.

After placing files, the app will load fonts from `/fonts/*.woff2` automatically. If you prefer a CDN during development, replace the `@font-face` src URLs in `src/index.css` with the CDN paths.
