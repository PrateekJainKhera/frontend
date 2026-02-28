"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, PackageCheck, AlertCircle, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import {
  componentIssueService,
  ComponentIssueResponse,
  ComponentWithStock,
} from "@/lib/api/component-issues"

export default function ComponentIssuePage() {
  const [components, setComponents] = useState<ComponentWithStock[]>([])
  const [issues, setIssues] = useState<ComponentIssueResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [historySearch, setHistorySearch] = useState("")

  // Form state
  const [componentId, setComponentId] = useState("")
  const [issuedQty, setIssuedQty] = useState("")
  const [requestedBy, setRequestedBy] = useState("")
  const [issuedBy, setIssuedBy] = useState("")
  const [remarks, setRemarks] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [comps, hist] = await Promise.all([
        componentIssueService.getComponentsWithStock(),
        componentIssueService.getAll(),
      ])
      setComponents(comps)
      setIssues(hist)
    } catch {
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setComponentId("")
    setIssuedQty("")
    setRequestedBy("")
    setIssuedBy("")
    setRemarks("")
  }

  const handleSubmit = async () => {
    if (!componentId) { toast.error("Please select a component"); return }

    const qty = parseFloat(issuedQty)
    if (!qty || qty <= 0) { toast.error("Please enter a valid quantity"); return }

    const selected = components.find(c => c.id.toString() === componentId)
    if (selected && qty > selected.availableStock) {
      toast.error(
        `Insufficient stock. Available: ${selected.availableStock} ${selected.unit}`,
        { description: "You cannot issue more than the available stock." }
      )
      return
    }

    if (!requestedBy.trim()) { toast.error("Please enter who requested this issue"); return }
    if (!issuedBy.trim()) { toast.error("Please enter who is issuing"); return }

    setSubmitting(true)
    try {
      const result = await componentIssueService.create({
        componentId: parseInt(componentId),
        issuedQty: qty,
        requestedBy: requestedBy.trim(),
        issuedBy: issuedBy.trim(),
        remarks: remarks.trim() || undefined,
        createdBy: issuedBy.trim(),
      })
      toast.success(`Issued successfully — ${result.issueNo}`, {
        description: `${qty} ${result.unit} of ${result.componentName} issued to production`
      })
      resetForm()
      // Refresh both — stock numbers change after issue
      const [comps, hist] = await Promise.all([
        componentIssueService.getComponentsWithStock(),
        componentIssueService.getAll(),
      ])
      setComponents(comps)
      setIssues(hist)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to issue component")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredIssues = useMemo(() => {
    const q = historySearch.toLowerCase()
    if (!q) return issues
    return issues.filter(i =>
      i.issueNo.toLowerCase().includes(q) ||
      i.componentName.toLowerCase().includes(q) ||
      i.partNumber?.toLowerCase().includes(q) ||
      i.requestedBy.toLowerCase().includes(q) ||
      i.issuedBy.toLowerCase().includes(q)
    )
  }, [issues, historySearch])

  const selectedComponent = components.find(c => c.id.toString() === componentId)
  const enteredQty = parseFloat(issuedQty) || 0
  const isOverStock = selectedComponent != null && enteredQty > 0 && enteredQty > selectedComponent.availableStock

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <PackageCheck className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Component Issue</h1>
          <p className="text-sm text-muted-foreground">
            Issue components (magnets, bearings, etc.) to production. Stock is deducted on issue.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Issue Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              New Issue
            </CardTitle>
            <CardDescription>
              Only components with available stock are listed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Component */}
            <div className="space-y-2">
              <Label>Component *</Label>
              {components.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No components with available stock. Please receive components first.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select value={componentId} onValueChange={setComponentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select component..." />
                  </SelectTrigger>
                  <SelectContent>
                    {components.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        <div className="flex flex-col">
                          <span>{c.componentName}</span>
                          <span className="text-xs text-muted-foreground">
                            {c.partNumber} · Stock: {c.availableStock} {c.unit}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Stock info card */}
              {selectedComponent && (
                <div className="rounded-md border bg-muted/40 px-3 py-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Part No</span>
                    <span className="font-medium font-mono">{selectedComponent.partNumber}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Category</span>
                    <span>{selectedComponent.category}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Location</span>
                    <span>{selectedComponent.stockLocation || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Source</span>
                    {selectedComponent.sourceRef ? (
                      selectedComponent.sourceRef.startsWith("OS-") ? (
                        <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-100">
                          Opening Stock
                        </Badge>
                      ) : (
                        <Badge className="text-xs bg-green-100 text-green-700 border-green-300 hover:bg-green-100">
                          GRN Inward
                        </Badge>
                      )
                    ) : (
                      <Badge variant="outline" className="text-xs">Unknown</Badge>
                    )}
                  </div>
                  {selectedComponent.sourceRef && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Ref No</span>
                      <span className="font-mono text-muted-foreground">{selectedComponent.sourceRef}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm font-semibold border-t pt-1 mt-1">
                    <span>Available Stock</span>
                    <span className="text-green-600">
                      {selectedComponent.availableStock} {selectedComponent.unit}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label>Quantity Issued *</Label>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder={`Enter qty in ${selectedComponent?.unit ?? 'units'}`}
                value={issuedQty}
                onChange={e => setIssuedQty(e.target.value)}
                className={isOverStock ? "border-destructive" : ""}
              />
              {isOverStock && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Cannot exceed available stock ({selectedComponent!.availableStock} {selectedComponent!.unit})
                </p>
              )}
            </div>

            {/* Requested By */}
            <div className="space-y-2">
              <Label>Requested By *</Label>
              <Input
                placeholder="Name of person who requested"
                value={requestedBy}
                onChange={e => setRequestedBy(e.target.value)}
              />
            </div>

            {/* Issued By */}
            <div className="space-y-2">
              <Label>Issued By *</Label>
              <Input
                placeholder="Storekeeper / issuer name"
                value={issuedBy}
                onChange={e => setIssuedBy(e.target.value)}
              />
            </div>

            {/* Remarks */}
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                placeholder="Optional notes (e.g. 1 box = 100 pcs)"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={submitting || isOverStock || components.length === 0}
              >
                {submitting ? "Issuing..." : "Issue & Deduct Stock"}
              </Button>
              <Button variant="outline" onClick={resetForm} disabled={submitting}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Issue History */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Issue History</CardTitle>
                <CardDescription>All component issues recorded</CardDescription>
              </div>
              <div className="relative w-56 shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search issues..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 pl-8 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {issues.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                No component issues recorded yet.
              </p>
            ) : filteredIssues.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                No issues match your search.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Issue No</TableHead>
                      <TableHead>Component</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Issued By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIssues.map(issue => (
                      <TableRow key={issue.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {issue.issueNo}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{issue.componentName}</div>
                          {issue.partNumber && (
                            <div className="text-xs text-muted-foreground">{issue.partNumber}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {issue.issuedQty} {issue.unit}
                        </TableCell>
                        <TableCell className="text-sm">{issue.requestedBy}</TableCell>
                        <TableCell className="text-sm">{issue.issuedBy}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {issue.issueDate}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">
                          {issue.remarks ?? '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
