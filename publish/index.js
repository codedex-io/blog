import firebaseAdmin from "firebase-admin";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkPresetLintConsistent from "remark-preset-lint-consistent";
import remarkPresetLintRecommended from "remark-preset-lint-recommended";
import rehypeExternalLinks from "rehype-external-links";
import remarkBreaks from "remark-breaks";

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert({
    type: "service_account",
    project_id: "codedex-io",
    private_key_id: process.env.private_key_id,
    private_key: process.env.private_key,
    client_email: process.env.client_email,
    client_id: process.env.client_id,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.client_cert_url,
  }),
});

const firestore = firebaseAdmin.firestore();

function getBlogsFileNames() {
  return fs.readdirSync(path.resolve(process.cwd(), "blogs"));
}

async function main() {
  const blogFileNames = getBlogsFileNames();
  console.log(blogFileNames);
  for (let filename of blogFileNames) {
    const fileNameWithoutExtension = filename.split(".")[0];
    const blogExists = (await firestore.collection("blogs").doc(fileNameWithoutExtension).get())
      .exists;
    const blog = fs.readFileSync(path.resolve(process.cwd(), "blogs", filename), "utf-8");

    const blogMatter = matter(blog);
    const source = await serialize(blog, {
      mdxOptions: {
        remarkPlugins: [
          remarkPresetLintConsistent,
          remarkPresetLintRecommended,
          remarkBreaks,
          remarkGfm,
        ],
        rehypePlugins: [rehypeSlug, rehypeHighlight, rehypeExternalLinks],
      },
    });
    if (!blogExists) {
      await firestore
        .collection("blogs")
        .doc(fileNameWithoutExtension)
        .set(
          {
            source,
            content: blogMatter.content,
            ...blogMatter.data,
            dateCreated: blogMatter.data.dateCreated.toUTCString(),
            dateUpdated: new Date().toUTCString(),
            likes: 0,
          },
          { merge: true }
        );
    } else {
      await firestore
        .collection("blogs")
        .doc(fileNameWithoutExtension)
        .set(
          {
            source,
            content: blogMatter.content,
            ...blogMatter.data,
            dateCreated: blogMatter.data.dateCreated.toUTCString(),
            dateUpdated: new Date().toUTCString(),
          },
          { merge: true }
        );
    }
  }
}

main();
