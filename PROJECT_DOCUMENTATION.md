# Multihitech ERP - Production Management System
## Project Documentation v1.0

> **Roller Manufacturing Focus | Next.js 16.1 Full-Stack Application**

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Development Guidelines](#development-guidelines)
4. [Project Scope](#project-scope)
5. [System Architecture](#system-architecture)
6. [Module Specifications](#module-specifications)
7. [Database Schema](#database-schema)
8. [Mock Data Strategy](#mock-data-strategy)
9. [UI/UX Design Standards](#uiux-design-standards)
10. [File Structure](#file-structure)
11. [Development Roadmap](#development-roadmap)
12. [Critical Business Rules](#critical-business-rules)

---

## 🎯 Project Overview

### Mission Statement
A specialized ERP system designed for roller manufacturing with focus on CNC/VMC workflow management, real-time production tracking, expert-level rejection/rework handling, and OEM order management.

### Core Differentiators
- **Process-first design** (not generic ERP)
- **Shop-floor reality** over theoretical workflows
- **Zero free-text** standardization (dropdown-only inputs)
- **Expert-level rejection/rework** handling
- **Granular permission** system with field-level security

### Key Stakeholders
- **CNC/VMC Operators**: Minimal mobile interface for job cards
- **Production Planners**: Full scheduling and tracking capabilities
- **Management**: Executive dashboards and MIS reports
- **Sales Team**: Order management and quotations (no production internals)
- **Quality Inspectors**: Rejection and rework management

---

## 🛠️ Technology Stack

### Frontend Framework
```json
{
  "framework": "Next.js 16.1",
  "routing": "App Router",
  "mode": "Frontend Only (Mockup Phase)",
  "typescript": "5.x",
  "react": "19.x"
}
```

### UI & Styling
```json
{
  "css": "Tailwind CSS (Mobile-first + Desktop-optimized)",
  "components": "Shadcn UI (Latest)",
  "icons": "Lucide React",
  "charts": "Recharts",
  "notifications": "Sonner",
  "forms": "React Hook Form + Zod"
}
```

### Data Management (Mockup Phase)
```json
{
  "data": "Mock/Dummy JSON files",
  "location": "src/lib/mock-data/",
  "state": "Zustand (lightweight state management)",
  "queries": "TanStack Query (for future API integration)"
}
```

### Production Stack (Future)
```json
{
  "backend": "Next.js API Routes / Server Actions",
  "orm": "Prisma ORM",
  "database": "PostgreSQL 15+",
  "cache": "Redis",
  "auth": "NextAuth.js v5",
  "storage": "AWS S3 / Cloudflare R2"
}
```

---

## 📐 Development Guidelines

### 1. Styling & Responsiveness

#### Tailwind CSS Only
```typescript
// ✅ CORRECT: Use Tailwind responsive utilities
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <Card className="p-4 sm:p-6">...</Card>
</div>

// ❌ WRONG: Custom hooks for device detection
const isMobile = useMobile() // DON'T USE
```

#### Mobile-First Approach
```css
/* Default styles = Mobile */
.container { padding: 1rem; }

/* Tablet and up */
@media (min-width: 768px) { padding: 1.5rem; }

/* Desktop and up */
@media (min-width: 1024px) { padding: 2rem; }
```

#### Responsive Breakpoints
```typescript
// Tailwind breakpoints
sm: '640px'   // Small tablets
md: '768px'   // Tablets
lg: '1024px'  // Laptops
xl: '1280px'  // Desktops
2xl: '1536px' // Large screens
```

### 2. UI Component Standards

#### Shadcn UI Components
```bash
# Reference: https://ui.shadcn.com/

# Core components to use:
- Button, Input, Select, Textarea
- Card, Badge, Avatar
- Dialog, AlertDialog, Sheet
- Table, DataTable
- Skeleton (MANDATORY for loading states)
- Sonner (Toast notifications)
- Form (with React Hook Form integration)
```

#### Loading States (MANDATORY)
```typescript
// ✅ CORRECT: Always use Skeleton loaders
import { Skeleton } from "@/components/ui/skeleton"

function ProductList({ loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }
  return <ProductTable data={products} />
}
```

#### Required Skeleton Patterns
```typescript
// Card skeletons
<Skeleton className="h-32 w-full rounded-lg" />

// Table row skeletons
<Skeleton className="h-12 w-full" />

// Form field skeletons
<Skeleton className="h-10 w-full rounded-md" />

// Chart skeletons
<Skeleton className="h-64 w-full rounded-lg" />
```

### 3. User Feedback Patterns

#### Toast Notifications (Sonner)
```typescript
import { toast } from "sonner"

// ✅ CORRECT: Use Sonner for feedback
toast.success("Order created successfully")
toast.error("Failed to save data")
toast.info("Processing your request...")

// ❌ WRONG: Simple alerts
alert("Data saved") // NEVER USE
```

#### Confirmation Dialogs
```typescript
// ✅ CORRECT: Use AlertDialog for destructive actions
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete Order</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete order #ORD-001.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 4. Component Development Workflow

#### Step-by-Step Process
```typescript
// 1. START WITH LAYOUT (Mobile-first)
export default function OrdersPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Orders</h1>
      {/* Content */}
    </div>
  )
}

// 2. ADD SKELETON LOADER
if (loading) {
  return <OrdersPageSkeleton />
}

// 3. BUILD UI with Shadcn components
<Card>
  <CardHeader>
    <CardTitle>Order Details</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>

// 4. CONNECT MOCK DATA
import { mockOrders } from '@/lib/mock-data/orders'

// 5. ADD INTERACTIONS
<Dialog>
  <DialogTrigger asChild>
    <Button>Create Order</Button>
  </DialogTrigger>
  <DialogContent>
    {/* Form */}
  </DialogContent>
</Dialog>

// 6. POLISH (transitions, hover states)
<Button className="transition-all hover:scale-105">
  Submit
</Button>

// 7. TEST RESPONSIVENESS (Mobile, Tablet, Desktop)
```

### 5. TypeScript Standards

#### Component Props
```typescript
// ✅ CORRECT: Define interfaces at top
interface ProductCardProps {
  product: Product
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  className?: string
}

export default function ProductCard({
  product,
  onEdit,
  onDelete,
  className
}: ProductCardProps) {
  // Component code
}
```

#### Type Safety
```typescript
// Define all types in types/ directory
// types/product.ts
export interface Product {
  id: string
  partCode: string
  customerName: string
  modelName: string
  rollerType: RollerType
  diameter: number
  length: number
}

export enum RollerType {
  MAGNETIC = 'Magnetic',
  RUBBER = 'Rubber',
  ANILOX = 'Anilox',
  IDLER = 'Idler'
}
```

### 6. Naming Conventions

```typescript
// Components: PascalCase (e.g., ProductCard.tsx)
export default function ProductCard() {}

// Files: kebab-case
// utils/calculate-weight.ts
// lib/mock-data/products.ts

// Constants: UPPER_SNAKE_CASE
export const MAX_ORDER_QUANTITY = 1000
export const DEFAULT_DUE_DATE_DAYS = 14

// Functions: camelCase
function calculateMaterialWeight() {}

// Interfaces: PascalCase with descriptive names
interface OrderFormData {}
interface ProductListProps {}
```

### 7. Dependency Management

#### Manual Installation Required
```bash
# DO NOT auto-install packages
# User will run these commands manually

# Core dependencies
npm install next@16.1 react@19 react-dom@19 typescript

# UI & Styling
npm install tailwindcss postcss autoprefixer
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react

# Shadcn UI (installed per component)
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add skeleton
npx shadcn@latest add sonner

# Forms
npm install react-hook-form zod @hookform/resolvers

# State Management (optional for mockup)
npm install zustand

# Charts
npm install recharts
```

#### Dependency List Document
```markdown
# Required Dependencies

## UI Components
- shadcn/ui (button, card, dialog, skeleton, sonner, table, form)
- lucide-react (icons)

## Forms
- react-hook-form
- zod

## Charts
- recharts

## Utilities
- class-variance-authority
- clsx
- tailwind-merge
```

---

## 🎯 Project Scope

### Mockup Phase Objectives

#### 1. Visual Prototyping
- **Goal**: Create pixel-perfect UI mockups with dummy data
- **No Backend**: All interactions simulated with mock JSON data
- **Focus**: User experience, workflow validation, stakeholder approval

#### 2. Modules to Build (Mockup Phase)

##### Phase 1: Master Data Management
```typescript
✅ Customer Master (List, Create, Edit, View)
✅ Product/Part Master (with all fields from schema)
✅ Raw Material Master (with weight calculations)
✅ Process Master (CRUD operations)
✅ Process Template Builder (drag-and-drop sequence)
```

##### Phase 2: Order Management
```typescript
✅ Order Punching Form (dropdown enforcement)
✅ Order List with filters
✅ Live Order Tracking Dashboard
✅ Order Detail View (with process timeline)
✅ Due Date Management (extension requests)
```

##### Phase 3: Production Interface
```typescript
✅ Operator Mobile PWA (job cards view)
✅ Production Entry Form (qty completed/rejected)
✅ Job Card List (assigned to operator)
✅ Process Start/End workflow
```

##### Phase 4: Rejection & Rework
```typescript
✅ Rejection Recording Form
✅ Rejection List & Analytics
✅ Rework Order Creation
✅ Parent-Child Order Linking
```

##### Phase 5: MIS Dashboards
```typescript
✅ Management Executive Dashboard
✅ Production Planner Dashboard
✅ Sales Dashboard (order-focused)
✅ Delay Analysis Reports
✅ Quality Metrics (rejection trends)
```

### Out of Scope (Mockup Phase)

```typescript
❌ Real database integration
❌ Authentication/Authorization (mocked roles)
❌ File uploads (show UI only)
❌ Email notifications
❌ Real-time WebSocket updates
❌ API endpoints
❌ Payment/Invoicing
❌ Advanced scheduling algorithms
```

---

## 🏗️ System Architecture

### Mockup Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    NEXT.JS 16.1 APP                     │
│                   (App Router Mode)                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Pages     │  │ Components  │  │    Mock     │    │
│  │  (Routes)   │──│  (Shadcn)   │──│    Data     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│         │                 │                 │          │
│         └─────────────────┴─────────────────┘          │
│                       │                                 │
│                  ┌─────────┐                            │
│                  │ Zustand │ (Optional State)           │
│                  └─────────┘                            │
│                                                         │
└─────────────────────────────────────────────────────────┘

Data Flow (Mockup):
1. Component mounts
2. Show Skeleton loader
3. Simulate API delay (setTimeout)
4. Load mock data from JSON
5. Render component with data
6. User interactions update local state
```

### Production Architecture (Future Reference)

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                   │
├─────────────────────────────────────────────────────────┤
│  React Components + Tailwind + Shadcn UI               │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ API Routes / Server Actions
                   ↓
┌─────────────────────────────────────────────────────────┐
│                    BACKEND (Next.js)                    │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Prisma   │  │  Redis   │  │NextAuth  │             │
│  │   ORM    │  │  Cache   │  │   Auth   │             │
│  └────┬─────┘  └──────────┘  └──────────┘             │
│       │                                                 │
└───────┼─────────────────────────────────────────────────┘
        │
        ↓
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL Database                        │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Module Specifications

### Module 1: Master Data Management

#### 1.1 Product/Part Master

**Page**: `/masters/products`

**Features**:
- List view with search/filter
- Create new product (form with validations)
- Edit existing product (restricted after production start)
- View product details
- Linked process template display

**Key Fields**:
```typescript
interface Product {
  id: string
  partCode: string           // Auto-generated (e.g., MAG-250-EN8-001)
  customerName: string       // SELECT only (dropdown)
  modelName: string          // SELECT only (dropdown)
  rollerType: RollerType     // ENUM dropdown
  diameter: number           // Number input with validation
  length: number             // Number input with validation
  materialGrade: string      // SELECT from predefined list
  drawingNo: string          // Text input
  revisionNo: string         // Text input
  numberOfTeeth: number | null  // OPTIONAL (nullable)
  processTemplateId: string  // SELECT process template
  createdAt: Date
  updatedAt: Date
  createdBy: string
}
```

**UI Components**:
```typescript
- ProductListTable (DataTable with pagination)
- ProductCreateDialog (Form in Dialog)
- ProductEditSheet (Form in Sheet)
- ProductDetailCard (Read-only view)
- ProcessTemplateSelector (Combobox)
```

**Mockup Behavior**:
```typescript
// Simulate part code generation
const generatePartCode = (product: Partial<Product>) => {
  const type = product.rollerType?.substring(0, 3).toUpperCase()
  const diameter = product.diameter
  const material = product.materialGrade?.substring(0, 3).toUpperCase()
  const sequence = Math.floor(Math.random() * 999) + 1
  return `${type}-${diameter}-${material}-${sequence.toString().padStart(3, '0')}`
}

// Simulate save with delay
const handleSave = async (data: Product) => {
  toast.loading("Saving product...")
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Add to mock data
  mockProducts.push({ ...data, id: generateId() })

  toast.success("Product created successfully")
}
```

#### 1.2 Raw Material Master

**Page**: `/masters/raw-materials`

**Features**:
- Weight-to-length calculator
- Stock level tracking
- Low stock alerts (visual indicators)

**Key Fields**:
```typescript
interface RawMaterial {
  id: string
  materialName: string       // e.g., "EN8 Rod"
  grade: MaterialGrade       // ENUM: EN8, EN19, SS304, etc.
  shape: MaterialShape       // ENUM: Rod, Pipe, Forged
  diameter: number           // mm
  lengthInMM: number         // mm
  density: number            // kg/mm³
  weightKG: number           // Computed: length × π × r² × density
  stockQty: number           // Current stock in meters
  minStockLevel: number      // Reorder level
}
```

**Weight Calculation UI**:
```typescript
// Real-time calculation display
<Card>
  <CardHeader>
    <CardTitle>Material Calculator</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Diameter (mm)</Label>
        <Input type="number" value={diameter} onChange={...} />
      </div>
      <div>
        <Label>Length (mm)</Label>
        <Input type="number" value={length} onChange={...} />
      </div>
    </div>

    <div className="p-4 bg-muted rounded-lg">
      <p className="text-sm text-muted-foreground">Calculated Weight</p>
      <p className="text-2xl font-bold">{weightKG.toFixed(2)} kg</p>
    </div>
  </CardContent>
</Card>
```

#### 1.3 Process Template Builder

**Page**: `/masters/process-templates`

**Features**:
- Drag-and-drop process sequence
- Add/remove process steps
- Mark steps as mandatory/optional
- Preview template flow

**UI Mockup**:
```typescript
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Available Processes */}
  <Card>
    <CardHeader>
      <CardTitle>Available Processes</CardTitle>
    </CardHeader>
    <CardContent>
      {availableProcesses.map(process => (
        <ProcessCard
          key={process.id}
          process={process}
          draggable
        />
      ))}
    </CardContent>
  </Card>

  {/* Template Sequence */}
  <Card>
    <CardHeader>
      <CardTitle>Process Sequence</CardTitle>
    </CardHeader>
    <CardContent>
      <SortableList
        items={templateSteps}
        onReorder={handleReorder}
      />
    </CardContent>
  </Card>
</div>
```

### Module 2: Order Management

#### 2.1 Order Punching Form

**Page**: `/orders/create`

**Critical Feature**: **Zero Free-Text Inputs**

**Form Structure**:
```typescript
<Form {...form}>
  <div className="space-y-6">
    {/* Customer Selection - DROPDOWN ONLY */}
    <FormField
      control={form.control}
      name="customerId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Customer Name *</FormLabel>
          <Select onValueChange={field.onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />

    {/* Part Selection - DROPDOWN ONLY */}
    <FormField
      control={form.control}
      name="productId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Part Code *</FormLabel>
          <Combobox
            options={products}
            value={field.value}
            onValueChange={field.onChange}
            placeholder="Search part code..."
          />
          {/* Auto-display part details */}
          {selectedProduct && (
            <div className="mt-2 p-3 bg-muted rounded-md text-sm">
              <p><strong>Model:</strong> {selectedProduct.modelName}</p>
              <p><strong>Type:</strong> {selectedProduct.rollerType}</p>
              <p><strong>Dimensions:</strong> {selectedProduct.diameter} × {selectedProduct.length} mm</p>
            </div>
          )}
        </FormItem>
      )}
    />

    {/* Quantity */}
    <FormField
      control={form.control}
      name="quantity"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Quantity *</FormLabel>
          <Input
            type="number"
            min={1}
            {...field}
          />
          <FormMessage />
        </FormItem>
      )}
    />

    {/* Due Date - Auto-calculated + Editable */}
    <FormField
      control={form.control}
      name="dueDate"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Due Date *</FormLabel>
          <Input
            type="date"
            {...field}
            min={getDefaultDueDate()} // Today + 14 days
          />
          <FormDescription>
            Default: 14 days from order date
          </FormDescription>
        </FormItem>
      )}
    />

    <Button type="submit" className="w-full">
      Create Order
    </Button>
  </div>
</Form>
```

#### 2.2 Live Order Tracking Dashboard

**Page**: `/orders/live-tracking`

**Real-time Status Display**:
```typescript
<div className="space-y-6">
  {/* Filter Bar */}
  <Card>
    <CardContent className="p-4">
      <div className="flex flex-wrap gap-4">
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="delayed">Delayed</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Search order..."
          className="max-w-sm"
        />

        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    </CardContent>
  </Card>

  {/* Live Status Cards */}
  <div className="grid gap-4">
    {orders.map(order => (
      <Card key={order.id}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {order.orderNo}
            </CardTitle>
            <Badge variant={getStatusVariant(order.status)}>
              {order.status}
            </Badge>
          </div>
          <CardDescription>
            {order.customer.name} • {order.product.partCode}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Current Process</p>
              <p className="font-medium">{order.currentProcess || 'Pending'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Machine</p>
              <p className="font-medium">{order.currentMachine || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Operator</p>
              <p className="font-medium">{order.currentOperator || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Progress</p>
              <div className="flex items-center gap-2">
                <Progress value={(order.qtyCompleted / order.quantity) * 100} />
                <span className="text-xs">
                  {order.qtyCompleted}/{order.quantity}
                </span>
              </div>
            </div>
          </div>

          {/* Delay Warning */}
          {order.delayDays > 5 && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Delayed by {order.delayDays} days • Reason: {order.delayReason}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="pt-0">
          <Button variant="link" asChild>
            <Link href={`/orders/${order.id}`}>
              View Details →
            </Link>
          </Button>
        </CardFooter>
      </Card>
    ))}
  </div>
</div>
```

### Module 3: Production (Operator Mobile Interface)

#### 3.1 Job Cards View (Mobile PWA)

**Page**: `/operator/job-cards`

**Design Principles**:
- **Extreme Simplicity**: Large touch targets, minimal text
- **No Distractions**: Hide pricing, other departments, analytics
- **Offline-first**: Works without internet (future)

**Mobile UI**:
```typescript
<div className="min-h-screen bg-background p-4">
  {/* Header */}
  <div className="mb-6">
    <h1 className="text-2xl font-bold">My Job Cards</h1>
    <p className="text-muted-foreground">
      Operator: {operatorName}
    </p>
  </div>

  {/* Active Job Card - PROMINENT */}
  {activeJob && (
    <Card className="mb-6 border-primary border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="default" className="text-base px-3 py-1">
            Active
          </Badge>
          <Badge variant="outline">
            Started: {formatTime(activeJob.startTime)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Job Card #</p>
            <p className="text-xl font-bold">{activeJob.jobCardNo}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Part Code</p>
              <p className="font-medium">{activeJob.partCode}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Process</p>
              <p className="font-medium">{activeJob.processName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Machine</p>
              <p className="font-medium">{activeJob.machineName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Quantity</p>
              <p className="font-medium">{activeJob.quantity} pcs</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full h-14 text-lg"
          onClick={() => openCompleteDialog(activeJob)}
        >
          <CheckCircle2 className="mr-2 h-5 w-5" />
          Complete Process
        </Button>
      </CardFooter>
    </Card>
  )}

  {/* Pending Jobs */}
  <div className="space-y-3">
    <h2 className="text-lg font-semibold">
      Pending Jobs ({pendingJobs.length})
    </h2>
    {pendingJobs.map(job => (
      <Card key={job.id}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{job.jobCardNo}</p>
              <p className="text-sm text-muted-foreground">
                {job.processName} • {job.quantity} pcs
              </p>
            </div>
            <Button onClick={() => startJob(job)}>
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
</div>
```

#### 3.2 Complete Process Dialog

```typescript
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Complete Process</DialogTitle>
      <DialogDescription>
        Job Card: {jobCard.jobCardNo}
      </DialogDescription>
    </DialogHeader>

    <Form {...form}>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="qtyCompleted"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity Completed *</FormLabel>
              <Input
                type="number"
                min={0}
                max={jobCard.quantity}
                {...field}
                className="text-lg h-12"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="qtyRejected"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity Rejected</FormLabel>
              <Input
                type="number"
                min={0}
                {...field}
                className="text-lg h-12"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Conditional: Show rejection reason if rejected > 0 */}
        {form.watch('qtyRejected') > 0 && (
          <FormField
            control={form.control}
            name="rejectionReason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rejection Reason *</FormLabel>
                <Select onValueChange={field.onChange}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="material_defect">
                      Material Defect
                    </SelectItem>
                    <SelectItem value="machine_error">
                      Machine Error
                    </SelectItem>
                    <SelectItem value="dimension_mismatch">
                      Dimension Mismatch
                    </SelectItem>
                    <SelectItem value="surface_defect">
                      Surface Defect
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={form.handleSubmit(handleComplete)}
          >
            Submit
          </Button>
        </DialogFooter>
      </div>
    </Form>
  </DialogContent>
</Dialog>
```

### Module 4: Rejection & Rework

#### 4.1 Rejection Recording

**Page**: `/rejections/create`

**Critical Business Logic**:
```typescript
const handleRejection = async (data: RejectionForm) => {
  toast.loading("Processing rejection...")

  // Simulate rejection logic
  await new Promise(resolve => setTimeout(resolve, 1000))

  // 1. Create rejection record
  const rejection = {
    id: generateId(),
    rejectionNo: `REJ-${Date.now()}`,
    orderId: data.orderId,
    processName: data.processName,
    qtyRejected: data.qtyRejected,
    rejectionReason: data.reason,
    inspectorName: currentUser.name,
    rejectionDate: new Date()
  }

  // 2. Reduce original order quantity (KEY RULE)
  const order = mockOrders.find(o => o.id === data.orderId)
  if (order) {
    order.quantity -= data.qtyRejected
    order.qtyRejected += data.qtyRejected
    // Order does NOT auto-complete (critical rule)
  }

  toast.success(`Rejected ${data.qtyRejected} pcs from order`)
  toast.info("Order quantity adjusted. Rework can be created separately.")
}
```

#### 4.2 Rework Order Creation

**Page**: `/rework/create`

**Parent-Child Linking UI**:
```typescript
<Form {...form}>
  <div className="space-y-6">
    {/* Link to Rejection */}
    <FormField
      control={form.control}
      name="rejectionId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Select Rejection *</FormLabel>
          <Select onValueChange={field.onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select rejection to rework" />
            </SelectTrigger>
            <SelectContent>
              {pendingRejections.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  {r.rejectionNo} - {r.qtyRejected} pcs @ {r.processName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            Rework will start from the rejection point, not from beginning
          </FormDescription>
        </FormItem>
      )}
    />

    {/* Display parent order details */}
    {selectedRejection && (
      <Card className="bg-muted">
        <CardHeader>
          <CardTitle className="text-base">Parent Order Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order No:</span>
            <span className="font-medium">
              {selectedRejection.order.orderNo}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Part Code:</span>
            <span className="font-medium">
              {selectedRejection.order.product.partCode}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rejected At:</span>
            <span className="font-medium text-destructive">
              {selectedRejection.processName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Qty to Rework:</span>
            <span className="font-medium">
              {selectedRejection.qtyRejected} pcs
            </span>
          </div>
        </CardContent>
      </Card>
    )}

    {/* Rework Approval */}
    <FormField
      control={form.control}
      name="reworkReason"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Rework Justification *</FormLabel>
          <Textarea
            {...field}
            placeholder="Explain why rework is feasible and cost-effective"
            className="min-h-[100px]"
          />
        </FormItem>
      )}
    />

    <Button type="submit" className="w-full">
      Create Rework Order
    </Button>
  </div>
</Form>
```

### Module 5: MIS Dashboards

#### 5.1 Management Executive Dashboard

**Page**: `/mis/executive`

**KPI Cards**:
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  {/* Total Orders */}
  <Card>
    <CardHeader className="pb-3">
      <CardDescription>Total Orders</CardDescription>
      <CardTitle className="text-3xl">128</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-xs text-muted-foreground">
        <span className="text-green-600">↑ 12%</span> from last month
      </div>
    </CardContent>
  </Card>

  {/* On-Time Delivery */}
  <Card>
    <CardHeader className="pb-3">
      <CardDescription>On-Time Delivery</CardDescription>
      <CardTitle className="text-3xl">87%</CardTitle>
    </CardHeader>
    <CardContent>
      <Progress value={87} className="h-2" />
    </CardContent>
  </Card>

  {/* Rejection Rate */}
  <Card>
    <CardHeader className="pb-3">
      <CardDescription>Rejection Rate</CardDescription>
      <CardTitle className="text-3xl">2.1%</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-xs text-muted-foreground">
        <span className="text-yellow-600">↑ 0.3%</span> vs target (1.5%)
      </div>
    </CardContent>
  </Card>

  {/* Revenue */}
  <Card>
    <CardHeader className="pb-3">
      <CardDescription>Revenue (This Month)</CardDescription>
      <CardTitle className="text-3xl">₹12.5L</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-xs text-muted-foreground">
        Target: ₹15L
      </div>
    </CardContent>
  </Card>
</div>

{/* Production Trend Chart */}
<Card className="mb-6">
  <CardHeader>
    <CardTitle>Production Trend (Last 30 Days)</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={productionTrendData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="ordersReceived"
          stroke="#8884d8"
          name="Orders Received"
        />
        <Line
          type="monotone"
          dataKey="ordersCompleted"
          stroke="#82ca9d"
          name="Orders Completed"
        />
      </LineChart>
    </ResponsiveContainer>
  </CardContent>
</Card>

{/* Critical Alerts */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <AlertTriangle className="h-5 w-5 text-destructive" />
      Critical Alerts
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      <Alert variant="destructive">
        <AlertDescription>
          CNC process: 3% rejection rate (↑ from 1.5% baseline)
        </AlertDescription>
      </Alert>
      <Alert>
        <AlertDescription>
          Low stock alert: EN8 Rod (50mm) - 25m remaining
        </AlertDescription>
      </Alert>
    </div>
  </CardContent>
</Card>
```

---

## 🗄️ Database Schema

### Entity Relationship Diagram (Conceptual)

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  Customer   │──1:N──│   Product   │──1:N──│    Order    │
└─────────────┘       └─────────────┘       └─────────────┘
                             │                      │
                             │                      │
                            1:1                    1:N
                             │                      │
                      ┌──────────────┐       ┌──────────────┐
                      │   Process    │       │   Process    │
                      │   Template   │       │   History    │
                      └──────────────┘       └──────────────┘
                             │                      │
                            1:N                     │
                             │                      │
                      ┌──────────────┐              │
                      │   Process    │              │
                      │  Template    │              │
                      │     Step     │              │
                      └──────────────┘              │
                                                    │
                                            ┌───────┴───────┐
                                            │               │
                                      ┌──────────┐   ┌──────────┐
                                      │Rejection │   │ Rework   │
                                      │          │──1:1──│  Order   │
                                      └──────────┘   └──────────┘
```

### Core Tables (Prisma Schema Reference)

```prisma
// See full schema in previous sections
// Key relationships:

Product {
  customer ──→ Customer
  processTemplate ──→ ProcessTemplate
  orders ──→ Order[]
}

Order {
  customer ──→ Customer
  product ──→ Product
  processHistory ──→ ProcessHistory[]
  rejections ──→ Rejection[]
  reworkOrders ──→ ReworkOrder[]
}

Rejection {
  order ──→ Order
  reworkOrder ──→ ReworkOrder (1:1)
}

ReworkOrder {
  parentOrder ──→ Order
  rejection ──→ Rejection
}
```

---

## 📊 Mock Data Strategy

### Directory Structure

```
src/lib/mock-data/
├── customers.ts          // Customer master data
├── products.ts           // Product/part master
├── raw-materials.ts      // Raw material inventory
├── processes.ts          // Process definitions
├── process-templates.ts  // Process templates
├── orders.ts             // Orders with full details
├── process-history.ts    // Production tracking data
├── rejections.ts         // Rejection records
├── rework-orders.ts      // Rework orders
├── users.ts              // User accounts (roles)
├── machines.ts           // Machine master
└── index.ts              // Centralized exports
```

### Mock Data Guidelines

#### 1. Realistic Data
```typescript
// ✅ GOOD: Realistic manufacturing data
export const mockProducts: Product[] = [
  {
    id: '1',
    partCode: 'MAG-250-EN8-001',
    customerName: 'ABC Flexo Packaging Ltd.',
    modelName: 'Flexo 8-Color Press',
    rollerType: RollerType.MAGNETIC,
    diameter: 250,
    length: 1200,
    materialGrade: 'EN8',
    drawingNo: 'DRG-MAG-250-v2',
    revisionNo: 'R2',
    numberOfTeeth: null,
    processTemplateId: 'template-magnetic',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'admin'
  },
  // ... 20+ more realistic entries
]

// ❌ BAD: Generic test data
export const mockProducts = [
  { id: '1', name: 'Product 1' },
  { id: '2', name: 'Product 2' }
]
```

#### 2. Inter-related Data
```typescript
// Ensure foreign keys match
export const mockOrders: Order[] = [
  {
    id: 'order-1',
    customerId: 'customer-1', // Must exist in mockCustomers
    productId: 'product-1',   // Must exist in mockProducts
    quantity: 50,
    // ...
  }
]
```

#### 3. Data Variations
```typescript
// Include edge cases
export const mockOrders = [
  // Active order
  { status: OrderStatus.IN_PROGRESS, delayDays: 0 },

  // Delayed order (5 days)
  { status: OrderStatus.IN_PROGRESS, delayDays: 5 },

  // Critical delay (10+ days)
  { status: OrderStatus.IN_PROGRESS, delayDays: 12 },

  // Completed order
  { status: OrderStatus.COMPLETED, qtyCompleted: 100 },

  // Order with rejections
  { qtyRejected: 15, rejections: [...] },

  // Rework order
  { isRework: true, parentOrderId: 'order-5' }
]
```

#### 4. Computed Fields
```typescript
// Helper functions for computed data
export const getOrderProgress = (order: Order) => {
  return (order.qtyCompleted / order.quantity) * 100
}

export const getDelayStatus = (order: Order) => {
  if (order.delayDays === 0) return 'on_time'
  if (order.delayDays <= 5) return 'minor_delay'
  return 'critical_delay'
}

// Use in mock data
export const mockOrdersWithComputed = mockOrders.map(order => ({
  ...order,
  progress: getOrderProgress(order),
  delayStatus: getDelayStatus(order)
}))
```

### Sample Mock Data Files

#### `customers.ts`
```typescript
export const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'ABC Flexo Packaging Ltd.',
    code: 'ABC001',
    contactPerson: 'Rajesh Kumar',
    email: 'rajesh@abcflexo.com',
    phone: '+91 98765 43210',
    address: 'Plot 45, Industrial Area, Ahmedabad, Gujarat - 380015',
    isActive: true,
    createdAt: new Date('2023-06-15'),
    updatedAt: new Date('2023-06-15')
  },
  {
    id: 'cust-2',
    name: 'XYZ Printing Solutions Pvt. Ltd.',
    code: 'XYZ002',
    contactPerson: 'Priya Sharma',
    email: 'priya@xyzprint.com',
    phone: '+91 98765 43211',
    address: 'B-12, GIDC Estate, Vapi, Gujarat - 396195',
    isActive: true,
    createdAt: new Date('2023-08-20'),
    updatedAt: new Date('2023-08-20')
  },
  // ... 10+ more customers
]
```

#### `products.ts`
```typescript
export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    partCode: 'MAG-250-EN8-001',
    customerName: 'ABC Flexo Packaging Ltd.',
    modelName: 'Flexo 8-Color Press',
    rollerType: RollerType.MAGNETIC,
    diameter: 250,
    length: 1200,
    materialGrade: 'EN8',
    drawingNo: 'DRG-MAG-250-v2',
    revisionNo: 'R2',
    numberOfTeeth: null,
    surfaceFinish: 'Mirror Polish',
    hardness: 'HRC 58-62',
    processTemplateId: 'template-1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'admin'
  },
  {
    id: 'prod-2',
    partCode: 'RUB-300-NBR-002',
    customerName: 'XYZ Printing Solutions Pvt. Ltd.',
    modelName: 'Offset Press 4-Color',
    rollerType: RollerType.RUBBER,
    diameter: 300,
    length: 1500,
    materialGrade: 'NBR (Nitrile Rubber)',
    drawingNo: 'DRG-RUB-300-v1',
    revisionNo: 'R1',
    numberOfTeeth: null,
    surfaceFinish: 'Matt Finish',
    hardness: 'Shore A 70',
    processTemplateId: 'template-2',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
    createdBy: 'admin'
  },
  // ... more products
]
```

#### `orders.ts`
```typescript
export const mockOrders: Order[] = [
  {
    id: 'ord-1',
    orderNo: 'ORD-2024-001',
    customerId: 'cust-1',
    productId: 'prod-1',
    quantity: 50,
    originalQuantity: 50,
    qtyCompleted: 35,
    qtyRejected: 0,
    qtyInProgress: 15,
    orderDate: new Date('2024-03-01'),
    dueDate: new Date('2024-03-15'),
    adjustedDueDate: null,
    delayReason: null,
    status: OrderStatus.IN_PROGRESS,
    priority: Priority.MEDIUM,
    currentProcess: 'Grinding',
    currentMachine: 'GRD-02',
    currentOperator: 'Ramesh Patel',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-10'),
    createdBy: 'sales-user'
  },
  {
    id: 'ord-2',
    orderNo: 'ORD-2024-002',
    customerId: 'cust-2',
    productId: 'prod-2',
    quantity: 30,
    originalQuantity: 45, // Reduced due to rejection
    qtyCompleted: 20,
    qtyRejected: 15,
    qtyInProgress: 10,
    orderDate: new Date('2024-02-25'),
    dueDate: new Date('2024-03-10'),
    adjustedDueDate: new Date('2024-03-18'),
    delayReason: DelayReason.QUALITY_ISSUE,
    status: OrderStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    currentProcess: 'CNC Turning',
    currentMachine: 'CNC-01',
    currentOperator: 'Suresh Kumar',
    createdAt: new Date('2024-02-25'),
    updatedAt: new Date('2024-03-08'),
    createdBy: 'sales-user'
  },
  // ... more orders with various statuses
]
```

### Loading Simulation

```typescript
// utils/mock-utils.ts
export const simulateApiCall = <T,>(
  data: T,
  delay: number = 1000
): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

// Usage in components
const [products, setProducts] = useState<Product[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  setLoading(true)
  simulateApiCall(mockProducts, 800)
    .then(data => {
      setProducts(data)
      setLoading(false)
    })
}, [])
```

---

## 🎨 UI/UX Design Standards

### Color Palette

```typescript
// Tailwind config (reference)
colors: {
  primary: {
    DEFAULT: '#3b82f6', // Blue
    foreground: '#ffffff'
  },
  success: {
    DEFAULT: '#10b981', // Green
    foreground: '#ffffff'
  },
  warning: {
    DEFAULT: '#f59e0b', // Amber
    foreground: '#000000'
  },
  destructive: {
    DEFAULT: '#ef4444', // Red
    foreground: '#ffffff'
  },
  muted: {
    DEFAULT: '#f1f5f9',
    foreground: '#64748b'
  }
}
```

### Typography Hierarchy

```typescript
// Heading levels
<h1 className="text-3xl md:text-4xl font-bold">Page Title</h1>
<h2 className="text-2xl md:text-3xl font-semibold">Section Title</h2>
<h3 className="text-xl md:text-2xl font-semibold">Subsection</h3>
<h4 className="text-lg md:text-xl font-medium">Card Title</h4>

// Body text
<p className="text-base">Regular paragraph text</p>
<p className="text-sm text-muted-foreground">Helper text</p>
<p className="text-xs text-muted-foreground">Caption text</p>
```

### Spacing Scale

```typescript
// Consistent spacing using Tailwind scale
gap-2  // 0.5rem (8px)
gap-4  // 1rem (16px)
gap-6  // 1.5rem (24px)
gap-8  // 2rem (32px)

p-4    // 1rem padding
p-6    // 1.5rem padding
p-8    // 2rem padding

mb-4   // 1rem margin-bottom
mb-6   // 1.5rem margin-bottom
```

### Interactive States

```typescript
// Button hover states
<Button className="transition-all hover:scale-105 active:scale-95">
  Click Me
</Button>

// Card hover effects
<Card className="transition-shadow hover:shadow-lg cursor-pointer">
  ...
</Card>

// Focus states (accessibility)
<Input className="focus:ring-2 focus:ring-primary" />
```

### Responsive Patterns

```typescript
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {items.map(...)}
</div>

// Responsive text sizing
<h1 className="text-2xl sm:text-3xl md:text-4xl">
  Responsive Heading
</h1>

// Responsive padding
<div className="p-4 md:p-6 lg:p-8">
  Content with responsive padding
</div>

// Hide on mobile, show on desktop
<div className="hidden lg:block">
  Desktop only content
</div>

// Show on mobile, hide on desktop
<div className="block lg:hidden">
  Mobile only content
</div>
```

### Empty States

```typescript
// Professional empty state component
<Card className="p-12 text-center">
  <div className="flex flex-col items-center gap-4">
    <Package className="h-16 w-16 text-muted-foreground" />
    <div>
      <h3 className="text-lg font-semibold mb-2">
        No orders found
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Get started by creating your first order
      </p>
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        Create Order
      </Button>
    </div>
  </div>
</Card>
```

### Loading Skeletons

```typescript
// Table skeleton
function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
          <Skeleton className="h-8 w-[100px]" />
        </div>
      ))}
    </div>
  )
}

// Card skeleton
function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  )
}
```

### Accessibility

```typescript
// Proper ARIA labels
<Button aria-label="Delete order">
  <Trash2 className="h-4 w-4" />
</Button>

// Form accessibility
<Label htmlFor="customer-name">Customer Name</Label>
<Input id="customer-name" aria-required="true" />

// Color contrast (automatically handled by Shadcn)
<Badge variant="destructive">High contrast text</Badge>
```

---

## 📁 File Structure

```
multihitech-erp/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx                 // Main dashboard layout
│   │   ├── page.tsx                   // Dashboard home
│   │   │
│   │   ├── orders/
│   │   │   ├── page.tsx               // Orders list
│   │   │   ├── create/
│   │   │   │   └── page.tsx           // Create order form
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx           // Order details
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx       // Edit order
│   │   │   └── live-tracking/
│   │   │       └── page.tsx           // Live tracking dashboard
│   │   │
│   │   ├── production/
│   │   │   ├── page.tsx
│   │   │   ├── job-cards/
│   │   │   │   └── page.tsx
│   │   │   └── entry/
│   │   │       └── page.tsx
│   │   │
│   │   ├── masters/
│   │   │   ├── page.tsx
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx
│   │   │   │   └── create/
│   │   │   │       └── page.tsx
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── raw-materials/
│   │   │   │   └── page.tsx
│   │   │   ├── processes/
│   │   │   │   └── page.tsx
│   │   │   └── process-templates/
│   │   │       ├── page.tsx
│   │   │       ├── create/
│   │   │       │   └── page.tsx
│   │   │       └── [id]/
│   │   │           └── page.tsx
│   │   │
│   │   ├── rejections/
│   │   │   ├── page.tsx
│   │   │   └── create/
│   │   │       └── page.tsx
│   │   │
│   │   ├── rework/
│   │   │   ├── page.tsx
│   │   │   └── create/
│   │   │       └── page.tsx
│   │   │
│   │   └── mis/
│   │       ├── page.tsx
│   │       ├── executive/
│   │       │   └── page.tsx
│   │       ├── production/
│   │       │   └── page.tsx
│   │       └── sales/
│   │           └── page.tsx
│   │
│   ├── (operator)/                     // Mobile PWA
│   │   ├── layout.tsx
│   │   ├── job-cards/
│   │   │   └── page.tsx
│   │   └── entry/
│   │       └── page.tsx
│   │
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                        // Landing page
│
├── components/
│   ├── ui/                             // Shadcn UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── skeleton.tsx
│   │   ├── sonner.tsx
│   │   └── ...
│   │
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── mobile-nav.tsx
│   │
│   ├── forms/
│   │   ├── order-form.tsx
│   │   ├── product-form.tsx
│   │   ├── rejection-form.tsx
│   │   └── ...
│   │
│   ├── tables/
│   │   ├── orders-table.tsx
│   │   ├── products-table.tsx
│   │   └── data-table.tsx              // Reusable data table
│   │
│   ├── charts/
│   │   ├── production-trend-chart.tsx
│   │   ├── rejection-analysis-chart.tsx
│   │   └── ...
│   │
│   ├── cards/
│   │   ├── order-status-card.tsx
│   │   ├── kpi-card.tsx
│   │   └── job-card-mobile.tsx
│   │
│   └── skeletons/
│       ├── table-skeleton.tsx
│       ├── card-skeleton.tsx
│       └── dashboard-skeleton.tsx
│
├── lib/
│   ├── mock-data/
│   │   ├── customers.ts
│   │   ├── products.ts
│   │   ├── raw-materials.ts
│   │   ├── processes.ts
│   │   ├── process-templates.ts
│   │   ├── orders.ts
│   │   ├── process-history.ts
│   │   ├── rejections.ts
│   │   ├── rework-orders.ts
│   │   ├── users.ts
│   │   ├── machines.ts
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── cn.ts                       // Class name utility
│   │   ├── calculations.ts             // Weight/length calculations
│   │   ├── formatters.ts               // Date/number formatters
│   │   ├── validators.ts               // Zod schemas
│   │   └── mock-utils.ts               // Mock API helpers
│   │
│   └── constants/
│       ├── enums.ts                    // All enums
│       ├── options.ts                  // Dropdown options
│       └── config.ts                   // App config
│
├── types/
│   ├── customer.ts
│   ├── product.ts
│   ├── raw-material.ts
│   ├── process.ts
│   ├── order.ts
│   ├── rejection.ts
│   ├── rework.ts
│   ├── user.ts
│   └── index.ts
│
├── hooks/
│   ├── use-toast.ts                    // Sonner hook
│   └── use-local-storage.ts            // Local storage hook
│
├── public/
│   ├── icons/
│   └── images/
│
├── .env.local
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── components.json                     // Shadcn config
├── PROJECT_DOCUMENTATION.md            // This file
└── README.md
```

---

## 🚀 Development Roadmap

### Phase 1: Foundation Setup
**Duration**: Initial setup

**Tasks**:
1. ✅ Initialize Next.js 16.1 project with TypeScript
2. ✅ Install Tailwind CSS
3. ✅ Setup Shadcn UI (components.json)
4. ✅ Create base layout structure
5. ✅ Setup TypeScript types
6. ✅ Create mock data files
7. ✅ Implement navigation (sidebar, header)

**Deliverables**:
- Working Next.js app with routing
- Shadcn UI configured
- Mock data structure in place
- Navigation functional

---

### Phase 2: Master Data Modules
**Duration**: Build core master data

**Tasks**:
1. ✅ Customer Master (List, Create, Edit, View)
2. ✅ Product/Part Master (with all validations)
3. ✅ Raw Material Master (with calculator)
4. ✅ Process Master
5. ✅ Process Template Builder

**Deliverables**:
- All master data pages functional
- Forms with Zod validation
- Skeleton loaders on all pages
- Dropdown enforcement working

---

### Phase 3: Order Management
**Duration**: Order workflow

**Tasks**:
1. ✅ Order Punching Form (dropdown-only inputs)
2. ✅ Order List with filters & search
3. ✅ Live Order Tracking Dashboard
4. ✅ Order Detail View (with timeline)
5. ✅ Due Date Management

**Deliverables**:
- Complete order workflow
- Real-time status indicators
- Delay highlighting
- Process timeline visualization

---

### Phase 4: Production (Operator Interface)
**Duration**: Mobile-first production

**Tasks**:
1. ✅ Operator Mobile Layout
2. ✅ Job Card List (assigned jobs)
3. ✅ Start/End Process UI
4. ✅ Production Entry Form
5. ✅ Complete Process Dialog

**Deliverables**:
- Mobile-optimized PWA layout
- Minimal operator interface
- Touch-friendly interactions
- Field-level permission hiding

---

### Phase 5: Rejection & Rework
**Duration**: Expert-level logic

**Tasks**:
1. ✅ Rejection Recording Form
2. ✅ Rejection List & Details
3. ✅ Rework Order Creation
4. ✅ Parent-Child Order Linking
5. ✅ Impact Visualization

**Deliverables**:
- Rejection workflow complete
- Rework orders linked to parents
- Order qty reduction working
- Process restart from rejection point

---

### Phase 6: MIS Dashboards
**Duration**: Analytics & reporting

**Tasks**:
1. ✅ Management Executive Dashboard
2. ✅ Production Planner Dashboard
3. ✅ Sales Dashboard
4. ✅ Charts (Recharts integration)
5. ✅ Export functionality (UI mockup)

**Deliverables**:
- Role-specific dashboards
- KPI cards with trends
- Interactive charts
- Delay analysis reports

---

### Phase 7: Polish & Testing
**Duration**: Final refinement

**Tasks**:
1. ✅ Responsive testing (all breakpoints)
2. ✅ Accessibility audit
3. ✅ Performance optimization
4. ✅ Error boundaries
5. ✅ Final UI polish

**Deliverables**:
- Fully responsive on all devices
- WCAG compliant
- Loading states everywhere
- Professional polish complete

---

## 🔐 Critical Business Rules

### 1. Dropdown Enforcement
```
❌ NEVER allow free-text input for:
- Customer Name
- Model Name
- Part Code
- Process Name
- Machine Name
- Rejection Reason

✅ ALWAYS use SELECT/Combobox from master data
```

### 2. Process Sequence
```
✅ Process sequence is FIXED once production starts
✅ Cannot reorder completed processes
✅ Can only mark: Complete | Reject | Rework
❌ Cannot skip mandatory process steps
```

### 3. Rejection Handling
```
✅ When rejection occurs:
  1. Original order quantity REDUCES
  2. Order does NOT auto-complete
  3. Rejected qty tracked separately

✅ Rework orders:
  1. Linked to parent order
  2. Start from rejection point (NOT beginning)
  3. Separate tracking, same parent
```

### 4. Permission Rules
```
CNC Operator CAN see:
✅ Assigned job cards only
✅ Production entry form
✅ Current machine/tool

CNC Operator CANNOT see:
❌ Sales pricing
❌ Customer pricing
❌ Other department jobs
❌ MIS dashboards
```

### 5. Part Code Generation
```
✅ Auto-generated (immutable)
✅ Format: {TYPE}-{DIAMETER}-{MATERIAL}-{SEQUENCE}
✅ Example: MAG-250-EN8-001
❌ Cannot be manually edited after creation
```

### 6. Due Date Management
```
✅ Default: Order Date + 14 days
✅ Editable by authorized users only
✅ Extension requires reason
✅ Impact analysis on dependent orders
```

### 7. Weight-to-Length Conversion
```
✅ Formula: weight = length × π × r² × density
✅ ALWAYS use computed fields (not manual entry)
✅ Density values: EN8 = 0.00000785 kg/mm³
```

---

## 📝 Development Checklist

### Before Starting Each Page

- [ ] Read business requirements for module
- [ ] Design mobile layout first (Figma/sketch optional)
- [ ] Identify required Shadcn components
- [ ] Plan skeleton loader structure
- [ ] Define TypeScript interfaces
- [ ] Prepare mock data

### During Development

- [ ] Use Tailwind responsive utilities (no custom hooks)
- [ ] Implement skeleton loader FIRST
- [ ] Use Shadcn components (not custom UI)
- [ ] Add Sonner toast for all actions
- [ ] Use Dialog for confirmations (not alerts)
- [ ] Validate forms with Zod
- [ ] Test on mobile viewport

### Before Committing

- [ ] Test responsiveness (sm, md, lg, xl)
- [ ] Check loading states work
- [ ] Verify toast notifications
- [ ] Test keyboard navigation
- [ ] Check color contrast
- [ ] No console errors/warnings
- [ ] TypeScript strict mode passes

---

## 🎓 Next Steps

### Immediate Actions

1. **Setup Project**:
   ```bash
   npx create-next-app@latest multihitech-erp --typescript --tailwind --app
   cd multihitech-erp
   ```

2. **Install Shadcn UI**:
   ```bash
   npx shadcn@latest init
   npx shadcn@latest add button card dialog form input select skeleton sonner
   ```

3. **Create Initial Structure**:
   - Setup folder structure (as per File Structure section)
   - Create type definitions in `types/`
   - Add mock data files in `lib/mock-data/`

4. **Build First Module**:
   - Start with **Customer Master** (simplest CRUD)
   - Use as template for other masters
   - Validate responsive design works

### Stakeholder Review Points

- **After Phase 2**: Review master data management
- **After Phase 3**: Review order workflow
- **After Phase 4**: Review operator mobile interface
- **After Phase 5**: Review rejection/rework logic
- **After Phase 6**: Final review before backend integration

---

## 📞 Support & Questions

For technical questions or clarification on business rules, refer to:
- This documentation (source of truth)
- Original requirements (top of this document)
- Shadcn UI docs: https://ui.shadcn.com/
- Next.js docs: https://nextjs.org/docs

---

**Document Version**: 1.0
**Last Updated**: 2025-12-27
**Author**: Development Team
**Status**: Ready for Implementation

