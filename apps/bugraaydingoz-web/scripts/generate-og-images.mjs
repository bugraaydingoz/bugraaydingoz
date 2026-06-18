import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = join(appRoot, "public");
const chromePath =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const defaultIntro =
  "Product Engineer with 8+ years of experience creating intuitive, user-focused applications. Frontend, design, backend, and team leadership.";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function assetData(path, mimeType) {
  const data = readFileSync(path).toString("base64");
  return `data:${mimeType};base64,${data}`;
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);

  if (!match) {
    return {};
  }

  const frontmatter = {};
  const lines = match[1].split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const keyValue = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);

    if (!keyValue) {
      continue;
    }

    const [, key, rawValue] = keyValue;

    if (rawValue === "") {
      const list = [];

      while (lines[index + 1]?.trimStart().startsWith("- ")) {
        index += 1;
        list.push(lines[index].trimStart().slice(2).trim());
      }

      frontmatter[key] = list;
      continue;
    }

    frontmatter[key] = rawValue.replace(/^["']|["']$/g, "");
  }

  return frontmatter;
}

function getArticleCards() {
  const articlesRoot = join(appRoot, "src/content/articles");

  return readdirSync(articlesRoot)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      const slug = fileName.replace(".md", "");
      const frontmatter = parseFrontmatter(
        readFileSync(join(articlesRoot, fileName), "utf8"),
      );

      return {
        eyebrow: frontmatter.date ?? "Article",
        intro: frontmatter.description ?? defaultIntro,
        output: `og/articles/${slug}.png`,
        slug,
        title: frontmatter.title ?? slug,
      };
    });
}

function createOgImageHtml({
  eyebrow = "Product Engineer",
  imagePath = join(publicRoot, "bugra-aydingoz-portrait.jpeg"),
  intro = defaultIntro,
  title = "Buğra Aydıngöz",
} = {}) {
  const photo = assetData(imagePath, "image/jpeg");
  const satoshiRegular = assetData(join(publicRoot, "fonts/satoshi-regular.woff2"), "font/woff2");
  const satoshiMedium = assetData(join(publicRoot, "fonts/satoshi-medium.woff2"), "font/woff2");
  const safeEyebrow = escapeHtml(eyebrow);
  const safeIntro = escapeHtml(intro);
  const safeTitle = escapeHtml(title);

  return `<!doctype html>
<html>
    <head>
        <meta charset="utf-8" />
        <style>
            @font-face {
                font-family: "Satoshi";
                src: url("${satoshiRegular}") format("woff2");
                font-style: normal;
                font-weight: 400;
            }

            @font-face {
                font-family: "Satoshi";
                src: url("${satoshiMedium}") format("woff2");
                font-style: normal;
                font-weight: 500;
            }

            * {
                box-sizing: border-box;
            }

            html,
            body {
                width: 1200px;
                height: 630px;
                margin: 0;
                overflow: hidden;
                color: #f5f5f5;
                background: #000;
                font-family: "Satoshi", Arial, sans-serif;
            }

            .card {
                display: grid;
                grid-template-columns: 236px minmax(0, 1fr);
                gap: 72px;
                align-items: center;
                width: 1200px;
                height: 630px;
                padding: 78px 82px;
                background: #000;
            }

            .portrait {
                display: block;
                width: 236px;
                height: 236px;
                object-fit: cover;
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 18px;
            }

            .eyebrow {
                margin: 0 0 32px;
                color: #8f8f8f;
                font-size: 28px;
                font-weight: 400;
                line-height: 1;
            }

            .title {
                margin: 0 0 28px;
                color: #f5f5f5;
                font-size: 68px;
                font-weight: 500;
                letter-spacing: 0;
                line-height: 1;
                white-space: nowrap;
            }

            .intro {
                max-width: 720px;
                margin: 0;
                color: #d8d8d8;
                font-size: 31px;
                font-weight: 400;
                letter-spacing: 0;
                line-height: 1.34;
            }
        </style>
    </head>
    <body>
        <main class="card">
            <img class="portrait" src="${photo}" alt="" />
            <section>
                <p class="eyebrow">${safeEyebrow}</p>
                <h1 class="title">${safeTitle}</h1>
                <p class="intro">${safeIntro}</p>
            </section>
        </main>
    </body>
</html>`;
}

function renderOgImage(card) {
  const tempDir = mkdtempSync(join(tmpdir(), "bugra-og-"));
  const htmlPath = join(tempDir, `${card.slug}.html`);
  const outputPath = join(publicRoot, card.output);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(htmlPath, createOgImageHtml(card));

  try {
    execFileSync(
      chromePath,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        `--screenshot=${outputPath}`,
        "--window-size=1200,630",
        `file://${htmlPath}`,
      ],
      { stdio: "inherit" },
    );
  } finally {
    rmSync(tempDir, { force: true, recursive: true });
  }
}

export { createOgImageHtml, renderOgImage };

function generateOgImages() {
  const cards = [
    {
      output: "og-image.png",
      slug: "home",
    },
    ...getArticleCards(),
  ];

  for (const card of cards) {
    renderOgImage(card);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateOgImages();
}

export { generateOgImages };
