---
title: About this website
description: This website is intentionally minimal. It is a personal portfolio, a place to write, and a little playground.
date: "2026-06-18"
updated: "2026-06-18"
tags:
  - infrastructure
  - vps
  - docker
  - caddy
  - astro
ogImage: /og/articles/about-this-website.png
---

This website is intentionally minimal. It is a personal portfolio, a place to write, and a small playground for experiments and side projects.

The stack is intentionally simple as well: everything lives in a monorepo, runs on a small VPS, and is deployed with Docker Compose behind Caddy.

## Architecture

At a high level, the setup consists of:

* An Astro application
* A GitHub monorepo
* A small Hetzner VPS
* Docker Compose for deployment
* Caddy as a reverse proxy

Nothing here is particularly novel. The goal is to keep the system understandable and easy to maintain.

## The Monorepo

The website lives in a GitHub monorepo under `apps/bugraaydingoz-web`.

I like keeping personal projects in a monorepo because it gives me one place for site code, scripts, tests, infrastructure, and future experiments. If I build additional tools or small applications later, they can live alongside the website without introducing unnecessary complexity.

Right now the repo is organized around deployable apps and shared infrastructure:

```txt
apps/
  bugraaydingoz-web/
  myanaesthesie-web/
infra/
  docker-compose.yml
  Caddyfile
  *.Dockerfile
```

The root workspace uses `pnpm` to discover apps through `apps/*`. Each app can keep its own framework, scripts, tests, and deployment needs, while the root keeps shared commands for formatting, linting, building, and testing.

That shape is intentional. I do not want this repository to be only a portfolio forever. I want it to become a small multi-language workspace where websites, product experiments, backend services, and infrastructure can live together. TypeScript is the main language today, but Go services or other small tools should fit naturally later.

## Astro

The application itself is built with Astro.

Articles are plain Markdown files with frontmatter metadata. The site uses that metadata to generate article pages, SEO tags, Open Graph images, RSS feeds, and the sitemap.

```md
---
title: About this website
description: Notes on the monorepo, Astro app, Docker Compose setup, Caddy, SEO, Lighthouse, and small interactive details behind this portfolio.
date: "2026-06-18"
tags:
  - infrastructure
  - vps
  - docker
---
```

The nice thing about this approach is that publishing a new article is usually just a matter of adding a Markdown file. The rest of the site can infer what it needs automatically.

Astro is a good fit for this site because most pages are content-first and mostly static. I get fast HTML by default, Markdown support without ceremony, and the option to add small interactive islands only where they make sense.

That last part matters. The home page has a small Figma-inspired interaction, but the article pages should stay quiet and readable. Astro lets those two ideas coexist without turning the whole site into a client-side app.

## Infrastructure

The entire monorepo runs on a small Hetzner VPS.

For a project of this size, Docker Compose is more than enough. It keeps deployment simple while still providing isolated services and reproducible builds.

Caddy sits at the edge and handles HTTPS certificates, redirects, and reverse proxying with very little configuration.

A simplified version of the setup looks like this:

```yaml
services:
  web:
    build:
      context: .
      dockerfile: apps/bugraaydingoz-web/Dockerfile
    restart: unless-stopped

  caddy:
    image: caddy:2
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config

volumes:
  caddy_data:
  caddy_config:
```

And the Caddyfile remains pleasantly small:

```txt
bugraaydingoz.com {
  reverse_proxy web:4321
}
```

If the project ever grows, I can always introduce tools such as k3s or another orchestration layer later. For now, that would be unnecessary complexity.

## Testing

The repo uses a small set of checks:

* `oxlint` for fast linting across the workspace
* `oxfmt` for formatting
* Vitest for unit and component tests
* Playwright for end-to-end tests
* Lighthouse CI for performance and SEO checks

At the root, the commands are workspace-oriented:

```sh
pnpm lint
pnpm format:check
pnpm build
pnpm test
```

For this website specifically, the test command runs unit tests, Lighthouse, and Playwright:

```sh
pnpm --filter bugraaydingoz-web test
```

There is no sophisticated testing strategy yet, but these checks are enough for the current shape of the site. The useful thing is that the habit is already there: every app can define the checks it needs, and the root can run them consistently.

## Why self-host?

For personal projects, I often prefer renting a small VPS over deploying directly to platforms like Vercel or Netlify.

Managed platforms are excellent products, but running your own server teaches you things that hosted platforms intentionally abstract away: DNS, reverse proxies, containers, deployment pipelines, SSH access, firewalls, and system administration.

You do not need those skills to launch a website, but learning them has been valuable for me.

I'm intentionally skipping the server setup details in this article. DNS configuration, SSH hardening, Docker installation, firewall rules, and deployment permissions deserve a dedicated guide of their own.

## What's next?

There is still plenty to do.

I want to add:

* A proper deployment pipeline
* Basic analytics
* Better Open Graph image generation
* More interactive elements
* A detailed VPS setup guide

And perhaps a few more easter eggs.

By the way, have you found the one on the home page yet?
