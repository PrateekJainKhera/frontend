# MultiHitech ERP - Setup Instructions

## ✅ What's Been Built So Far

### Phase 1 Complete: Foundation + Customer Master

- ✅ TypeScript type definitions (all entities)
- ✅ Mock data files (customers, products, orders)
- ✅ Utility functions (formatters, mock API)
- ✅ Dashboard layout with sidebar navigation
- ✅ Header with user menu
- ✅ Customer Master module (CRUD operations)
- ✅ Toast notifications (Sonner)

## 🚀 How to Run the Application

### 1. Navigate to frontend directory
```bash
cd c:\Users\prate\OneDrive\Desktop\multihitech\frontend
```

### 2. Install dependencies (if not done)
```bash
npm install
```

### 3. Run development server
```bash
npm run dev
```

### 4. Open in browser
Navigate to: **http://localhost:3000**

The app will auto-redirect to the dashboard.

## 📁 Current Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          ← Dashboard layout
│   │   │   ├── page.tsx            ← Dashboard home
│   │   │   └── masters/
│   │   │       └── customers/
│   │   │           └── page.tsx    ← Customer Master page
│   │   ├── layout.tsx              ← Root layout
│   │   └── page.tsx                ← Redirects to /dashboard
│   ├── components/
│   │   ├── ui/                     ← Shadcn components
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   └── header.tsx
│   │   ├── tables/
│   │   │   └── customers-table.tsx
│   │   └── forms/
│   │       └── create-customer-dialog.tsx
│   ├── lib/
│   │   ├── mock-data/
│   │   │   ├── customers.ts
│   │   │   ├── products.ts
│   │   │   ├── orders.ts
│   │   │   └── index.ts
│   │   └── utils/
│   │       ├── cn.ts
│   │       ├── formatters.ts
│   │       └── mock-api.ts
│   └── types/
│       ├── customer.ts
│       ├── product.ts
│       ├── order.ts
│       ├── enums.ts
│       └── ...
```

## 🎨 Features to Test

### 1. Navigation
- Click sidebar menu items
- Navigate between modules
- Responsive sidebar (collapses on mobile)

### 2. Customer Master
- View customer list
- Search customers by name/code/contact
- Click "Add Customer" button
- Fill form and submit
- See toast notifications

### 3. Dashboard
- View KPI cards
- See quick access cards

## 🐛 Troubleshooting

### If components are not found:
```bash
# Make sure Shadcn components are installed
npx shadcn@latest add button card dialog form input select skeleton sonner table badge alert progress dropdown-menu
```

### If styles are not working:
- Check if `globals.css` has Tailwind directives
- Verify `tailwind.config.ts` is configured correctly

### If imports are failing:
- Check `tsconfig.json` has path aliases configured:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 📋 Next Steps

The following modules need to be built next (in order):

1. ✅ **Customer Master** ← DONE
2. **Product/Part Master** ← Next
3. **Raw Material Master**
4. **Process Master**
5. **Process Templates**
6. **Order Management**
7. **Live Order Tracking**
8. **Production (Operator Interface)**
9. **Rejection & Rework**
10. **MIS Dashboards**

## 📞 Need Help?

Refer to:
- [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) for full specifications
- [Shadcn UI Docs](https://ui.shadcn.com/)
- [Next.js Docs](https://nextjs.org/docs)

---

**Status**: Phase 1 Complete ✅
**Last Updated**: 2025-12-27
