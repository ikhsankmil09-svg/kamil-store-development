# KAMIL STORE

Toko online dengan Next.js (App Router) + Supabase (Auth, Postgres, Storage). Dua role: `admin` dan `user`.

## Fitur

- User: register, login, logout, katalog, pencarian, filter kategori, detail produk, keranjang, checkout, riwayat & status pesanan, profil.
- Admin: dashboard statistik, CRUD produk (termasuk unggah gambar), kategori, pesanan & status, data pengguna & role, laporan penjualan, produk terlaris.

## Keamanan

- Role disimpan di tabel `profiles.role` (database), bukan di frontend.
- Seluruh tabel memakai Row Level Security. Kolom `role` tidak dapat di-UPDATE oleh user (tidak di-GRANT).
- Pesanan dibuat lewat fungsi database `create_order` (harga & stok divalidasi server, transaksi atomik).
- `/admin/*` dijaga di proxy (cek sesi) dan di server layout (cek role dari database). User biasa dialihkan ke `/`.
- Service-role key TIDAK dipakai di aplikasi ini.
- Akun pertama yang mendaftar otomatis menjadi Admin (ditentukan trigger database). Setelah itu semua akun baru = user.

## Setup lokal

1. `pnpm install`
2. Buat proyek Supabase, lalu jalankan SQL di `supabase/migrations/` berurutan (`001_schema_rls.sql`, lalu `003_cart_items.sql`) lewat SQL Editor.
3. Salin `.env.example` menjadi `.env.local` dan isi `NEXT_PUBLIC_SUPABASE_URL` serta `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Di Supabase: Authentication > URL Configuration, tambahkan `http://localhost:3000/auth/callback` dan URL Vercel Anda + `/auth/callback` pada Redirect URLs.
5. `pnpm dev`, lalu daftar akun pertama (otomatis Admin).

## Deploy ke Vercel

1. Push ke GitHub, import repo di Vercel.
2. Tambahkan Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Deploy. Tambahkan domain Vercel ke Redirect URLs Supabase (langkah 4 di atas).

## Uji keamanan RLS

`POSTGRES_URL_NON_POOLING="..." node scripts/test-rls.mjs` menjalankan 58 pengecekan (user vs admin vs anon) dalam transaksi yang selalu di-rollback.
