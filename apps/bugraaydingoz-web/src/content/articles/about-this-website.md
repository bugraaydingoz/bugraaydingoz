---
title: About this website
description: This website is intentionally minimal. It is a personal portfolio, a place to write, and a little playground.
date: "2026-06-18"
updated: "2026-06-18"
tags:
  - personal website
  - portfolio
  - blog
  - monorepo
  - infrastructure
  - vps
  - docker
  - caddy
  - astro
ogImage: /og/articles/about-this-website.png
---

This website is intentionally minimal. It is a personal portfolio, a place to write, and a small playground for experiments and side projects.

I wanted a place where I could write about things I learn, document projects, and experiment with ideas that do not fit anywhere else. The website is intentionally small and simple because I would rather spend time writing and building than maintaining infrastructure.

The stack is intentionally simple as well: everything lives in a monorepo, runs on a small VPS, and is deployed with Docker Compose behind Caddy.

## Architecture

Nothing too complicated: at a high level, the setup consists of:

- A monorepo
- A small Hetzner VPS
- Docker Compose for deployment
- Caddy as a reverse proxy

The goal is to keep the system simple and easy to maintain.

## The Monorepo

The website lives in a GitHub monorepo under `bugraaydingoz/bugraaydingoz`.

I like keeping personal projects in a monorepo because it gives me one place for site code, scripts, tests, infrastructure, and future experiments. Right now the repo is organized around deployable apps and shared infrastructure:

```txt
apps/
  (deployable apps)
  bugraaydingoz-web/
  ...
packages/
  (shared packages)
  ...
infra/
  docker-compose.yml
  Caddyfile
  *.Dockerfile
```

The root workspace currently uses `pnpm` to discover apps through `apps/*`. Each app can keep its own framework, scripts, tests, and deployment needs, while the root keeps shared commands for formatting, linting, building, and testing. For now, pnpm is enough. If the repository grows to include more diverse technologies, I may revisit that decision.

## Astro

This website is built with Astro. Most of the content is static, with only a handful of interactive components, which makes Astro a natural fit.

Articles are plain Markdown files with frontmatter metadata. The site uses that metadata to generate article pages, SEO tags, Open Graph images, and the sitemap.

```md
---
title: About this website
description: This website is intentionally minimal.
date: "2026-06-18"
tags:
  - infrastructure
  - vps
  - docker
---
```

## Infrastructure

The entire monorepo runs on a small Hetzner VPS.

For a project of this size, Docker Compose is more than enough. It keeps deployment simple while still providing isolated services and reproducible builds.

I currently deploy manually by connecting to the VPS over SSH. Eventually, I plan to automate deployments with GitHub Actions.

Caddy sits at the edge and handles HTTPS certificates, redirects, and reverse proxying with very little configuration.

If the project ever grows, I can always introduce tools such as k3s or another orchestration layer later.

## Testing

The repository uses a small set of checks to catch regressions before they reach production:

- `oxlint` for fast linting across the workspace
- `oxfmt` for formatting
- Vitest for unit and component tests
- Playwright for end-to-end tests
- Lighthouse CI for performance and SEO checks

## Why self-host?

For personal projects, I often prefer renting a small VPS over deploying directly to platforms like Vercel or Netlify.

Managed platforms are excellent products, but running your own server teaches you things that hosted platforms intentionally abstract away: DNS, reverse proxies, containers, deployment pipelines, SSH access, firewalls, and system administration.

You do not need those skills to launch a website, but learning them is very valuable.

I'm intentionally skipping the server setup details in this article. DNS configuration, SSH hardening, Docker installation, firewall rules, and deployment permissions deserve a dedicated guide of their own.

## What's next?

Like any personal project, this website will probably never be finished. There is always another idea to try or another detail to polish.

For now, the roadmap is simple:

- A proper deployment pipeline
- Basic analytics
- A couple of side projects I've been tinkering with

And perhaps a few more easter eggs.

By the way, have you found the one on the home page yet?
