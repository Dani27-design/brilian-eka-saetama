import React from "react";
import Image from "next/image";
import { Brand } from "@/types/brand";
import { motion } from "framer-motion";

const SingleCard = ({ brand }: { brand: Brand }) => {
  const { image, href, name, imageLight, id } = brand;

  return (
    <div className="flex h-[170px] w-[120px] flex-col items-center justify-start gap-2">
      <motion.a
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
        transition={{ duration: 1, delay: id }}
        viewport={{ once: true }}
        href={href}
        className="flex h-[120px] w-[98px] items-center justify-center overflow-hidden rounded-lg"
      >
        <div className="relative h-full w-full rounded-lg shadow-lg">
          <Image
            className="rounded-lg opacity-50 shadow-lg transition-all duration-300 hover:opacity-100"
            src={image}
            alt={name}
            fill
            sizes="98px"
            style={{ objectFit: "cover", objectPosition: "center" }}
            priority={true}
            quality={80}
            loading="eager"
          />
        </div>
      </motion.a>
      <div className="mt-2 h-[40px] w-full overflow-hidden text-center">
        <p className="mx-auto line-clamp-2 max-w-full whitespace-normal px-1 text-sm leading-tight">
          {name}
        </p>
      </div>
    </div>
  );
};

export default SingleCard;
