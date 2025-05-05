import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkPresetLintConsistent from "remark-preset-lint-consistent";
import remarkPresetLintRecommended from "remark-preset-lint-recommended";
import rehypeExternalLinks from "rehype-external-links";
import remarkBreaks from "remark-breaks";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeAutoLinkHeadings from "rehype-autolink-headings";
import rehypeRewrite from "rehype-rewrite";
import { h } from "hastscript";
import { getSolutionArray } from "./parseGHLink.js";
import { serializeMdx } from "./serializeMdx.js";

export async function parseMarkdown({ markdown }) {
  const { content, data } = matter(markdown);

  const source = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [remarkMath, remarkPresetLintRecommended, remarkBreaks, remarkGfm, remarkPresetLintConsistent],
      rehypePlugins: [
        rehypeSlug,
        [rehypeHighlight, { aliases: { markdown: ["output", "terminal"] } }],
        [rehypeExternalLinks, { target: "_blank", rel: ["nofollow", "noreferrer", "noopener"] }],
        rehypeKatex,
        [
          rehypeRewrite,
          {
            rewrite(node, index, parent) {
              if (node.tagName === "h2" || node.tagName === "h3" || node.tagName === "h4") {
                node.children[0].value = " " + node.children[0].value;
              }
              if (node.tagName === "table") {
                const tableContainer = h("div", { class: "table-container" }, [node]);
                parent.children.splice(index, 1, tableContainer);
              }
            },
          },
        ],
        [
          rehypeAutoLinkHeadings,
          {
            behavior: "prepend",
            content(node) {
              const { tagName } = node;
              if (tagName === "h1") {
                return h("span", "");
              } else if (tagName === "h2") {
                return h("span", "#");
              } else if (tagName === "h3") {
                return h("span", "##");
              } else if (tagName === "h4") {
                return h("span", "###");
              } else if (tagName === "h5") {
                return h("span", "");
              } else if (tagName === "h6") {
                return h("span", "");
              }
            },
          },
        ],
      ],
    },
  });

  return { source, content, data };
}

