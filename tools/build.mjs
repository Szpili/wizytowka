// Builds cv/*.pdf, the QR codes and assets/og.png from assets/js/profile.js.
// Usage: cd tools && npm install && npm run build
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { chromium } from "playwright";
import QRCode from "qrcode";

const root = fileURLToPath(new URL("..", import.meta.url));
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png"
};

const sandbox = { window: {} };
vm.runInNewContext(await readFile(join(root, "assets/js/profile.js"), "utf8"), sandbox);
const profile = sandbox.window.PROFILE;

const qr = { errorCorrectionLevel: "M", type: "svg" };
await writeFile(join(root, "tools/qr-cv.svg"),
  await QRCode.toString(profile.siteUrl, { ...qr, margin: 0, color: { dark: "#060c10", light: "#dcebe3" } }));
await writeFile(join(root, "assets/qr-wizytowka.svg"),
  await QRCode.toString(profile.siteUrl, { ...qr, margin: 2, color: { dark: "#000000", light: "#ffffff" } }));
console.log("tools/qr-cv.svg, assets/qr-wizytowka.svg ->", profile.siteUrl);

const server = createServer(async (req, res) => {
  try {
    const rel = normalize(decodeURIComponent(new URL(req.url, "http://local").pathname));
    const file = join(root, rel);
    if (!file.startsWith(root.endsWith(sep) ? root : root + sep)) throw new Error("outside root");
    const data = await readFile(file);
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
try {
  await mkdir(join(root, "cv"), { recursive: true });
  const page = await browser.newPage();
  for (const lang of ["pl", "en"]) {
    await page.goto(`${base}/tools/cv.html?lang=${lang}`, { waitUntil: "networkidle" });
    await page.evaluate(() => window.CV_READY);
    const out = join(root, profile.cv[lang]);
    await page.pdf({ path: out, format: "A4", printBackground: true, preferCSSPageSize: true });
    const pages = ((await readFile(out, "latin1")).match(/\/Type\s*\/Page[^s]/g) || []).length;
    console.log(`${profile.cv[lang]}: ${pages} page(s)`);
    if (pages > 1) console.warn(`  warning: ${profile.cv[lang]} spills onto ${pages} pages, shorten the text in profile.js`);
  }

  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await og.goto(`${base}/tools/og.html`, { waitUntil: "networkidle" });
  await og.waitForTimeout(1500);
  await og.screenshot({ path: join(root, "assets/og.png") });
  console.log("assets/og.png");
} finally {
  await browser.close();
  server.close();
}
