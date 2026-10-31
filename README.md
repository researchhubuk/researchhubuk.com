# Research Hub UK frontend

## GitHub Pages clean URLs

Run `npm run build:pages` after changing the inner pages. Publish the root files, `assets/`, **`about-us/index.html`** and **`contact-us/index.html`** together. These real directories serve `/about-us/` and `/contact-us/` on GitHub Pages, which does not process Apache `.htaccess` rewrite rules. Inner-page asset and navigation paths are relative, so they also work beneath `/researchhubuk.com/`. Commit the generated folders when publishing from a branch; include them in the artifact when publishing through Actions. Apache uses the same folders, with redirects for older URLs in `.htaccess`.

A responsive HTML5, Bootstrap 5.3.8, CSS and vanilla JavaScript theme. Open `http://localhost/researchhubuk/` in XAMPP. No PHP server logic is required for the preview.

The original document is preserved at `content/original.html`. All customer copy is retained; document metadata becomes real metadata, editorial notes are removed, and button annotations become CTAs. `python tools/build.py` rebuilds the page from the preserved document. Edit the generator when changing the page layout. Service cards currently link to the requirements section because no individual service-page content was supplied.

Run `npm.cmd install`, `python tools/build.py`, then `node tools/assets.cjs` to rebuild dependencies and images. The generated assets are committed locally and do not require Node at runtime. Google Fonts are the only runtime external assets; system font fallbacks are provided. Bootstrap is MIT licensed; its license is included in `assets/vendor/`.

## Laravel integration

Copy `assets/` into Laravel `public/assets/`, copy `index.html` into `resources/views/home.blade.php`, and change local asset URLs to `{{ asset('assets/...') }}`. Add `Route::view('/', 'home')->name('home');` to `routes/web.php`. The static page renders all content on the server and needs no SPA framework.

The requirements form currently downloads a text brief. It sends no data to a server and displays that behavior explicitly. Before enabling delivery, connect a Laravel POST route with CSRF, server validation, rate limiting and configured mail transport; update the button and confirmation only when real delivery is implemented. Contact details are configured through `content/site.json`: email `clients.researchhubuk@gmail.com` and WhatsApp `+8801313633953`, with active email and WhatsApp links. No customer reviews or university affiliations were added.

## Production SEO setup

The supplied title and description are retained. The theme includes one H1, semantic section headings, crawlable links, image dimensions and alt text, responsive layouts, Organization JSON-LD, Open Graph and Twitter card metadata. Public content defaults to `index, follow`; this is not a guarantee of rankings. The slider is manually controlled to avoid forced motion.

The confirmed production domain `https://researchhubuk.com` is set in `content/site.json`. The generator writes an absolute canonical URL, `og:url`, absolute social image URLs, and Organization `url` and `logo`, plus `sitemap.xml` and `robots.txt`. The sitemap lists only the homepage, since the supplied content is a single page. Configure real contact details and any supplied legal pages before launch. Staging should use a response-level `X-Robots-Tag: noindex`; do not carry that restriction to the public site. This work is local and has not deployed the site or verified the production domain.

References: [Bootstrap documentation](https://getbootstrap.com/docs/5.3/getting-started/introduction/) and [Google Search Central SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).

Photos: Unsplash image IDs `photo-1523240795612-9a054b0db644`, `photo-1507842217343-583bb7270b66`, `photo-1541339907198-e08756dedf3f`. Stock photographs illustrate academic life and do not depict the Research Hub UK team or imply an institutional affiliation. Logo and social layout are original SVG/code artwork. Photo derivatives are locally optimized WebP.

## Verification

Run `node tools/check.cjs` with XAMPP serving the site. Checks cover content preservation, mobile/desktop overflow, image loads, slider, navigation, FAQ and the requirements download. Screenshots are written under `artifacts/`.
