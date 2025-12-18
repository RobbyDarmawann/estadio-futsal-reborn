# Tutorial Deploy ke Vercel (Gratis)

Vercel adalah platform hosting yang optimal untuk Next.js projects dan **gratis** untuk hobby/personal projects.

---

## Prasyarat

1. **Git repository** — project harus di Git (GitHub, GitLab, atau Bitbucket)
2. **Node.js** — versi 18+ (sudah ada di workspace)
3. **Supabase credentials** — pastikan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` siap

---

## Step 1: Push Project ke GitHub

### 1a. Buat Repository GitHub (jika belum ada)
- Buka https://github.com/new
- Buat repo baru: misal `estadio-futsal-reborn`
- **Jangan** initialize with README (karena project sudah ada)

### 1b. Init Git & Push ke GitHub

```powershell
# Dari folder root project
cd "d:\Proyek RPB\estadio-futsal-reborn"

# Init Git (jika belum)
git init

# Tambah semua files
git add .

# Commit
git commit -m "Initial commit - Estadio Futsal booking system"

# Remote ke GitHub
git remote add origin https://github.com/YOUR_USERNAME/estadio-futsal-reborn.git

# Push ke branch main
git branch -M main
git push -u origin main
```

**Ganti `YOUR_USERNAME`** dengan username GitHub kamu.

---

## Step 2: Pastikan `.env.local` TIDAK di-commit

File `env.local` berisi credentials sensitif. Pastikan sudah di `.gitignore`:

```bash
cat .gitignore | grep -i env
```

Jika belum ada, tambahkan ke `.gitignore`:
```
.env.local
.env*.local
```

---

## Step 3: Daftar & Setup Vercel

### 3a. Buat Akun Vercel
- Buka https://vercel.com/signup
- Pilih **"Continue with GitHub"** (rekomendasi)
- Authorize Vercel akses GitHub

### 3b. Import Project

1. Buka https://vercel.com/dashboard (setelah login)
2. Klik **"Add New..." → "Project"**
3. Pilih repo **`estadio-futsal-reborn`** dari list
4. Klik **"Import"**

---

## Step 4: Konfigurasi Environment Variables

Setelah klik Import, Vercel akan menunjukkan halaman **"Configure Project"**:

1. **Framework** → Otomatis detect `Next.js` ✓
2. **Build & Output Settings** → Biarkan default ✓
3. **Environment Variables** → **TAMBAHKAN:**

Scroll ke bagian "Environment Variables" dan tambahkan:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` (key dari Supabase) |

**Sumber:** lihat file `env.local` di project kamu atau Supabase Dashboard → Settings → API.

Klik **"Deploy"** setelah input semua vars.

---

## Step 5: Tunggu Deploy Selesai

Vercel akan:
1. Build project (`npm run build`)
2. Optimize & deploy
3. Assign URL: `https://estadio-futsal-reborn.vercel.app` (atau custom domain)

Cek di tab **"Deployments"** untuk status.

---

## Step 6: Update Supabase Auth Redirect URLs

Supaya login/register bekerja, tambahkan redirect URL di Supabase:

1. Buka Supabase Dashboard → Settings → Auth
2. Di bagian **"Redirect URLs"**, tambahkan:
   - `https://estadio-futsal-reborn.vercel.app/**` (ganti dengan URL Vercel kamu)
   - `http://localhost:3000/**` (untuk development lokal)

3. Klik **"Save"**

---

## Step 7: Test Live

Buka `https://estadio-futsal-reborn.vercel.app` dan test:
- Login / Register
- Booking halaman
- Riwayat booking

Jika ada error, buka **Vercel Dashboard → Deployments → [Latest] → Logs** untuk debug.

---

## Bonus: Custom Domain

Jika punya domain sendiri (misal `estadio-futsal.com`):

1. Buka Vercel Dashboard → Settings → Domains
2. Klik **"Add Domain"**
3. Masukkan domain dan ikuti instruksi DNS
4. Update Supabase Auth Redirect URLs dengan custom domain

---

## Troubleshooting

### Build gagal
```
Check logs di Vercel → Deployments → [deployment] → Logs
Pastikan Node.js version 18+
```

### Env vars tidak terbaca
```
Pastikan key di Vercel sama persis dengan .env.local
Klik "Redeploy" setelah update env vars
```

### Koneksi Supabase gagal
```
1. Verifikasi NEXT_PUBLIC_SUPABASE_URL dan ANON_KEY
2. Check Supabase Auth Redirect URLs sudah benar
3. Cek CORS settings di Supabase
```

### Database error (payment_deadline tidak ditemukan)
```
Jalankan migration terlebih dahulu:
sql/migrations/001_add_payment_deadline.sql
```

---

## Redeploy (Push Update)

Setiap kali push ke GitHub, Vercel otomatis redeploy:

```powershell
git add .
git commit -m "Update: fix payment countdown"
git push origin main
```

Vercel akan trigger build otomatis dalam 30 detik.

---

## Free Tier Limits (Vercel)

✅ **Included:**
- Unlimited deployments
- Automatic HTTPS
- Edge functions (limited)
- 100GB bandwidth/bulan
- Custom domains

⚠️ **Fair Use Policy:**
- Jika traffic sangat tinggi, Vercel bisa upgrade atau request pembayaran
- Untuk production dengan traffic medium-high, pertimbangkan upgrade ke Pro ($20/bulan)

---

## Next Steps

1. ✅ Push ke GitHub
2. ✅ Setup Vercel
3. ✅ Deploy
4. ✅ Test login & booking
5. ✅ Update Supabase Auth URLs
6. ✅ Monitor logs

**Selamat! Project sudah live! 🚀**
