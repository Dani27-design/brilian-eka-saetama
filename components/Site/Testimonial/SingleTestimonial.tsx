import { Testimonial } from "@/types/testimonial";
import Image from "next/image";

const SingleTestimonial = ({ review }: { review: Testimonial }) => {
  const { name, designation, imageUrl, content } = review;
  return (
    <div className="rounded-lg bg-white p-9 pt-7.5 shadow-solid-9 dark:border dark:border-strokedark dark:bg-blacksection dark:shadow-none">
      <div className="mb-7.5 flex items-center justify-between border-b border-stroke pb-6 dark:border-strokedark">
        <div>
          <h3 className="mb-1.5 text-metatitle3 text-black dark:text-white">
            {name}
          </h3>
          <p>{designation}</p>
        </div>
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-primary/20 shadow-md">
          <Image
            width={64}
            height={64}
            src={imageUrl}
            alt={name}
            priority={true}
            quality={80}
            loading="eager"
            className="h-full w-full object-cover"
            style={{
              borderRadius: "50%",
            }}
          />
        </div>
      </div>

      <p>{content}</p>
    </div>
  );
};

export default SingleTestimonial;
