"use client"

import { Suspense, useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronDown, ChevronUp, Check, Search, Loader2 } from 'lucide-react'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { purchaseRequestService, CreatePRItemRequest, CuttingListItemRequest } from '@/lib/api/purchase-requests'
import { componentService } from '@/lib/api/components'
import { inventoryService } from '@/lib/api/inventory'
import { materialPieceService } from '@/lib/api/material-pieces'
import { toast } from 'sonner'

interface CuttingRow extends CuttingListItemRequest {
  _key: string
}

interface PRItem extends CreatePRItemRequest {
  _key: string
  _cuttingList: CuttingRow[]
  _showCutting: boolean
}

interface CatalogItem {
  id: number
  name: string
  code: string
  unit: string
}

function CreatePurchaseRequestContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const defaultType = searchParams.get('itemType') || 'Component'
  const preloadItemId = searchParams.get('itemId')
  const preloadItemName = searchParams.get('itemName')
  const preloadQty = searchParams.get('qty')

  const [itemType, setItemType] = useState(defaultType)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<PRItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Catalog + search
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [stockMap, setStockMap] = useState<Record<number, any>>({})
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (preloadItemId && preloadItemName) {
      setItems([{
        _key: Date.now().toString(),
        _cuttingList: [],
        _showCutting: defaultType === 'RawMaterial',
        itemType: defaultType,
        itemId: parseInt(preloadItemId),
        itemName: decodeURIComponent(preloadItemName),
        itemCode: searchParams.get('itemCode') || undefined,
        unit: defaultType === 'RawMaterial' ? 'meter' : decodeURIComponent(searchParams.get('unit') || 'pcs'),
        requestedQty: parseFloat(preloadQty || '1'),
      }])
    }
  }, [])

  // Load full catalog when itemType changes
  useEffect(() => {
    setCatalog([])
    setStockMap({})
    setSearchTerm('')
    loadCatalog()
  }, [itemType])

  const loadCatalog = async () => {
    setCatalogLoading(true)
    try {
      let mapped: CatalogItem[] = []
      if (itemType === 'Component') {
        const results = await componentService.getAll()
        mapped = results.map((c: any) => ({ id: c.id, name: c.componentName, code: c.partNumber || '', unit: c.unit || 'pcs' }))
      } else {
        const { materialService } = await import('@/lib/api/materials')
        const results = await materialService.getAll()
        mapped = results.map((m: any) => ({ id: m.id, name: m.materialName, code: m.materialCode || '', unit: 'meter' }))
      }
      setCatalog(mapped)

      // Fetch stock for all catalog items in background
      const stockEntries = await Promise.all(
        mapped.map(async (r) => {
          try {
            if (itemType === 'Component') {
              const s = await inventoryService.getComponentStock(r.id)
              return [r.id, { qty: s.currentStock, unit: s.uom }]
            } else {
              const s = await materialPieceService.getStockSummary(r.id)
              return [r.id, s]
            }
          } catch {
            return [r.id, null]
          }
        })
      )
      setStockMap(Object.fromEntries(stockEntries))
    } catch {
      toast.error('Failed to load items')
    } finally {
      setCatalogLoading(false)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Filtered list based on search term
  const filtered = searchTerm.trim()
    ? catalog.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : catalog

  const addItem = (result: CatalogItem) => {
    const alreadyAdded = items.some(i => i.itemId === result.id && i.itemType === itemType)
    if (alreadyAdded) { toast.warning('Item already added'); return }
    setItems(prev => [...prev, {
      _key: Date.now().toString(),
      _cuttingList: [],
      _showCutting: itemType === 'RawMaterial',
      itemType,
      itemId: result.id,
      itemName: result.name,
      itemCode: result.code,
      unit: itemType === 'RawMaterial' ? 'meter' : (result.unit || 'pcs'),
      requestedQty: 1,
    }])
    setSearchTerm('')
    setDropdownOpen(false)
  }

  const updateQty = (key: string, qty: number) => {
    setItems(prev => prev.map(i => i._key === key ? { ...i, requestedQty: qty } : i))
  }

  const removeItem = (key: string) => {
    setItems(prev => prev.filter(i => i._key !== key))
  }

  const toggleCutting = (key: string) => {
    setItems(prev => prev.map(i => i._key === key ? { ...i, _showCutting: !i._showCutting } : i))
  }

  const addCuttingRow = (itemKey: string) => {
    setItems(prev => prev.map(i => i._key === itemKey
      ? { ...i, _cuttingList: [...i._cuttingList, { _key: Date.now().toString(), lengthMeter: 1, pieces: 1 }] }
      : i
    ))
  }

  const updateCuttingRow = (itemKey: string, rowKey: string, field: 'lengthMeter' | 'pieces', value: number) => {
    setItems(prev => prev.map(i => i._key === itemKey
      ? { ...i, _cuttingList: i._cuttingList.map(r => r._key === rowKey ? { ...r, [field]: value } : r) }
      : i
    ))
  }

  const removeCuttingRow = (itemKey: string, rowKey: string) => {
    setItems(prev => prev.map(i => i._key === itemKey
      ? { ...i, _cuttingList: i._cuttingList.filter(r => r._key !== rowKey) }
      : i
    ))
  }

  const getCuttingTotal = (rows: CuttingRow[]) =>
    rows.reduce((sum, r) => sum + (r.lengthMeter * r.pieces), 0)

  const handleSubmit = async (submitAndSave: boolean) => {
    if (items.length === 0) { toast.error('Add at least one item'); return }
    const invalidQty = items.find(i => !i.requestedQty || i.requestedQty <= 0)
    if (invalidQty) { toast.error(`Invalid quantity for ${invalidQty.itemName}`); return }

    setIsSubmitting(true)
    try {
      const prId = await purchaseRequestService.create({
        itemType,
        notes: notes || undefined,
        items: items.map(({ _key, _cuttingList, _showCutting, ...rest }) => ({
          ...rest,
          cuttingList: _cuttingList.length > 0
            ? _cuttingList.map(({ _key: _rk, ...r }) => r)
            : undefined,
        })),
      })

      if (submitAndSave) {
        await purchaseRequestService.submit(prId)
        toast.success('Purchase Request created and submitted!')
      } else {
        toast.success('Purchase Request saved as Draft')
      }
      router.push(`/procurement/purchase-requests/${prId}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create PR')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Create Purchase Request</h1>
          <p className="text-muted-foreground text-sm">Create a new purchase request for approval</p>
        </div>
        <Button variant="outline" asChild className="self-start">
          <Link href="/procurement/purchase-requests">← Back</Link>
        </Button>
      </div>

      {/* PR Type */}
      <Card className="border-2 border-border">
        <CardHeader><CardTitle>Request Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Item Type *</label>
              <Select value={itemType} onValueChange={(v) => { setItemType(v); setItems([]) }}
                disabled={items.length > 0}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Component">Component</SelectItem>
                  <SelectItem value="RawMaterial">Raw Material</SelectItem>
                </SelectContent>
              </Select>
              {items.length > 0 && <p className="text-xs text-muted-foreground mt-1">Clear items to change type</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Notes</label>
              <Textarea placeholder="Reason for request..." value={notes}
                onChange={(e) => setNotes(e.target.value)} className="min-h-10 resize-none" rows={1} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Items */}
      <Card className="border-2 border-border">
        <CardHeader><CardTitle>Add Items</CardTitle></CardHeader>
        <CardContent>
          <div ref={dropdownRef} className="relative">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                placeholder={catalogLoading
                  ? 'Loading items...'
                  : `Search ${itemType === 'Component' ? 'components' : 'raw materials'} by name or code...`
                }
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setDropdownOpen(true) }}
                onFocus={() => setDropdownOpen(true)}
                className="pl-9 pr-9"
                disabled={catalogLoading}
              />
              {catalogLoading
                ? <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                : catalog.length > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {filtered.length}/{catalog.length}
                  </span>
                )
              }
            </div>

            {/* Dropdown list */}
            {dropdownOpen && !catalogLoading && catalog.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg overflow-hidden">
                <div className="overflow-y-auto max-h-72">
                  {filtered.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">No results for "{searchTerm}"</div>
                  ) : (
                    filtered.map(result => {
                      const alreadyAdded = items.some(i => i.itemId === result.id && i.itemType === itemType)
                      const stock = stockMap[result.id]
                      return (
                        <button
                          key={result.id}
                          type="button"
                          onMouseDown={e => { e.preventDefault(); if (!alreadyAdded) addItem(result) }}
                          disabled={alreadyAdded}
                          className={`w-full text-left px-4 py-2.5 border-b border-border/50 last:border-0 transition-colors
                            ${alreadyAdded
                              ? 'bg-muted/40 cursor-not-allowed opacity-60'
                              : 'hover:bg-accent cursor-pointer'
                            }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{result.name}</p>
                              <p className="text-xs text-muted-foreground">{result.code} · {result.unit}</p>
                              {stock && (
                                itemType === 'Component' ? (
                                  <p className={`text-xs font-semibold mt-0.5 ${stock.qty > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    Stock: {stock.qty} {stock.unit}
                                  </p>
                                ) : (
                                  <p className={`text-xs font-semibold mt-0.5 ${stock.pieces > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    Stock: {stock.pieces} pcs · {stock.totalLengthMM.toFixed(0)} mm · {stock.totalWeightKG.toFixed(3)} kg
                                  </p>
                                )
                              )}
                            </div>
                            {alreadyAdded && <Check className="h-4 w-4 text-green-500 shrink-0" />}
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
                <div className="px-3 py-1.5 bg-muted/30 border-t text-xs text-muted-foreground">
                  {filtered.length} item{filtered.length !== 1 ? 's' : ''} · Click to add
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      {items.length > 0 && (
        <Card className="border-2 border-border">
          <CardHeader><CardTitle>Items ({items.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => {
                const cuttingTotal = getCuttingTotal(item._cuttingList)
                const qtyMismatch = item.itemType === 'RawMaterial' && item._cuttingList.length > 0 && Math.abs(cuttingTotal - item.requestedQty) > 0.001

                return (
                  <div key={item._key} className="border rounded-lg overflow-hidden">
                    {/* Item row */}
                    <div className="flex flex-wrap items-center gap-2 p-3">
                      <div className="flex-1 min-w-0 basis-full sm:basis-auto">
                        <p className="font-medium text-sm">{item.itemName}</p>
                        <p className="text-xs text-muted-foreground">{item.itemCode}</p>
                        {(() => {
                          const stock = stockMap[item.itemId]
                          if (!stock) return null
                          if (item.itemType === 'Component') {
                            return (
                              <p className={`text-xs font-semibold mt-0.5 ${stock.qty > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                Stock: {stock.qty} {stock.unit}
                              </p>
                            )
                          }
                          return (
                            <p className={`text-xs font-semibold mt-0.5 ${stock.pieces > 0 ? 'text-green-600' : 'text-red-500'}`}>
                              Stock: {stock.pieces} pcs · {stock.totalLengthMM.toFixed(0)} mm · {stock.totalWeightKG.toFixed(3)} kg
                            </p>
                          )
                        })()}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-muted-foreground whitespace-nowrap">Qty:</label>
                        <Input
                          type="number"
                          value={item.requestedQty}
                          onChange={(e) => updateQty(item._key, parseFloat(e.target.value) || 1)}
                          className="w-24"
                          min={0.001}
                          step={0.001}
                        />
                        <Badge variant="outline" className="text-xs">{item.unit}</Badge>
                      </div>
                      {item.itemType === 'RawMaterial' && (
                        <Button variant="ghost" size="sm" onClick={() => toggleCutting(item._key)}
                          className="text-xs text-blue-600">
                          {item._showCutting ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                          Cutting List
                          {item._cuttingList.length > 0 && ` (${item._cuttingList.length})`}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => removeItem(item._key)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    {/* Cutting list panel */}
                    {item.itemType === 'RawMaterial' && item._showCutting && (
                      <div className="border-t bg-blue-50/50 p-3 space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-blue-700">Cutting List</p>
                          {item._cuttingList.length > 0 && (
                            <p className={`text-xs font-medium ${qtyMismatch ? 'text-red-600' : 'text-green-600'}`}>
                              Total: {cuttingTotal.toFixed(3)}m
                              {qtyMismatch && ` ≠ ${item.requestedQty}m (mismatch)`}
                              {!qtyMismatch && ` = ${item.requestedQty}m ✓`}
                            </p>
                          )}
                        </div>

                        {item._cuttingList.length > 0 && (
                          <div className="space-y-1">
                            <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 text-xs text-muted-foreground px-1 mb-1">
                              <span>Length (m)</span>
                              <span>× Pieces</span>
                              <span>= Total</span>
                              <span></span>
                            </div>
                            {item._cuttingList.map((row) => (
                              <div key={row._key} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
                                <Input
                                  type="number"
                                  value={row.lengthMeter}
                                  onChange={(e) => updateCuttingRow(item._key, row._key, 'lengthMeter', parseFloat(e.target.value) || 0)}
                                  className="h-8 text-sm"
                                  min={0.001}
                                  step={0.001}
                                  placeholder="Length"
                                />
                                <Input
                                  type="number"
                                  value={row.pieces}
                                  onChange={(e) => updateCuttingRow(item._key, row._key, 'pieces', parseInt(e.target.value) || 1)}
                                  className="h-8 text-sm"
                                  min={1}
                                  step={1}
                                  placeholder="Pcs"
                                />
                                <div className="h-8 flex items-center text-sm font-medium text-gray-600 px-1 whitespace-nowrap">
                                  {(row.lengthMeter * row.pieces).toFixed(3)}m
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8"
                                  onClick={() => removeCuttingRow(item._key, row._key)}>
                                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <Button variant="outline" size="sm" className="h-8 text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                          onClick={() => addCuttingRow(item._key)}>
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Add Row
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-end">
        <Button variant="outline" asChild disabled={isSubmitting}>
          <Link href="/procurement/purchase-requests">Cancel</Link>
        </Button>
        <Button variant="outline" onClick={() => handleSubmit(false)} disabled={isSubmitting || items.length === 0}>
          Save as Draft
        </Button>
        <Button onClick={() => handleSubmit(true)} disabled={isSubmitting || items.length === 0}>
          {isSubmitting ? 'Saving...' : 'Create & Submit'}
        </Button>
      </div>
    </div>
  )
}

export default function CreatePurchaseRequestPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
      <CreatePurchaseRequestContent />
    </Suspense>
  )
}
