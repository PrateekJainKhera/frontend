'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Package, Truck, CheckCircle2, AlertTriangle, RefreshCw, X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { dispatchService } from '@/lib/api/dispatch'
import { ReadyToDispatchItem, DeliveryChallanApi } from '@/types/dispatch'
import { formatDate } from '@/lib/utils/formatters'

export default function DispatchDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [readyItems, setReadyItems] = useState<ReadyToDispatchItem[]>([])
  const [challans, setChallans] = useState<DeliveryChallanApi[]>([])
  const [activeTab, setActiveTab] = useState('ready')
  const [searchQuery, setSearchQuery] = useState('')

  // Dialog state
  const [dispatchOpen, setDispatchOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ReadyToDispatchItem | null>(null)
  const [dispatching, setDispatching] = useState(false)
  const [dispatchError, setDispatchError] = useState('')

  // Form state
  const [qtyToDispatch, setQtyToDispatch] = useState('')
  const [dispatchDate, setDispatchDate] = useState('')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [remarks, setRemarks] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [ready, challanList] = await Promise.all([
      dispatchService.getReadyToDispatch(),
      dispatchService.getAllChallans(),
    ])
    setReadyItems(ready)
    setChallans(challanList)
    setLoading(false)
  }

  const openDispatch = (item: ReadyToDispatchItem) => {
    setSelectedItem(item)
    setQtyToDispatch(item.qtyPendingDispatch.toString())
    setDispatchDate(new Date().toISOString().split('T')[0])
    setInvoiceNo('')
    setInvoiceDate('')
    setRemarks('')
    setFile(null)
    setDispatchError('')
    setDispatchOpen(true)
  }

  const handleDispatch = async () => {
    if (!selectedItem) return
    const qty = parseInt(qtyToDispatch)
    if (isNaN(qty) || qty <= 0) {
      setDispatchError('Please enter a valid quantity')
      return
    }
    if (qty > selectedItem.qtyPendingDispatch) {
      setDispatchError(`Cannot dispatch more than ${selectedItem.qtyPendingDispatch} units`)
      return
    }
    if (!dispatchDate) {
      setDispatchError('Please select a dispatch date')
      return
    }

    setDispatching(true)
    setDispatchError('')

    const result = await dispatchService.simpleDispatch(
      {
        orderItemId: selectedItem.orderItemId,
        qtyToDispatch: qty,
        dispatchDate,
        invoiceNo: invoiceNo || undefined,
        invoiceDate: invoiceDate || undefined,
        remarks: remarks || undefined,
      },
      file ?? undefined
    )

    setDispatching(false)
    if (result.success) {
      setDispatchOpen(false)
      loadData()
    } else {
      setDispatchError(result.message)
    }
  }

  const dispatchedChallans = challans.filter(c => c.status === 'Dispatched')

  const filteredReadyItems = useMemo(() => {
    const q = searchQuery.toLowerCase()
    if (!q) return readyItems
    return readyItems.filter(i =>
      i.orderNo.toLowerCase().includes(q) ||
      (i.customerName ?? '').toLowerCase().includes(q) ||
      (i.productName ?? '').toLowerCase().includes(q) ||
      (i.partCode ?? '').toLowerCase().includes(q)
    )
  }, [readyItems, searchQuery])

  const filteredChallans = useMemo(() => {
    const q = searchQuery.toLowerCase()
    if (!q) return dispatchedChallans
    return dispatchedChallans.filter(c =>
      c.challanNo.toLowerCase().includes(q) ||
      c.orderNo.toLowerCase().includes(q) ||
      (c.customerName ?? '').toLowerCase().includes(q) ||
      (c.productName ?? '').toLowerCase().includes(q) ||
      (c.invoiceNo ?? '').toLowerCase().includes(q)
    )
  }, [dispatchedChallans, searchQuery])

  const stats = {
    readyCount: readyItems.length,
    totalPendingQty: readyItems.reduce((s, i) => s + i.qtyPendingDispatch, 0),
    dispatched: dispatchedChallans.length,
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Ready to Dispatch</p>
            <Package className="h-4 w-4 text-blue-600" />
          </div>
          <CardContent>
            <div className="text-2xl font-bold">{stats.readyCount}</div>
            <p className="text-xs text-muted-foreground">Order items with completed qty</p>
          </CardContent>
        </Card>
        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Pending Qty</p>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </div>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPendingQty}</div>
            <p className="text-xs text-muted-foreground">Units awaiting dispatch</p>
          </CardContent>
        </Card>
        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Dispatched Challans</p>
            <Truck className="h-4 w-4 text-green-600" />
          </div>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dispatched}</div>
            <p className="text-xs text-muted-foreground">Total challans created</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Search */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="grid max-w-md grid-cols-2">
            <TabsTrigger value="ready">Ready to Dispatch</TabsTrigger>
            <TabsTrigger value="challans">Dispatched Challans</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 bg-background border-2 border-border rounded-lg px-4 py-1 shadow-sm flex-1 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Search order, customer, product..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 h-8 px-0 text-sm flex-1 placeholder:text-muted-foreground/40 focus:placeholder:text-transparent caret-foreground"
            />
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={loadData} title="Refresh">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Ready to Dispatch Tab */}
        <TabsContent value="ready" className="mt-4">
          {readyItems.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border rounded-lg">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p className="font-medium">All dispatched!</p>
              <p className="text-sm">No items waiting for dispatch</p>
            </div>
          ) : filteredReadyItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg">
              No items match your search.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReadyItems.map((item) => (
                <div
                  key={item.orderItemId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <p className="font-semibold">{item.orderNo}-{item.itemSequence}</p>
                      {item.machineModel && <Badge variant="outline" className="text-xs">{item.machineModel}</Badge>}
                      {(item.rollerType || (item.numberOfTeeth ?? 0) > 0) && (
                        <span className="text-xs text-muted-foreground">
                          {[item.rollerType, (item.numberOfTeeth ?? 0) > 0 ? `${item.numberOfTeeth}T` : null].filter(Boolean).join(' · ')}
                        </span>
                      )}
                      {item.partCode && <span className="text-xs text-muted-foreground">({item.partCode})</span>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
                      <div>
                        <span className="block text-xs font-medium text-foreground">Customer</span>
                        {item.customerName ?? '—'}
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-foreground">Order Qty</span>
                        {item.quantity}
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-foreground">Completed</span>
                        {item.qtyCompleted}
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-foreground">Pending Dispatch</span>
                        <span className="text-orange-600 font-semibold">{item.qtyPendingDispatch}</span>
                      </div>
                    </div>
                    {item.dueDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {formatDate(item.dueDate)}
                      </p>
                    )}
                  </div>
                  <Button onClick={() => openDispatch(item)} className="ml-4">
                    <Truck className="mr-2 h-4 w-4" />
                    Dispatch
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Dispatched Challans Tab */}
        <TabsContent value="challans" className="mt-4">
          {dispatchedChallans.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border rounded-lg">
              <Truck className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="font-medium">No challans yet</p>
              <p className="text-sm">Dispatched challans will appear here</p>
            </div>
          ) : filteredChallans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg">
              No challans match your search.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredChallans.map((challan) => (
                <div
                  key={challan.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold">{challan.challanNo}</p>
                      <Badge variant="outline" className="border-green-500 text-green-700 text-xs">Dispatched</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
                      <div>
                        <span className="block text-xs font-medium text-foreground">Order</span>
                        {challan.orderNo}
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-foreground">Customer</span>
                        {challan.customerName ?? '—'}
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-foreground">Product</span>
                        {challan.productName ?? '—'}
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-foreground">Qty Dispatched</span>
                        {challan.quantityDispatched}
                      </div>
                      {challan.invoiceNo && (
                        <div>
                          <span className="block text-xs font-medium text-foreground">Invoice</span>
                          {challan.invoiceNo}
                        </div>
                      )}
                      <div>
                        <span className="block text-xs font-medium text-foreground">Date</span>
                        {formatDate(challan.challanDate)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dispatch Dialog */}
      <Dialog open={dispatchOpen} onOpenChange={setDispatchOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Dispatch Order Item</DialogTitle>
            <DialogDescription>
              {selectedItem && `${selectedItem.orderNo}-${selectedItem.itemSequence} — ${[selectedItem.machineModel, selectedItem.rollerType, (selectedItem.numberOfTeeth ?? 0) > 0 ? `${selectedItem.numberOfTeeth}T` : null].filter(Boolean).join(' · ') || selectedItem.partCode || selectedItem.productName || '—'}`}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{selectedItem.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Qty</span>
                  <span>{selectedItem.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span>{selectedItem.qtyCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Already Dispatched</span>
                  <span>{selectedItem.qtyDispatched}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Pending Dispatch</span>
                  <span className="text-orange-600">{selectedItem.qtyPendingDispatch}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="qty">Qty to Dispatch *</Label>
                  <Input
                    id="qty"
                    type="number"
                    min={1}
                    max={selectedItem.qtyPendingDispatch}
                    value={qtyToDispatch}
                    onChange={e => setQtyToDispatch(e.target.value)}
                    placeholder={`Max ${selectedItem.qtyPendingDispatch}`}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dispatchDate">Dispatch Date *</Label>
                  <Input
                    id="dispatchDate"
                    type="date"
                    value={dispatchDate}
                    onChange={e => setDispatchDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="invoiceNo">Invoice No</Label>
                  <Input
                    id="invoiceNo"
                    value={invoiceNo}
                    onChange={e => setInvoiceNo(e.target.value)}
                    placeholder="INV-001"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="invoiceDate">Invoice Date</Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={invoiceDate}
                    onChange={e => setInvoiceDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="invoiceDoc">Invoice Document (PDF/Image)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="invoiceDoc"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    ref={fileRef}
                    onChange={e => setFile(e.target.files?.[0] ?? null)}
                    className="flex-1"
                  />
                  {file && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = '' }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {file && <p className="text-xs text-muted-foreground">{file.name}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  rows={2}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Optional notes..."
                />
              </div>

              {dispatchError && (
                <p className="text-sm text-destructive">{dispatchError}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDispatchOpen(false)} disabled={dispatching}>
              Cancel
            </Button>
            <Button onClick={handleDispatch} disabled={dispatching}>
              {dispatching ? 'Dispatching...' : 'Confirm Dispatch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
