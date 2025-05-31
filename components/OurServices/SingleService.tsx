import React from "react";
import { Services } from "@/types/services";
import Image from "next/image";
import { motion } from "framer-motion";

const SingleServices = ({ feature }: { feature: Services }) => {
  const { image, title, description } = feature;

  return (
    <motion.div
      variants={{
        hidden: {
          opacity: 0,
          y: -10,
        },
        visible: {
          opacity: 1,
          y: 0,
        },
      }}
      initial="hidden"
      whileInView="visible"
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="animate_top z-40 rounded-lg border border-white bg-white p-7.5 shadow-solid-3 transition-all hover:shadow-solid-4 dark:border-strokedark dark:bg-blacksection dark:hover:bg-hoverdark xl:p-12.5"
    >
      <Image
        src={image}
        alt={title}
        width={600}
        height={600}
        priority={true} // For above-the-fold images
        quality={80} // Balance between quality and size
        loading="eager" // For critical images
      />
      <h3 className="mb-5 mt-7.5 text-xl font-semibold text-black dark:text-white xl:text-itemtitle">
        {title}
      </h3>
      <p>{description}</p>
    </motion.div>
  );
};

export default SingleServices;
