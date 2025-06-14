import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Daftar bahasa yang didukung
const locales = ["en", "id"];
const defaultLocale = "id";

// Fungsi untuk mendapatkan bahasa dari request headers
function getLocale(request: NextRequest) {
  // Get preferred language from Accept-Language header
  const acceptLanguage = request.headers.get("accept-language") || "";
  const parsedLanguages = acceptLanguage.split(",").map((lang) => {
    const [language, q = "q=1.0"] = lang.trim().split(";");
    const quality = parseFloat(q.replace("q=", ""));
    return { language, quality };
  });

  // Sort languages by quality
  parsedLanguages.sort((a, b) => b.quality - a.quality);

  // Find first matching language
  const matchedLocale = parsedLanguages.find(({ language }) =>
    locales.some((loc) => language.startsWith(loc)),
  );

  // Return matched language or default
  return matchedLocale ? matchedLocale.language.split("-")[0] : defaultLocale;
}

export function middleware(request: NextRequest) {
  // Skip API routes and static files
  if (
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for existing language cookie
  const cookie = request.cookies.get("NEXT_LOCALE");

  if (!cookie) {
    // Set language cookie based on browser preference if no cookie exists
    const locale = getLocale(request);
    const response = NextResponse.next();
    response.cookies.set("NEXT_LOCALE", locale, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|fonts).*)"],
};
