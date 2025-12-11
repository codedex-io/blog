import fs from "fs";
import path from "path";

import { firestore } from "./lib/firebase.js";
import { client } from "./lib/meilisearch.js";
import { parseMarkdown } from "./parsers/mdx-parser.js";

function getBlogsFileNames() {
  return fs
    .readdirSync(path.resolve(process.cwd(), "blogs"), { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .flatMap((dirent) => {
      const yearDir = path.resolve(process.cwd(), "blogs", dirent.name);
      return fs
        .readdirSync(yearDir)
        .filter((file) => file.endsWith(".mdx"))
        .map((file) => path.join(dirent.name, file));
    });
}

function getBlogFileContent(filename) {
  return fs.readFileSync(
    path.resolve(process.cwd(), "blogs", filename),
    "utf-8",
  );
}

async function main() {
  const blogFileNames = getBlogsFileNames();

  for (let filename of blogFileNames) {
    try {
      const fileNameWithoutExtension = filename.split(".")[0].split("/").pop();
      const blogExists = (
        await firestore.collection("blogs").doc(fileNameWithoutExtension).get()
      ).exists;

      const blog = getBlogFileContent(filename);

      const { source, content, data } = await parseMarkdown({ markdown: blog });

      if (!blogExists) {
        await firestore
          .collection("blogs")
          .doc(fileNameWithoutExtension)
          .set(
            {
              source,
              content: content,
              ...data,
              dateCreated: data.dateCreated.toUTCString(),
              dateUpdated: new Date().toUTCString(),
              likes: 0,
              link: fileNameWithoutExtension,
            },
            { merge: true },
          );
      } else {
        await firestore
          .collection("blogs")
          .doc(fileNameWithoutExtension)
          .set(
            {
              source,
              content: content,
              ...data,
              dateCreated: data.dateCreated.toUTCString(),
              dateUpdated: new Date().toUTCString(),
              link: fileNameWithoutExtension,
            },
            { merge: true },
          );
      }

      try {
        await client.index("blogs").addDocuments([
          {
            id: fileNameWithoutExtension,
            title: data.title,
            description: data.description,
            content,
            author: data.author,
            tags: data?.tags,
            link: fileNameWithoutExtension,
          },
        ]);
      } catch (error) {}
    } catch (error) {
      console.log("Error with file: " + filename);
      console.error(error);
    }
  }
}

main();
