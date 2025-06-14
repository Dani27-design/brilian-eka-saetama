import { cookies } from "next/headers";
import { adminFirestore } from "@/db/firebase/firebaseAdmin";
import ClientBlog from "./ClientBlog";
import type { Blog } from "@/types/blog";

// Interface for blog data from server
interface BlogServerData {
  blog_title: string;
  blog_subtitle: string;
  blog_description: string;
  blogs: Blog[];
}

// Default values for fallback
const fallbackBlogData: BlogServerData = {
  blog_title: "NEWS & BLOGS",
  blog_subtitle: "Latest News & Blogs",
  blog_description:
    "Stay updated with the latest insights and developments in fire safety, industry trends, and our services.",
  blogs: [],
};

// Function to fetch blog data from Firestore Admin
async function getBlogData(language: string): Promise<BlogServerData> {
  if (!adminFirestore) {
    console.error("Admin Firestore is not available");
    return fallbackBlogData;
  }

  try {
    // Create object to store all blog data
    const blogData: BlogServerData = { ...fallbackBlogData };

    // Fetch the title, subtitle, and description
    const fields = ["blog_title", "blog_subtitle", "blog_description"];

    const fetchPromises = fields.map(async (field) => {
      try {
        if (!adminFirestore) {
          console.error("Admin Firestore is not available");
          return;
        }

        const docSnapshot = await adminFirestore
          .collection("blog")
          .doc(field)
          .get();

        if (docSnapshot.exists) {
          const data = docSnapshot.data();
          if (data && data[language]) {
            blogData[field] = data[language];
          }
        }
      } catch (error) {
        console.error(`Error fetching ${field}:`, error);
      }
    });

    // Fetch the blog posts
    try {
      const blogsSnapshot = await adminFirestore
        .collection("blog")
        .doc("blogs")
        .get();

      if (blogsSnapshot.exists) {
        const data = blogsSnapshot.data();
        if (data && data[language]) {
          blogData.blogs = data[language];
        }
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    }

    // Wait for all fetch operations to complete
    await Promise.all(fetchPromises);
    console.log("Blog data fetched from server:", blogData);
    return blogData;
  } catch (error) {
    console.error("Error fetching blog data:", error);
    return fallbackBlogData;
  }
}

export default async function ServerBlog() {
  // Get language from cookies
  const cookieStore = cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "id";

  try {
    // Fetch data from Firestore Admin
    const blogData = await getBlogData(locale);

    // Pass data to client component
    return <ClientBlog initialData={blogData} initialLanguage={locale} />;
  } catch (error) {
    console.error("Error in ServerBlog:", error);
    return (
      <ClientBlog initialData={fallbackBlogData} initialLanguage={locale} />
    );
  }
}
