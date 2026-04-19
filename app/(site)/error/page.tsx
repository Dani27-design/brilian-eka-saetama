import { Metadata } from "next";
import Image from "next/image";
import PromoSection from "@/components/Site/PromoSection";

export const metadata: Metadata = {
  title: "Halaman Tidak Ditemukan - PT Brilian Eka Saetama",
  description: "Halaman yang Anda cari tidak ditemukan.",
};

const ErrorPage = () => {
  return (
    <section className="overflow-hidden pb-25 pt-45 lg:pb-32.5 lg:pt-50 xl:pb-37.5 xl:pt-55">
      <div className="mx-auto max-w-[600px] px-4">
        <div className="animate_top text-center">
          <Image
            src="/images/shape/404.svg"
            alt="404"
            className="mx-auto mb-7.5"
            width={400}
            height={400}
            priority={true}
            quality={80}
            loading="eager"
          />

          <h2 className="mb-3 text-2xl font-semibold text-black dark:text-white md:text-4xl">
            Halaman Tidak Ditemukan
          </h2>
          <p className="mb-7.5 text-gray-600 dark:text-gray-400">
            Halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau tidak tersedia.
          </p>

          <a
            href="/"
            className="inline-flex items-center gap-2.5 rounded-full bg-black px-6 py-3 font-medium text-white duration-300 ease-in-out hover:bg-blackho dark:bg-btndark dark:hover:bg-blackho"
          >
            Kembali ke Beranda
            <svg
              className="fill-white"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.4767 6.16664L6.00668 1.69664L7.18501 0.518311L13.6667 6.99998L7.18501 13.4816L6.00668 12.3033L10.4767 7.83331H0.333344V6.16664H10.4767Z"
                fill=""
              />
            </svg>
          </a>
        </div>

        {/* Promotion */}
        <PromoSection variant="urgent" className="mt-12" />
      </div>
    </section>
  );
};

export default ErrorPage;
