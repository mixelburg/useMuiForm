# useMuiForm Documentation

This is the Fumadocs-based documentation site for useMuiForm.

## Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building

Build the documentation:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Structure

- `app/` - Next.js app directory with layouts and pages
- `content/docs/` - MDX documentation files
- `lib/` - Fumadocs source configuration
- `public/` - Static assets

## Adding Documentation

1. Create a new `.mdx` file in `content/docs/`
2. Add frontmatter with `title` and `description`
3. Update the appropriate `meta.json` file to include the new page

Example:

```mdx
---
title: My New Page
description: Description of my new page
---

# My New Page

Content goes here...
```

