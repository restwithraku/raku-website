# Raku website

*Where comfort comes to rest.* The website for Raku mattresses, made by Shree Hari Har Comfort, Kutail, Haryana.

Built with React and Vite. It is a static site (no server or database), hosted free on GitHub Pages.

## Run it on your computer
1. Install [Node.js](https://nodejs.org) (version 20.19 or newer).
2. In this folder, run `npm install` once.
3. Run `npm run dev` and open http://localhost:5190.

To check the production build locally: `npm run build`, then `npm run preview` (also on port 5190, so stop `npm run dev` first).
The port is fixed in `vite.config.js`; if 5190 is busy, the command stops with an error instead of switching ports.

## Publish on GitHub Pages (free)

### 1. Create the repository
1. Sign in to [github.com](https://github.com) and create a new repository named `raku-website`.
   On a free account it must be **Public** for GitHub Pages to work.
2. Upload this folder's contents. The `.gitignore` already leaves out `node_modules` and `dist`.
   With Git installed, from this folder:
   ```
   git init -b main
   git add .
   git commit -m "Raku website v1"
   git remote add origin https://github.com/YOUR-USERNAME/raku-website.git
   git push -u origin main
   ```

### 2. Turn on Pages
1. In the repository, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Open the **Actions** tab. The *Deploy to GitHub Pages* workflow runs on every push to `main`; the first run takes about a minute.
   (If it ran before Pages was switched on and failed, click it and choose **Re-run all jobs**.)
4. The site is then live at `https://YOUR-USERNAME.github.io/raku-website/`.

### 3. Connect your domain
1. In **Settings → Pages → Custom domain**, enter your domain (for example `restwithraku.com`) and click **Save**.
2. At the company where you bought the domain, open its DNS settings, remove any existing `A` or `CNAME` records for `@` and `www`, and add:

   | Type  | Name  | Value                         |
   |-------|-------|-------------------------------|
   | A     | `@`   | `185.199.108.153`             |
   | A     | `@`   | `185.199.109.153`             |
   | A     | `@`   | `185.199.110.153`             |
   | A     | `@`   | `185.199.111.153`             |
   | CNAME | `www` | `YOUR-USERNAME.github.io`     |

3. Wait for DNS to update (usually under an hour, up to 48 hours), then tick **Enforce HTTPS** in **Settings → Pages**.

Every later push to `main` updates the live site automatically.

## Connect reviews to Google Sheets (free)
Customers write reviews on the website. Each one lands in your Google Sheet; it appears on the site
only after you tick **Approved**. Do this once, on your own computer, with a personal Google account.

1. **Create the Sheet.** Go to [sheets.google.com](https://sheets.google.com) and create a blank spreadsheet, e.g. "Raku reviews".
2. **Add the script.** In the Sheet, open **Extensions → Apps Script**. Delete the sample code, paste the whole of
   `apps-script/Code.gs` from this project, and click **Save**.
3. **Run setup once.** In the toolbar, choose the `setup` function and click **Run**. Google asks for permission
   (choose your account → *Advanced* → *Go to project* → *Allow*). This creates a **Reviews** tab with the columns
   Date, Name, City, Product, Rating, Review, Approved.
4. **Publish it as a web app.** Click **Deploy → New deployment**, pick the type **Web app**, and set:
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**

   Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).
5. **Connect the website.** Open `src/config.js`, paste the URL between the quotes of `REVIEWS_ENDPOINT`, and upload
   that file to GitHub. The site rebuilds in about a minute.

**Approving reviews:** open the Sheet, read the new rows, and tick **Approved** for the ones to show. They appear on the
site within about a minute. Untick to hide one again. Only the name, city, product, rating, review and month are shown;
the Sheet itself stays private.

**If you change the script later:** use **Deploy → Manage deployments → Edit → Version: New version → Deploy**, so the
URL stays the same.

Built in: a hidden anti-bot field, a duplicate-submission check, a consent tick box on the form, and limits on length.
Reviews can still be added by hand in `src/reviews.js` (for example ones received on WhatsApp), and they show alongside
the approved Sheet reviews.

## Project layout
- `src/main.jsx`: the page and its sections
- `src/products.js`: the product range (from the Shree Hari Har Comfort IndiaMART catalogue). All measurements are in inches.
- `src/interactive.jsx`: the Press test, Room fit planner and custom-size fields
- `src/reviewsSection.jsx`, `src/reviews.js`: the reviews section and any reviews added by hand
- `src/config.js`: site settings (the reviews web app URL)
- `apps-script/Code.gs`: the Google Apps Script to paste into the reviews Sheet
- `src/brand.jsx`: the ISO 9001:2015 badge
- `src/styles.css`: styles, using only the brand-guideline colours
- `public/brand/`: official logos, icon, packaging icons and brand photos
- `.github/workflows/deploy.yml`: builds the site and publishes it to GitHub Pages

## Known gaps (planned for version 2)
- The enquiry form does not send messages yet. Connect a form service such as Formspree or Web3Forms
  (or reuse the Google Sheet approach used for reviews).
- Several product thicknesses from the IndiaMART listings look wrong (for example 0.79″ mattresses) and need confirming.
- Headings use DM Sans until a web licence for the brand font, Forma DJR, is in place. The font settings already list Forma DJR first.
