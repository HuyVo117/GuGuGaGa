# GuGuGaGa

Monorepo da nen tang gom 4 phan:

- `Backend`: Node.js + Express + Prisma
- `Admin`: React + Vite
- `gugugaga`: Flutter app khach hang
- `gugugaga shipper`: Flutter app tai xe

## 1) Khoi dong Backend

```bash
cd Backend
copy .env.example .env
npm install
npm run dev
```

Backend mac dinh chay tai `http://localhost:5000`.

## 2) Khoi dong Admin

```bash
cd Admin
copy .env.example .env
npm install
npm run dev
```

Admin mac dinh chay tai `http://localhost:5173`.

## 3) Khoi dong Flutter app khach hang

```bash
cd gugugaga
flutter pub get
flutter run
```

## 4) Khoi dong Flutter app tai xe

```bash
cd "gugugaga shipper"
flutter pub get
flutter run
```

## Ghi chu

- Cac route backend da duoc chia theo nhom: `/api/admin`, `/api/user`, `/api/shipper`, `/api/public`.
- Cac endpoint hien tai la scaffold ban dau de bat dau code nghiep vu.
