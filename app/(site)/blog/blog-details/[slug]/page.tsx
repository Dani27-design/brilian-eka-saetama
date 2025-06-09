import { Metadata, ResolvingMetadata } from "next";
import BlogDetailClient from "./BlogDetailClient";
import { getData } from "@/actions/read/hero";
import { notFound } from "next/navigation";

type Props = {
  params: { slug: string };
};

// Generate dynamic metadata based on the blog post content
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const slug = params.slug;

  const blogsData = await getData("id", "blog", "blogs");
  const blog = blogsData.find((blog) => blog.slug === slug);

  // If blog not found, return default metadata
  if (!blog) {
    return {
      title: "Blog Post Not Found | PT. Brilian Eka Saetama",
    };
  }

  // Generate SEO-optimized metadata
  return {
    title: `${blog.title} | PT. Brilian Eka Saetama`,
    description:
      blog.metadata ||
      "Temukan wawasan ahli seputar sistem keamanan dan keselamatan kebakaran bersama PT. Brilian Eka Saetama, solusi terpercaya untuk perlindungan gedung dan aset Anda.",
    openGraph: {
      title: blog.title,
      description:
        blog.metadata ||
        "Temukan wawasan ahli seputar sistem keamanan dan keselamatan kebakaran bersama PT. Brilian Eka Saetama, solusi terpercaya untuk perlindungan gedung dan aset Anda.",
      url: `https://brilian-eka-saetama.vercel.app/blog/blog-details/${slug}`,
      siteName: "PT. Brilian Eka Saetama Blog",
      type: "article",
      publishedTime: blog.publishDate,
      authors: blog.author ? [blog.author] : ["PT. Brilian Eka Saetama"],
      images: [
        {
          url:
            blog.mainImage ||
            "https://brilian-eka-saetama.vercel.app/images/logo/logo-light.png",
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description:
        blog.metadata ||
        "Temukan wawasan ahli seputar sistem keamanan dan keselamatan kebakaran bersama PT. Brilian Eka Saetama, solusi terpercaya untuk perlindungan gedung dan aset Anda.",
      images: [
        blog.mainImage ||
          "https://brilian-eka-saetama.vercel.app/images/logo/logo-light.png",
      ],
    },
    alternates: {
      canonical: `https://brilian-eka-saetama.vercel.app/blog/blog-details/${slug}`,
    },
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const slug = params.slug;

  // Pre-fetch the blog data for initial render
  const blogsData = await getData("id", "blog", "blogs");
  const initialBlog = blogsData.find((blog) => blog.slug === slug) || null;

  // If blog not found in server component, return 404
  if (!initialBlog) {
    notFound();
  }

  return (
    <>
      {/* Add JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: initialBlog.title,
            image: initialBlog.mainImage,
            datePublished: initialBlog.publishDate,
            dateModified: initialBlog.publishDate,
            author: {
              "@type": "Person",
              name: initialBlog.author || "PT. Brilian Eka Saetama",
            },
            publisher: {
              "@type": "Organization",
              name: "PT. Brilian Eka Saetama",
              logo: {
                "@type": "ImageObject",
                url: "https://brilian-eka-saetama.vercel.app/images/logo/logo-light.png",
              },
            },
            description: initialBlog.metadata,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://brilian-eka-saetama.vercel.app/blog/blog-details/${slug}`,
            },
          }),
        }}
      />
      <BlogDetailClient slug={slug} initialBlog={initialBlog} />
    </>
  );
}
