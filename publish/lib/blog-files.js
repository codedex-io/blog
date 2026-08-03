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
            const files = fs.readdirSync(blogDir);

            // The .mdx filename becomes the Firestore doc ID, so it must
            // match the directory slug exactly — publishing a stray file
            // under a wrong ID could overwrite an unrelated blog.
            const expectedMdxFile = `${entry.name}.mdx`;
            if (!files.includes(expectedMdxFile)) {
              console.warn(
                `No ${expectedMdxFile} found in blogs/${yearDirent.name}/${entry.name}, skipping`,
              );
              return [];
            }

            const extraMdxFiles = files.filter(
              (file) => file.endsWith(".mdx") && file !== expectedMdxFile,
            );
            if (extraMdxFiles.length > 0) {
              console.warn(
                `Ignoring extra .mdx files in blogs/${yearDirent.name}/${entry.name}: ${extraMdxFiles.join(", ")}`,
              );
            }

            return [path.join(yearDirent.name, entry.name, expectedMdxFile)];
          }

          return [];
        });
    });
}
