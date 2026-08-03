# 📰 Codédex Blog

This repository contains all the Codédex blog posts.

www.codedex.io/blog

## Structure

Each blog post lives in its own directory, grouped by year:

```text
blogs/
└── <year>/
    └── <blog-slug>/
        └── <blog-slug>.mdx
```

To add a new blog, create `blogs/<year>/<blog-slug>/<blog-slug>.mdx`. The
`.mdx` filename becomes the blog's URL slug (`codedex.io/blog/<blog-slug>`),
so it must be unique across all years. Assets for a post (images, GIFs) can
live alongside the `.mdx` file in the same directory.

Merging to `main` publishes every blog to Firestore and Meilisearch via
`.github/workflows/publish.yaml` (`npm run publish`).

The supported tags in the frontmatter for the blogs are:

- `News`
- `Product`
- `Events`
- `Community`
- `Changelog`
- `Boba Talk`
- `Partnerships`
- `Resources`
- `Challenges` (try not to use anymore, this is when we did Monthly Challenges in blogs)

Blog header images should be 1,600 x 900 px.
