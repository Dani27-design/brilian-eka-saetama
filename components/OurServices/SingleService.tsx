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
      className="animate_top z-40 flex h-full flex-col rounded-lg border border-white bg-white p-7.5 shadow-solid-3 transition-all hover:shadow-solid-4 dark:border-strokedark dark:bg-blacksection dark:hover:bg-hoverdark xl:p-12.5"
    >
      <div className="relative mb-7.5 h-[250px] w-full overflow-hidden sm:h-[250px] md:h-[250px] lg:h-[250px] xl:h-[250px] 2xl:h-[250px]">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={true}
          quality={80}
          style={{
            objectFit: "cover",
            objectPosition: "center",
            width: "100%",
            height: "100%",
          }}
          className="rounded-lg"
        />
      </div>
      <h3 className="mb-5 text-xl font-semibold text-black dark:text-white xl:text-itemtitle">
        {title}
      </h3>
      <p className="flex-grow">{description}</p>
    </motion.div>
  );
};

export default SingleServices;
