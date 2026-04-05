import React from "react";
import { Services } from "@/types/services";
import Image from "next/image";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";

const SingleServices = ({ feature }: { feature: Services }) => {
  const { image, title, description } = feature;

  return (
    <ScrollReveal
      duration={0.5}
      delay={0.3}
      margin="-100px"
      className="animate_top cursor-pointer rounded-lg bg-white p-4 pb-9 shadow-solid-8 hover:shadow-lg dark:bg-blacksection"
    >
      <div className="relative block aspect-[368/239] overflow-hidden rounded">
        <Image
          src={image}
          alt={title}
          fill
          priority={false}
          loading="lazy"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="rounded-lg object-cover transition-transform duration-300 hover:scale-105"
          quality={80}
        />
      </div>

      <div className="">
        <h3 className="my-2 text-lg font-medium text-black dark:text-white">
          {title}
        </h3>
        <p className="text-body-color text-base">{description}</p>
      </div>
    </ScrollReveal>
  );
};

export default SingleServices;
