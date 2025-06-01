import { useTheme } from "next-themes";
import Image from "next/image";

interface ThemeTogglerProps {
  disabled?: boolean;
}

const ThemeToggler = ({ disabled = false }: ThemeTogglerProps) => {
  const { theme, setTheme } = useTheme();

  return (
    <button
      aria-label="theme toggler"
      onClick={() => !disabled && setTheme(theme === "dark" ? "light" : "dark")}
      disabled={disabled}
      className={`bg-gray-2 dark:bg-dark-bg absolute right-17 mr-1.5 flex cursor-pointer items-center justify-center rounded-full text-black dark:text-white lg:static ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
    >
      <Image
        src="/images/icon/icon-moon.svg"
        alt="logo"
        width={21}
        height={21}
        className="dark:hidden"
        priority={true} // For above-the-fold images
        quality={80} // Balance between quality and size
        loading="eager" // For critical images
      />

      <Image
        src="/images/icon/icon-sun.svg"
        alt="logo"
        width={22}
        height={22}
        className="hidden dark:block"
        priority={true} // For above-the-fold images
        quality={80} // Balance between quality and size
        loading="eager" // For critical images
      />
    </button>
  );
};

export default ThemeToggler;
