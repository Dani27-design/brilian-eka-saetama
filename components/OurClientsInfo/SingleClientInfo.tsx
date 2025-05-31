import React, { useRef, useEffect } from "react";
import Image from "next/image";
import { Brand } from "@/types/brand";
import { motion } from "framer-motion";

const SingleCard = ({ brand }: { brand: Brand }) => {
  const { image, href, name, imageLight, id } = brand;

  return (
    <div className="flex w-fit flex-col items-center">
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
        className="animate_top mx-w-full relative block h-[120px] w-[98px]"
      >
        <Image
          className="opacity-50 transition-all duration-300 hover:opacity-100"
          src={image}
          alt={name}
          fill
          priority={true} // For above-the-fold images
          quality={80} // Balance between quality and size
          loading="eager" // For critical images
        />
      </motion.a>
      <p className="pt-2">{name}</p>
    </div>
  );
};

export default SingleCard;
