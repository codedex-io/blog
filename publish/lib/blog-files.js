import fs from "fs";
import path from "path";

// Blogs are organized as blogs/<year>/<blog-slug>/<blog-slug>.mdx, with each
// blog in its own directory so assets can live alongside the .mdx file.
// Loose .mdx files directly inside a year directory are still picked up so a
// stray flat file is never silently skipped.
export function getBlogsFileNames() {
  const blogsDir = path.resolve(process.cwd(), "blogs");

  return fs
    .readdirSync(blogsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .flatMap((yearDirent) => {
      const yearDir = path.join(blogsDir, yearDirent.name);

      return fs
        .readdirSync(yearDir, { withFileTypes: true })
        .flatMap((entry) => {
          if (entry.isFile() && entry.name.endsWith(".mdx")) {
            return [path.join(yearDirent.name, entry.name)];
          }

          if (entry.isDirectory()) {
            const blogDir = path.join(yearDir, entry.name);
            const mdxFile = fs
              .readdirSync(blogDir)
              .find((file) => file.endsWith(".mdx"));

            if (!mdxFile) {
              console.warn(
                `No .mdx file found in blogs/${yearDirent.name}/${entry.name}, skipping`,
              );
              return [];
            }

            return [path.join(yearDirent.name, entry.name, mdxFile)];
          }

          return [];
        });
    });
}
