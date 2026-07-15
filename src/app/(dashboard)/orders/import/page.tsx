'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import {
  ArrowLeft, Download, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle,
  Loader2, PlusCircle, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { customerService } from '@/lib/api/customer'
import { productService } from '@/lib/api/products'
import { orderService, BulkOrderResult } from '@/lib/api/orders'
import { getCurrentUserName } from '@/lib/auth'
import { cn } from '@/lib/utils/cn'

// ── Types ────────────────────────────────────────────────────────────────────

interface ImportItem {
  rowNum: number
  model: string
  roller: string
  teeth: string
  qty: number
  dueDate: string       // ISO yyyy-mm-dd
  priority: string
  productId: number | null   // resolved / user-picked
  autoMatched: boolean
}
interface ImportOrder {
  ref: string
  customerName: string
  customerId: number | null
  customerAuto: boolean
  orderDate: string
  orderValue?: number
  items: ImportItem[]
}

const TEMPLATE_HEADERS = ['Order Ref', 'Customer', 'Model', 'Roller Type', 'Teeth', 'Quantity', 'Order Date', 'Due Date', 'Priority', 'Order Value']
const norm = (s: any) => String(s ?? '').trim().toLowerCase()
const todayISO = () => new Date().toISOString().slice(0, 10)

/** Excel cell → ISO yyyy-mm-dd (handles Date objects, serials via cellDates, and strings). */
function toISODate(v: any): string {
  if (!v) return ''
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10)
  const d = new Date(v)
  return isNaN(d.getTime()) ? String(v) : d.toISOString().slice(0, 10)
}

export default function ImportOrdersPage() {
  const router = useRouter()
  const [loadingMasters, setLoadingMasters] = useState(true)
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<ImportOrder[]>([])
  const [fileName, setFileName] = useState('')
  const [creating, setCreating] = useState(false)
  const [results, setResults] = useState<BulkOrderResult[] | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const [cs, ps] = await Promise.all([customerService.getAll(), productService.getAll()])
        setCustomers(cs); setProducts(ps)
      } catch { toast.error('Failed to load customers/products') }
      finally { setLoadingMasters(false) }
    })()
  }, [])

  // Lookup maps for auto-matching
  const customerByName = useMemo(() => {
    const m = new Map<string, any>()
    customers.forEach(c => m.set(norm(c.customerName), c))
    return m
  }, [customers])
  const productByKey = useMemo(() => {
    const m = new Map<string, any>()
    products.forEach(p => {
      const key = `${norm(p.modelName)}|${norm(p.rollerType)}|${Number(p.numberOfTeeth) || 0}`
      if (!m.has(key)) m.set(key, p)
    })
    return m
  }, [products])

  const customerOptions = useMemo(
    () => customers.map(c => ({ value: String(c.id), label: c.customerName })), [customers])
  const productOptions = useMemo(
    () => products.map(p => ({
      value: String(p.id),
      label: `${p.partCode} · ${p.modelName} · ${p.rollerType}${p.numberOfTeeth ? ` · ${p.numberOfTeeth}T` : ''}`,
    })), [products])

  // ── Template ──
  function downloadTemplate() {
    const example = [
      { 'Order Ref': 'PO-1001', Customer: customers[0]?.customerName || 'Customer Name', Model: 'AKO-330', 'Roller Type': 'Magnetic Roller', Teeth: 88, Quantity: 4, 'Order Date': todayISO(), 'Due Date': todayISO(), Priority: 'Medium', 'Order Value': 0 },
      { 'Order Ref': 'PO-1001', Customer: customers[0]?.customerName || 'Customer Name', Model: 'AKO-330', 'Roller Type': 'Printing Roller', Teeth: 73, Quantity: 2, 'Order Date': todayISO(), 'Due Date': todayISO(), Priority: 'High', 'Order Value': 0 },
    ]
    const ws = XLSX.utils.json_to_sheet(example, { header: TEMPLATE_HEADERS })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Orders')
    XLSX.writeFile(wb, 'order-import-template.xlsx')
  }

  // ── Parse upload ──
  const handleFile = useCallback((file: File) => {
    setResults(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'array', cellDates: true })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        if (rows.length === 0) { toast.error('The sheet has no rows'); return }

        // pick a value by any of several header spellings
        const pick = (r: any, ...keys: string[]) => {
          for (const k of Object.keys(r)) {
            if (keys.some(want => norm(k) === norm(want))) return r[k]
          }
          return ''
        }

        const grouped = new Map<string, ImportOrder>()
        rows.forEach((r, i) => {
          const ref = String(pick(r, 'Order Ref', 'OrderRef', 'Ref') || `Row ${i + 2}`).trim()
          const customerName = String(pick(r, 'Customer', 'Customer Name')).trim()
          const model = String(pick(r, 'Model', 'Machine Model')).trim()
          const roller = String(pick(r, 'Roller Type', 'Roller')).trim()
          const teeth = String(pick(r, 'Teeth', 'No of Teeth', 'Teeth Count')).trim()
          const qty = Number(pick(r, 'Quantity', 'Qty')) || 0
          const orderDate = toISODate(pick(r, 'Order Date', 'OrderDate')) || todayISO()
          const dueDate = toISODate(pick(r, 'Due Date', 'DueDate')) || todayISO()
          const priority = String(pick(r, 'Priority') || 'Medium').trim() || 'Medium'
          const orderValue = Number(pick(r, 'Order Value', 'OrderValue')) || undefined

          const teethNum = Number(teeth) || 0
          const prod = productByKey.get(`${norm(model)}|${norm(roller)}|${teethNum}`)
          const item: ImportItem = {
            rowNum: i + 2, model, roller, teeth,
            qty, dueDate, priority,
            productId: prod ? prod.id : null, autoMatched: !!prod,
          }

          if (!grouped.has(ref)) {
            const cust = customerByName.get(norm(customerName))
            grouped.set(ref, {
              ref, customerName, customerId: cust ? cust.id : null, customerAuto: !!cust,
              orderDate, orderValue, items: [],
            })
          }
          grouped.get(ref)!.items.push(item)
        })

        setFileName(file.name)
        setOrders(Array.from(grouped.values()))
        toast.success(`Parsed ${rows.length} row(s) → ${grouped.size} order(s)`)
      } catch (err: any) {
        toast.error('Could not read the file — is it a valid .xlsx?')
      }
    }
    reader.readAsArrayBuffer(file)
  }, [productByKey, customerByName])

  // ── Edits ──
  const setOrderCustomer = (ref: string, id: string) =>
    setOrders(prev => prev.map(o => o.ref === ref ? { ...o, customerId: Number(id), customerAuto: false } : o))
  const setItemProduct = (ref: string, rowNum: number, id: string) =>
    setOrders(prev => prev.map(o => o.ref === ref ? {
      ...o, items: o.items.map(it => it.rowNum === rowNum ? { ...it, productId: Number(id), autoMatched: false } : it),
    } : o))

  // ── Validation ──
  const orderValid = (o: ImportOrder) =>
    o.customerId != null && o.items.length > 0 && o.items.every(it => it.productId != null && it.qty > 0 && it.dueDate)
  const validCount = orders.filter(orderValid).length
  const unresolved = orders.reduce((n, o) =>
    n + (o.customerId == null ? 1 : 0) + o.items.filter(it => it.productId == null).length, 0)

  // ── Submit ──
  async function createAll() {
    const ready = orders.filter(orderValid)
    if (ready.length === 0) { toast.error('No fully-resolved orders to create'); return }
    setCreating(true)
    try {
      const payload = ready.map(o => ({
        ref: o.ref,
        order: {
          customerId: o.customerId!,
          orderDate: o.orderDate,
          orderValue: o.orderValue,
          createdBy: getCurrentUserName(),
          items: o.items.map(it => ({
            productId: it.productId!,
            quantity: it.qty,
            dueDate: it.dueDate,
            priority: it.priority || 'Medium',
          })),
        },
      }))
      const res = await orderService.bulkCreate(payload)
      setResults(res)
      const ok = res.filter(r => r.success).length
      toast.success(`${ok} of ${res.length} order(s) created`)
      // drop the successfully-created orders from the working set
      const okRefs = new Set(res.filter(r => r.success).map(r => r.ref))
      setOrders(prev => prev.filter(o => !okRefs.has(o.ref)))
    } catch (e: any) { toast.error(e.message || 'Bulk create failed') }
    finally { setCreating(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/orders')}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-xl font-semibold">Import Orders from Excel</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Upload a sheet, resolve any unmatched rows, then create all orders at once.</p>
        </div>
      </div>

      {/* Step 1 — template + upload */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={downloadTemplate} className="gap-2">
          <Download className="h-4 w-4" /> Download template
        </Button>
        <label className={cn('inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-muted',
          loadingMasters && 'opacity-50 pointer-events-none')}>
          <Upload className="h-4 w-4" /> {fileName || 'Choose .xlsx file'}
          <input type="file" accept=".xlsx,.xls" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = '' }} />
        </label>
        {loadingMasters && <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> loading masters…</span>}
      </div>

      {/* Results banner */}
      {results && (
        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-sm font-medium">
            {results.filter(r => r.success).length} of {results.length} created
          </p>
          {results.filter(r => !r.success).map((r, i) => (
            <p key={i} className="text-xs text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3" /> <b>{r.ref}</b>: {r.message}
            </p>
          ))}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-56 text-muted-foreground gap-2 border-2 border-dashed rounded-lg">
          <FileSpreadsheet className="h-9 w-9 opacity-30" />
          <p className="text-sm">Download the template, fill it, and upload to preview here.</p>
          <p className="text-xs">Columns: {TEMPLATE_HEADERS.join(' · ')}</p>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
            <Badge variant="secondary">{orders.length} order(s)</Badge>
            <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> {validCount} ready</span>
            {unresolved > 0 && <span className="text-sm text-amber-600 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> {unresolved} to resolve</span>}
            <Button className="ml-auto gap-2" onClick={createAll} disabled={creating || validCount === 0}>
              {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
              Create {validCount} order(s)
            </Button>
          </div>

          {/* Preview — grouped by order */}
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.ref} className={cn('border rounded-lg overflow-hidden', orderValid(o) ? 'border-green-200' : 'border-amber-200')}>
                <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-muted/30">
                  <span className="font-semibold text-sm font-mono">{o.ref}</span>
                  <span className="text-xs text-muted-foreground">{o.items.length} item(s)</span>
                  <div className="ml-auto flex items-center gap-2 min-w-[260px]">
                    <span className="text-xs text-muted-foreground">Customer</span>
                    <div className="w-64">
                      <SearchableSelect
                        options={customerOptions}
                        value={o.customerId != null ? String(o.customerId) : ''}
                        onChange={(v) => setOrderCustomer(o.ref, v)}
                        placeholder={o.customerName ? `⚠ ${o.customerName}` : 'Select customer'}
                        searchPlaceholder="Search customer…"
                        emptyText="No customer"
                      />
                    </div>
                    {o.customerId != null
                      ? (o.customerAuto ? <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">matched</Badge> : <Badge variant="secondary" className="text-[10px]">picked</Badge>)
                      : <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">unmatched</Badge>}
                  </div>
                </div>
                <div className="divide-y">
                  {o.items.map((it) => (
                    <div key={it.rowNum} className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm">
                      <span className="text-xs text-muted-foreground w-12">Row {it.rowNum}</span>
                      <span className="text-xs w-56 shrink-0">{it.model} · {it.roller}{it.teeth ? ` · ${it.teeth}T` : ''}</span>
                      <span className="text-xs">Qty <b>{it.qty}</b></span>
                      <span className="text-xs text-muted-foreground">due {it.dueDate}</span>
                      <div className="ml-auto flex items-center gap-2">
                        <div className="w-80">
                          <SearchableSelect
                            options={productOptions}
                            value={it.productId != null ? String(it.productId) : ''}
                            onChange={(v) => setItemProduct(o.ref, it.rowNum, v)}
                            placeholder="Select product"
                            searchPlaceholder="Search part code / model…"
                            emptyText="No product"
                          />
                        </div>
                        {it.productId != null
                          ? (it.autoMatched ? <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">matched</Badge> : <Badge variant="secondary" className="text-[10px]">picked</Badge>)
                          : <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">unmatched</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
