# 🚀 Fullstack App – React + Express

Proyek ini adalah aplikasi fullstack sederhana menggunakan **React** di frontend dan **Express (Node.js)** di backend.

---

## ⚙️ Persyaratan

Pastikan sudah menginstal:

- [Node.js v22.18.0 (LTS)](https://nodejs.org/en/download)
- Git Bash (untuk Windows)
- npm (terinstall otomatis bersama Node.js)

---

## 📁 Struktur Proyek

```

express-react-project/
│
├── client/      # Frontend React
└── server/      # Backend Express
└── server/      # Redis Services

````

---

## 📦 Setup Environment Local

### 1. Install dependency backend

```bash
cd server
npm install
````

### 2. Install dependency frontend

```bash
cd ../client
cp .env.example .env
or
copy .env.example .env
npm install
```

---

## ▶️ Menjalankan Proyek

### Jalankan backend (Express)

```bash
cd server
npm run dev
```

> Server akan berjalan di `http://localhost:5000`

---

### Jalankan frontend (React)

Buka terminal baru, lalu:

```bash
cd client
npm start
```

> React akan berjalan di `http://localhost:3000`
> Secara otomatis akan fetch data dari backend melalui proxy.

---

## Setup Environtment Docker

### 1. Install Docker Desktop

### 2. Jalankan Container

```bash
cd ../client
cp .env.example .env
cd ..

docker-compose up -d --build
```
### 3. Program Running di Localhost
Client : http://localhost:5173/

Server : http://localhost:5000/

Redis  : http://localhost:6379/

## 📊 Panduan Pengisian Data Excel

### Format Data Stasiun

Untuk mengimport data stasiun ke dalam sistem, gunakan format Excel dengan kolom-kolom berikut:

#### Kolom Wajib:
- **kode_stasiun**: Kode unik stasiun (string)
- **net**: Network stasiun - Pilih salah satu: `IA`, `II`
- **lintang**: Koordinat latitude (number)
- **bujur**: Koordinat longitude (number)
- **elevasi**: Ketinggian dalam meter (number)
- **lokasi**: Alamat lengkap stasiun (string)
- **provinsi**: Nama provinsi (string)
- **tahun_instalasi**: Tahun instalasi (number)

#### Kolom Opsional:
- **jaringan**: Grup jaringan stasiun (string)
- **upt_penanggung_jawab**: Unit Pelaksana Teknis yang bertanggung jawab (string)
- **keterangan**: Catatan tambahan (string)
- **prioritas**: Prioritas stasiun - Pilih salah satu: `P1`, `P2`, `P3`
- **status**: Status stasiun - Pilih salah satu: `aktif`, `nonaktif`

#### Kolom Shelter/Perumahan:
- **tipe_shelter**: Tipe shelter - Pilih salah satu:
  - `bunker`: Bunker
  - `posthole`: Posthole
  - `surface`: Surface
- **lokasi_shelter**: Lokasi shelter - Pilih salah satu:
  - `outside_BMKG_office`: Outside BMKG Office
  - `inside_BMKG_office`: Inside BMKG Office
- **penjaga_shelter**: Penjaga shelter - Pilih salah satu:
  - `ada`: Ada
  - `tidak_ada`: Tidak Ada
- **kondisi_shelter**: Kondisi shelter - Pilih salah satu:
  - `baik`: Baik
  - `rusak_ringan`: Rusak Ringan
  - `rusak_berat`: Rusak Berat
- **assets_shelter**: Aset shelter (string)
- **access_shelter**: Akses shelter (string)

#### Kolom Peralatan:
- **accelerometer**: Sensor accelerometer - Pilih salah satu:
  - `installed`: Installed
  - `not_installed`: Not Installed
- **digitizer_komunikasi**: Peralatan komunikasi digitizer - Pilih salah satu:
  - `installed`: Installed
  - `not_installed`: Not Installed

### Contoh Format Excel:

| kode_stasiun | net | lintang | bujur | elevasi | lokasi | provinsi | tahun_instalasi | jaringan | upt_penanggung_jawab | tipe_shelter | lokasi_shelter | penjaga_shelter | kondisi_shelter | accelerometer | digitizer_komunikasi |
|-------------|-----|---------|-------|---------|--------|-----------|------------------|----------|----------------------|--------------|----------------|------------------|----------------|----------------|---------------------|
| AAFM | IA | -6.2088 | 106.8456 | 45 | Jakarta | DKI Jakarta | 2020 | Jaringan Utama | UPT Jakarta | bunker | outside_BMKG_office | ada | baik | installed | installed |
| AAI | II | -7.7956 | 110.3695 | 120 | Yogyakarta | DI Yogyakarta | 2019 | Jaringan Cadangan | UPT Yogyakarta | surface | inside_BMKG_office | tidak_ada | rusak_ringan | not_installed | installed |

### Cara Import Data:

#### 1. Import Data Stasiun
```bash
# Jalankan seeder untuk data stasiun
cd server
npm run seed

# Atau jalankan script seeder spesifik
node scripts/seed.js
```

#### 2. Import Data Availability
```bash
# Import data availability dari JSON
python import_availability_data.py data_availability.json

# Validasi data tanpa import (dry run)
python import_availability_data.py data_availability.json --dry-run

# Cek data yang sudah ada di database
python import_availability_data.py dummy.json --check-existing
```

#### 3. Konversi Kode Stasiun
```bash
# Konversi kode stasiun ke stasiun_id untuk data availability
python convert_station_codes.py data_availability_raw.json data_availability_converted.json
```

### Script Yang Tersedia:

- **`import_availability_data.py`**: Import data availability stasiun ke database
- **`convert_station_codes.py`**: Konversi kode stasiun ke foreign key stasiun_id
- **`server/scripts/seed.js`**: Seeder untuk data master (stasiun, referensi)
- **`server/scripts/migrate.js`**: Migrasi struktur database

### Parameter Script Import:

```bash
python import_availability_data.py [file] [options]

Options:
  --batch-size SIZE    Ukuran batch untuk insert database (default: 1000)
  --dry-run           Validasi data tanpa menyimpan ke database
  --check-existing    Cek data yang sudah ada di database
  --db-host HOST      Host database (default: localhost)
  --db-user USER      User database (default: root)
  --db-password PASS  Password database
  --db-name NAME      Nama database (default: station_quality_control)
```

### Struktur Database:

Data stasiun menggunakan foreign key ke tabel referensi:
- **provinsi_id**: ID provinsi dari tabel `provinsi`
- **upt_id**: ID UPT dari tabel `upt_penanggung_jawab`
- **jaringan_id**: ID jaringan dari tabel `jaringan`

### Data Referensi Yang Tersedia:

#### Provinsi:
- Nusa Tenggara Timur, Maluku, Jawa Timur, Bengkulu, Jawa Barat, Papua Barat, Sulawesi Tengah, Papua, Aceh, Sulawesi Selatan, Sulawesi Tenggara, Bali, Maluku Utara, dll.

#### UPT (Unit Pelaksana Teknis):
- UPT Kupang, UPT Ambon, UPT Surabaya, UPT Bengkulu, UPT Bandung, UPT Manokwari, UPT Palu, UPT Jayapura, UPT Medan, dll.

#### Jaringan:
- Jaringan Utama, Jaringan Cadangan, Jaringan Khusus, Jaringan Regional, Jaringan Lokal, dll.

### Tips Pengisian Data:

- 🔍 **Validasi Data**: Selalu gunakan `--dry-run` terlebih dahulu untuk memastikan data valid
- 📊 **Batch Processing**: Untuk data besar, gunakan batch size yang sesuai dengan kapasitas server
- 🔄 **Foreign Key**: Pastikan data referensi (provinsi, UPT, jaringan) sudah ada sebelum import
- 📅 **Format Tanggal**: Gunakan format `YYYY-MM-DD` untuk data availability
- 🔢 **Koordinat**: Pastikan latitude/longitude dalam format desimal dengan presisi yang sesuai

### Troubleshooting Import Data:

#### Error Umum dan Solusi:

**❌ Foreign Key Constraint Error**
```
Error: Cannot add or update a child row: a foreign key constraint fails
```
**Solusi**: Pastikan data referensi (provinsi, UPT, jaringan) sudah ada di database
```bash
# Jalankan seeder referensi terlebih dahulu
cd server && npm run seed
```

**❌ Duplicate Entry Error**
```
Error: Duplicate entry 'STATION_CODE' for key 'kode_stasiun'
```
**Solusi**: Cek apakah stasiun dengan kode tersebut sudah ada
```bash
# Cek data existing
python import_availability_data.py dummy.json --check-existing
```

**❌ Invalid Date Format**
```
Error: Incorrect date value: 'invalid_date'
```
**Solusi**: Pastikan format tanggal menggunakan `YYYY-MM-DD`

**❌ Connection Timeout**
```
Error: Database connection timeout
```
**Solusi**: Periksa konfigurasi database dan koneksi jaringan
```bash
# Test koneksi database
cd server && npm run db-status
```

#### Monitoring Import:

Script import akan menampilkan progress real-time:
```
🚀 Starting import of 10000 records...
📦 Batch size: 1000
📈 Progress: 10.0% (1000 inserted, 0 errors)
📈 Progress: 20.0% (2000 inserted, 5 errors)
...
📊 Import Summary:
   ✅ Successfully inserted: 9500 records
   ❌ Errors/Skipped: 500 records
   📈 Success rate: 95.0%
```

---

## 📚 Dokumentasi Terkait

* [Node.js](https://nodejs.org/)
* [React](https://reactjs.org/)
* [Express](https://expressjs.com/)
