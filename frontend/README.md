# SmartSpend Web

Frontend React + TypeScript chạy bằng Vite, gồm hai portal độc lập:

- Customer: `http://localhost:5173/customer/login`
- Admin: `http://localhost:5173/admin/login`

## Chạy local

Khởi động `CustomerApplication` ở cổng 8080, `AdminApplication` ở cổng 8081, sau đó:

```bash
npm install
npm run dev
```

Vite proxy `/customer-api` và `/admin-api` đến hai backend tương ứng nên không cần cấu hình CORS khi phát triển local.

## Cấu trúc

```text
src/
├── app/                 # Router cấp ứng dụng
├── features/
│   ├── customer/        # Auth và dashboard khách hàng
│   └── admin/           # Auth và dashboard quản trị
└── shared/
    ├── api/             # HTTP client dùng chung
    ├── auth/            # Session tách theo portal
    ├── components/      # Component tái sử dụng
    └── types/           # Kiểu dữ liệu API
```

## Biến môi trường production

Sao chép `.env.example` thành `.env` và thay URL nếu frontend/backend không cùng origin:

```env
VITE_CUSTOMER_API_URL=https://customer-api.example.com
VITE_ADMIN_API_URL=https://admin-api.example.com
```
