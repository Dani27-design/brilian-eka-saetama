// Simple README for sitemap generator usage

# Sitemap Generator for Next.js

1. Jalankan endpoint `/api/sitemap/generate` (GET) untuk membuat file sitemap XML di `public/sitemaps/sitemap.xml`.
2. Submit `/sitemaps/sitemap.xml` ke Google Search Console.
3. Sitemap akan berisi semua URL blog dan halaman utama.

Jika ingin otomatisasi, jalankan endpoint ini secara berkala (misal via cron job atau manual setelah update konten).
