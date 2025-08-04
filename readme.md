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

````

---

## 📦 Setup Environment

### 1. Install dependency backend

```bash
cd server
npm install
````

### 2. Install dependency frontend

```bash
cd ../client
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

## ❗ Catatan Tambahan

* Pastikan backend dan frontend dijalankan di **terminal terpisah**
* Proxy telah dikonfigurasi di `client/package.json` untuk menghindari masalah CORS
* Jika ada error port sudah digunakan, hentikan proses lain yang memakai port 3000 atau 5000

---

## 📚 Dokumentasi Terkait

* [Node.js](https://nodejs.org/)
* [React](https://reactjs.org/)
* [Express](https://expressjs.com/)
