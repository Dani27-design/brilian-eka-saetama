import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  // Top: 0 takes us all the way back to the top of the page
  // Behavior: smooth keeps it smooth!
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    // Reset hashUrl dengan eksplisit mengatur menjadi string kosong
    window.history.pushState({}, "", "/");

    // Buat custom event untuk memberitahu komponen Header
    const customEvent = new CustomEvent("resetHashUrl", {
      detail: { hash: "" },
    });
    window.dispatchEvent(customEvent);

    // Juga trigger standard events untuk keamanan
    const hashChangeEvent = new Event("hashchange", { bubbles: true });
    window.dispatchEvent(hashChangeEvent);

    const popStateEvent = new Event("popstate", { bubbles: true });
    window.dispatchEvent(popStateEvent);
  };

  useEffect(() => {
    // Button is displayed after scrolling for 500 pixels
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-[99]">
      {isVisible && (
        <div
          onClick={scrollToTop}
          aria-label="scroll to top"
          className="hover:shadow-signUp flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl bg-primary text-white shadow-md transition duration-300 ease-in-out hover:bg-opacity-80"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 36 36"
          >
            <path
              fill="#fff"
              d="M25.711 10.867L18.779.652c-.602-.885-1.558-.867-2.127.037l-6.39 10.141c-.569.904-.181 1.644.865 1.644H13V16a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-3.525h1.898c1.047 0 1.414-.723.813-1.608zM3.651 23.575H1.438c-.975 0-1.381-.712-1.381-1.401c0-.71.508-1.399 1.381-1.399h7.469c.874 0 1.381.689 1.381 1.399c0 .69-.406 1.401-1.381 1.401H6.696v10.189c0 1.016-.649 1.584-1.522 1.584s-1.522-.568-1.522-1.584V23.575zM10.396 28c0-4.222 2.841-7.471 6.982-7.471c4.079 0 6.983 3.351 6.983 7.471c0 4.201-2.821 7.471-6.983 7.471c-4.121 0-6.982-3.27-6.982-7.471zm10.798 0c0-2.456-1.279-4.67-3.816-4.67s-3.816 2.214-3.816 4.67c0 2.476 1.239 4.668 3.816 4.668c2.578 0 3.816-2.192 3.816-4.668zm4.433-5.644c0-.954.569-1.582 1.585-1.582h3.591c2.985 0 5.197 1.947 5.197 4.851c0 2.963-2.293 4.811-5.074 4.811h-2.253v3.329c0 1.016-.649 1.584-1.521 1.584c-.874 0-1.524-.568-1.524-1.584V22.356zm3.046 5.4h2.071c1.277 0 2.089-.934 2.089-2.151c0-1.219-.812-2.152-2.089-2.152h-2.071v4.303z"
            />
          </svg>
          {/* <span className="mt-[6px] h-3 w-3 rotate-45 border-l border-t border-white"></span> */}
          <span className="sr-only">scroll to top</span>
        </div>
      )}
    </div>
  );
}
