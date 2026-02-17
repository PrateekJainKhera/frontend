"use client"

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronDown, ChevronUp, ChevronsUpDown, Check } from 'lucide-react'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { purchaseRequestService, CreatePRItemRequest, CuttingListItemRequest } from '@/lib/api/purchase-requests'
import { componentService } from '@/lib/api/components'
import { toast } from 'sonner'

interface CuttingRow extends CuttingListItemRequest {
  _key: string
}

interface PRItem extends CreatePRItemRequest {
  _key: string
  _cuttingList: CuttingRow[]
  _showCutting: boolean
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

  const [comboOpen, setComboOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const doSearch = useCallback(async (term: string) => {
    if (!term.trim()) { setSearchResults([]); return }
    setSearching(true)
    try {
      if (itemType === 'Component') {
        const results = await componentService.search(term)
        setSearchResults(results.map(c => ({ id: c.id, name: c.componentName, code: c.partNumber, unit: c.unit })))
      } else {
        const { materialService } = await import('@/lib/api/materials')
        const results = await materialService.searchByName(term)
        setSearchResults(results.map((m: any) => ({ id: m.id, name: m.materialName, code: m.materialCode, unit: 'meter' })))
      }
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [itemType])

  const handleComboSearch = (value: string) => {
    setSearchTerm(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(value), 350)
  }

  const addItem = (result: any) => {
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
    setSearchResults([])
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

  // Cutting list row operations
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
              <Select value={itemType} onValueChange={(v) => { setItemType(v); setItems([]); setSearchResults([]) }}
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
          <Popover open={comboOpen} onOpenChange={setComboOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between" role="combobox">
                <span className="text-muted-foreground">
                  {`Search and select ${itemType === 'Component' ? 'component' : 'raw material'}...`}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder={`Type to search ${itemType === 'Component' ? 'components' : 'raw materials'}...`}
                  value={searchTerm}
                  onValueChange={handleComboSearch}
                />
                <CommandList className="max-h-64">
                  {searching && (
                    <div className="py-6 text-center text-sm text-muted-foreground">Searching...</div>
                  )}
                  {!searching && searchTerm.length > 0 && searchResults.length === 0 && (
                    <CommandEmpty>No results found.</CommandEmpty>
                  )}
                  {!searching && searchResults.length > 0 && (
                    <CommandGroup>
                      {searchResults.map(result => {
                        const alreadyAdded = items.some(i => i.itemId === result.id && i.itemType === itemType)
                        return (
                          <CommandItem
                            key={result.id}
                            value={result.id.toString()}
                            onSelect={() => {
                              addItem(result)
                              setComboOpen(false)
                              setSearchTerm('')
                              setSearchResults([])
                            }}
                            disabled={alreadyAdded}
                            className="flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium text-sm">{result.name}</p>
                              <p className="text-xs text-muted-foreground">{result.code} • {result.unit}</p>
                            </div>
                            {alreadyAdded && <Check className="h-4 w-4 text-green-500 shrink-0" />}
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  )}
                  {!searching && searchTerm.length === 0 && (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Start typing to search...
                    </div>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
                          <span className="hidden xs:inline">Cutting List </span>
                          {item._cuttingList.length > 0 && `(${item._cuttingList.length})`}
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
