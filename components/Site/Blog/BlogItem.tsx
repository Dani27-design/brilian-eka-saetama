"use client";
import { Blog } from "@/types/blog";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const BlogItem = ({ blog }: { blog: Blog }) => {
  const { mainImage, title, metadata, slug, publishDate } = blog;
  const blogUrl = `/blog/blog-details/${slug || ""}`;

  return (
    <Link href={blogUrl} className="block">
      <motion.div
        variants={{
          hidden: {
            opacity: 0,
            y: -20,
          },
          visible: {
            opacity: 1,
            y: 0,
          },
        }}
        initial="hidden"
        whileInView="visible"
        transition={{ duration: 0.5, delay: 0.3 }}
        viewport={{ once: true, margin: "-100px" }}
        className="animate_top cursor-pointer rounded-lg bg-white p-4 pb-9 shadow-solid-8 hover:shadow-lg dark:bg-blacksection"
      >
        <div className="relative block aspect-[368/239] overflow-hidden rounded">
          <Image
            src={mainImage}
            alt={title}
            fill
            priority={false}
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 hover:scale-105"
            quality={80}
          />
        </div>

        <div className="">
          {publishDate && (
            <span className="text-body-color mt-5 inline-block text-sm font-medium">
              {new Date(publishDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
          <h3 className="mb-3.5 mt-3.5 line-clamp-3 text-lg font-medium text-black dark:text-white">
            {title}
          </h3>
          <p className="text-body-color line-clamp-3 text-base">{metadata}</p>
        </div>
      </motion.div>
    </Link>
  );
};

export default BlogItem;
