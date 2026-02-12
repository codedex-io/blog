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
import { visit } from "unist-util-visit";

/**
 * Rehype plugin that converts string `style` properties to objects in HAST nodes.
 * Required because rehype-katex (and other plugins) generate HAST nodes with CSS
 * string styles, but MDX v3's hast-util-to-jsx-runtime expects style objects.
 */
function rehypeStringifyStyles() {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.properties?.style && typeof node.properties.style === "string") {
        const styleObj = {};
        node.properties.style
          .split(";")
          .filter((s) => s.trim())
          .forEach((declaration) => {
            const colonIndex = declaration.indexOf(":");
            if (colonIndex === -1) return;
            const prop = declaration.slice(0, colonIndex).trim();
            const value = declaration.slice(colonIndex + 1).trim();
            // Convert CSS property to camelCase (e.g., font-size -> fontSize)
            const camelProp = prop.replace(/-([a-z])/g, (_, c) =>
              c.toUpperCase(),
            );
            styleObj[camelProp] = value;
          });
        node.properties.style = styleObj;
      }
    });
  };
}

export async function parseMarkdown({ markdown }) {
  const { content, data } = matter(markdown);

  const source = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [
        remarkMath,
        remarkGfm,
        remarkBreaks,
        remarkPresetLintRecommended,
        remarkPresetLintConsistent,
      ],
      rehypePlugins: [
        [rehypeHighlight, { aliases: { markdown: ["output", "terminal"] } }],
        rehypeSlug,
        [
          rehypeExternalLinks,
          { target: "_blank", rel: ["nofollow", "noreferrer", "noopener"] },
        ],
        [
          rehypeRewrite,
          {
            rewrite(node, index, parent) {
              if (
                node.tagName === "h2" ||
                node.tagName === "h3" ||
                node.tagName === "h4"
              ) {
                if (node.children && node.children[0]) {
                  node.children[0].value = " " + node.children[0].value;
                }
              }
              if (node.tagName === "table") {
                const tableContainer = h("div", { class: "table-container" }, [
                  node,
                ]);
                parent.children.splice(index, 1, tableContainer);
              }
            },
          },
        ],
        [rehypeKatex, { throwOnError: true, strict: true }],
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
        rehypeStringifyStyles,
      ],
      format: "mdx",
    },
  });

  return { source, content, data };
}
