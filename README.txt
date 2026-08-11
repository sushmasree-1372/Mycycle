LumaCycle – iPhone Layout Fixed Build

Use index.html as the GitHub Pages entry file.

Fixes in this build:
- Hero artwork keeps the correct landscape ratio instead of being vertically stretched/cropped.
- Swipe hint is placed once and no longer visually duplicates the artwork text.
- Previous/next date labels are covered by live UI labels.
- Date heading scales down on smaller iPhones and long dates.
- Action cards and insight cards use responsive typography and spacing.
- Bottom navigation no longer blocks the page content; extra safe-area padding is included.
- iPhone/Safari safe-area support is enabled.
- All hero/flower artwork is embedded directly in index.html, so GitHub Pages cannot lose image paths.
- Swipe left/right, date arrows, cycle calculations, logging, calendar, insights, and profile remain functional.

To publish on GitHub Pages: replace the existing index.html and manifest.webmanifest with the files in this folder, commit, then hard-refresh Safari or open the site in a private tab to bypass cached CSS.
