# Builder Rank Site Signal WordPress Plugin

Use `builder-rank-site-signal.php` to install the Builder Rank tracking snippet on a WordPress site without editing theme files.

## Install

1. Create a folder named `builder-rank-site-signal`.
2. Put `builder-rank-site-signal.php` inside that folder.
3. Zip the folder.
4. In WordPress, go to Plugins > Add New > Upload Plugin.
5. Upload the zip and activate it.
6. Go to Settings > Builder Rank Site Signal.
7. Enter the customer Site Signal ID from Builder Rank.
8. Keep the default endpoint unless Builder Rank support provides a custom URL.
9. Leave "Track logged-in WordPress users" unchecked during beta QA so admin/editor visits do not pollute the customer's data.

The plugin injects this script on public pages:

```html
<script src="https://builderrank.io/tracker.js" data-site-id="br_customer_site_id" data-endpoint="https://builderrank.io/api/track" async></script>
```

After installation, open the customer website in a logged-out/incognito browser, load one public page, then click a phone, quote, email, or form CTA. Check `/admin-beta` workspace summary, `/api/tracking-health`, or the Builder Rank dashboard to confirm the page view and lead event arrived.
