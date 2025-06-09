import { FC } from "react";

interface SharePostProps {
  title?: string;
  slug?: string;
}

const SharePost: FC<SharePostProps> = ({ title = "", slug = "" }) => {
  // Create share URLs
  const shareUrl = `https://brilian-eka-saetama.vercel.app/blog/blog-details/${slug}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const whatsAppShareUrl = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
  const instagramShareUrl = `https://www.instagram.com/`;

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        alert("URL copied to clipboard!");
      })
      .catch((err) => {
        alert(`Failed to copy: ${err}`);
      });
  };

  return (
    <>
      <div className="mt-11 flex flex-wrap gap-4 md:items-center md:justify-between md:gap-0">
        <ul className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
          <li className="flex items-center">
            <p className="text-black dark:text-white">Share On:</p>
          </li>
          <li className="flex items-center justify-center">
            <a
              href={facebookShareUrl}
              aria-label="Share on Facebook"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg
                className="fill-[#D1D8E0] transition-all duration-300 hover:fill-primary"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_48_1499)">
                  <path
                    d="M14 13.5H16.5L17.5 9.5H14V7.5C14 6.47 14 5.5 16 5.5H17.5V2.14C17.174 2.097 15.943 2 14.643 2C11.928 2 10 3.657 10 6.7V9.5H7V13.5H10V22H14V13.5Z"
                    fill=""
                  />
                </g>
                <defs>
                  <clipPath id="clip0_48_1499">
                    <rect width="24" height="24" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </a>
          </li>
          <li className="flex items-center justify-center">
            <a
              href={twitterShareUrl}
              aria-label="Share on Twitter"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg
                className="fill-[#D1D8E0] transition-all duration-300 hover:fill-primary"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_48_1502)">
                  <path
                    d="M22.162 5.65593C21.3985 5.99362 20.589 6.2154 19.76 6.31393C20.6337 5.79136 21.2877 4.96894 21.6 3.99993C20.78 4.48793 19.881 4.82993 18.944 5.01493C18.3146 4.34151 17.4803 3.89489 16.5709 3.74451C15.6615 3.59413 14.7279 3.74842 13.9153 4.18338C13.1026 4.61834 12.4564 5.30961 12.0771 6.14972C11.6978 6.98983 11.6067 7.93171 11.818 8.82893C10.1551 8.74558 8.52832 8.31345 7.04328 7.56059C5.55823 6.80773 4.24812 5.75098 3.19799 4.45893C2.82628 5.09738 2.63095 5.82315 2.63199 6.56193C2.63199 8.01193 3.36999 9.29293 4.49199 10.0429C3.828 10.022 3.17862 9.84271 2.59799 9.51993V9.57193C2.59819 10.5376 2.93236 11.4735 3.54384 12.221C4.15532 12.9684 5.00647 13.4814 5.95299 13.6729C5.33661 13.84 4.6903 13.8646 4.06299 13.7449C4.32986 14.5762 4.85 15.3031 5.55058 15.824C6.25117 16.345 7.09712 16.6337 7.96999 16.6499C7.10247 17.3313 6.10917 17.8349 5.04687 18.1321C3.98458 18.4293 2.87412 18.5142 1.77899 18.3819C3.69069 19.6114 5.91609 20.2641 8.18899 20.2619C15.882 20.2619 20.089 13.8889 20.089 8.36193C20.089 8.18193 20.084 7.99993 20.076 7.82193C20.8949 7.2301 21.6016 6.49695 22.163 5.65693L22.162 5.65593Z"
                    fill=""
                  />
                </g>
                <defs>
                  <clipPath id="clip0_48_1502">
                    <rect width="24" height="24" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </a>
          </li>
          <li className="flex items-center justify-center">
            <a
              href={linkedInShareUrl}
              aria-label="Share on LinkedIn"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg
                className="fill-[#D1D8E0] transition-all duration-300 hover:fill-primary"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_48_1505)">
                  <path
                    d="M6.94 5.00002C6.93974 5.53046 6.72877 6.03906 6.35351 6.41394C5.97825 6.78883 5.46944 6.99929 4.939 6.99902C4.40857 6.99876 3.89997 6.78779 3.52508 6.41253C3.1502 6.03727 2.93974 5.52846 2.94 4.99802C2.94027 4.46759 3.15124 3.95899 3.5265 3.5841C3.90176 3.20922 4.41057 2.99876 4.941 2.99902C5.47144 2.99929 5.98004 3.21026 6.35492 3.58552C6.72981 3.96078 6.94027 4.46959 6.94 5.00002ZM7 8.48002H3V21H7V8.48002ZM13.32 8.48002H9.34V21H13.28V14.43C13.28 10.77 18.05 10.43 18.05 14.43V21H22V13.07C22 6.90002 14.94 7.13002 13.28 10.16L13.32 8.48002Z"
                    fill=""
                  />
                </g>
                <defs>
                  <clipPath id="clip0_48_1505">
                    <rect width="24" height="24" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </a>
          </li>
          <li className="flex items-center justify-center">
            <a
              href={whatsAppShareUrl}
              aria-label="Share on WhatsApp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="none"
                className="fill-[#D1D8E0] transition-all duration-300 hover:fill-primary"
                viewBox="0 0 24 24"
              >
                <path d="M20.52 3.48A11.88 11.88 0 0 0 12 0C5.37 0 0 5.37 0 12a11.94 11.94 0 0 0 1.6 5.9L0 24l6.3-1.65a11.86 11.86 0 0 0 5.7 1.44c6.63 0 12-5.37 12-12a11.88 11.88 0 0 0-3.48-8.52zM12 21.5a9.58 9.58 0 0 1-4.88-1.32l-.35-.21-3.73.98 1-3.64-.23-.38A9.56 9.56 0 0 1 2.5 12c0-5.25 4.25-9.5 9.5-9.5s9.5 4.25 9.5 9.5-4.25 9.5-9.5 9.5zm5.27-7.58c-.29-.14-1.71-.84-1.97-.93-.26-.1-.45-.14-.64.15-.19.29-.74.93-.91 1.12-.17.2-.34.22-.63.07-.29-.14-1.22-.45-2.33-1.43-.86-.76-1.44-1.7-1.6-1.99-.17-.29-.02-.45.13-.6.13-.13.29-.34.43-.5.14-.17.19-.29.29-.48.1-.2.05-.37-.02-.51-.07-.14-.64-1.55-.88-2.12-.23-.56-.47-.48-.64-.49h-.54c-.17 0-.45.07-.69.34s-.9.88-.9 2.15.92 2.5 1.05 2.67c.14.17 1.81 2.77 4.4 3.89.62.27 1.1.43 1.48.55.62.2 1.18.17 1.63.1.5-.07 1.53-.63 1.75-1.24.22-.6.22-1.13.15-1.24-.07-.1-.26-.17-.55-.3z" />
              </svg>
            </a>
          </li>
          <li className="flex items-center justify-center">
            <a
              href={instagramShareUrl}
              aria-label="Share on Instagram"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg
                className="fill-[#D1D8E0] transition-all duration-300 hover:fill-primary"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
                  fill=""
                />
              </svg>
            </a>
          </li>
          <li className="flex items-center justify-center">
            <button
              onClick={copyToClipboard}
              aria-label="Copy URL"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg
                className="fill-[#D1D8E0] transition-all duration-300 hover:fill-primary"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z"
                  fill=""
                />
              </svg>
            </button>
          </li>
        </ul>

        {/* <ul className="flex items-center gap-4">
          <li>
            <p className="text-black dark:text-white">Tags:</p>
          </li>
          <li>
            <a
              href="#"
              className="pr-2 duration-300 ease-in-out hover:text-primary"
            >
              #business
            </a>

            <a
              href="/tags/saas"
              className="duration-300 ease-in-out hover:text-primary"
            >
              #saas
            </a>
          </li>
        </ul> */}
      </div>
    </>
  );
};

export default SharePost;
