import fs from "fs";
import matter from "gray-matter";

async function sortBlogsPerYearIntoDirectories() {
  const blogsDir = "./blogs";
  const files = fs
    .readdirSync(blogsDir, {})
    .filter((file) => file.endsWith(".mdx"));

  files.forEach((file) => {
    if (file.endsWith(".mdx")) {
      const filePath = `${blogsDir}/${file}`;
      const markdown = fs.readFileSync(filePath, "utf-8");
      const { content, data } = matter(markdown);

      const newDir = `${blogsDir}/${data.dateCreated.getFullYear()}`;
      if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir);
      }
      const newFilePath = `${newDir}/${file}`;
      fs.renameSync(filePath, newFilePath);
      console.log(`Moved ${file} to ${newFilePath}/`);
    } else {
      console.warn(`No valid date found in ${file}`);
    }
  });
}

sortBlogsPerYearIntoDirectories();
