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
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

Backend mac dinh chay tai `http://localhost:5000`.

Xem co so du lieu bang giao dien:

```bash
cd Backend
npm run prisma:studio
```

Sau do mo URL Prisma Studio (thuong la `http://localhost:5555`) de xem/sua du lieu cac bang.

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
copy .env.example .env
flutter pub get
flutter run
```

## 4) Khoi dong Flutter app tai xe

```bash
cd "gugugaga shipper"
copy .env.example .env
flutter pub get
flutter run
```

## Ghi chu

- Cac route backend da duoc chia theo nhom: `/api/admin`, `/api/user`, `/api/shipper`, `/api/public`.
- Tai khoan seed mac dinh:
  - Admin: `admin@gugugaga.vn` / `123456`
  - Driver: `driver@gugugaga.vn` / `123456`
