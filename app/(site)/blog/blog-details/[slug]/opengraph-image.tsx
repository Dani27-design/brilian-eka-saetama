import { ImageResponse } from "next/server";
import { getData } from "@/actions/read/hero";
import type { Blog } from "@/types/blog";

// Route segment config
export const runtime = "edge";

// Image metadata
export const alt = "Blog post";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Image generation
export default async function Image({ params }: { params: { slug: string } }) {
  // Get blog data
  const blogs = await getData("id", "blog", "blogs");
  const blog = blogs?.find((blog: Blog) => blog.slug === params.slug);

  if (!blog) {
    // Default image for fallback
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: "white",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#333",
          }}
        >
          <div>PT. Brilian Eka Saetama</div>
          <div style={{ fontSize: 36, marginTop: 20 }}>Blog Post Not Found</div>
        </div>
      ),
      {
        ...size,
        status: 404,
      },
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: "linear-gradient(to bottom, #0ea5e9, #0c4a6e)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
          color: "white",
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 20 }}>
          PT. Brilian Eka Saetama
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 20,
            maxHeight: 240,
            overflow: "hidden",
          }}
        >
          {blog.title}
        </div>
        <div
          style={{
            fontSize: 24,
            opacity: 0.8,
            maxWidth: "80%",
            textAlign: "center",
            maxHeight: 120,
            overflow: "hidden",
          }}
        >
          {blog.metadata}
        </div>
        {blog.author && (
          <div style={{ fontSize: 24, marginTop: 40 }}>
            By {blog.author} •{" "}
            {blog.publishDate
              ? new Date(blog.publishDate).toLocaleDateString()
              : "Undated"}
          </div>
        )}
      </div>
    ),
    {
      ...size,
    },
  );
}
