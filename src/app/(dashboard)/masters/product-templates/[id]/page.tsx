"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, ListTree, Edit, Trash2, Plus, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { productTemplateService, ProductTemplateResponse } from '@/lib/api/product-templates'
import { processTemplateService, ProcessTemplateWithStepsResponse } from '@/lib/api/process-templates'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function ProductTemplateDetailPage() {
  const params = useParams()
  const [template, setTemplate] = useState<ProductTemplateResponse | null>(null)
  const [processWithSteps, setProcessWithSteps] = useState<ProcessTemplateWithStepsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [addChildPartDialogOpen, setAddChildPartDialogOpen] = useState(false)
  const [editingChildPart, setEditingChildPart] = useState<any>(null)

  const loadTemplate = async () => {
    setLoading(true)
    try {
      const data = await productTemplateService.getById(Number(params.id))
      setTemplate(data)

      // Load process template with steps
      if (data?.processTemplateId) {
        try {
          const processData = await processTemplateService.getTemplateWithSteps(data.processTemplateId)
          setProcessWithSteps(processData)
        } catch {
          setProcessWithSteps(null)
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load product template'
      toast.error(message)
      setTemplate(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplate()
  }, [params.id])

  const getRollerTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'Magnetic Roller': 'bg-blue-100 text-blue-800',
      'Printing Roller': 'bg-orange-100 text-orange-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="space-y-6">
        <Card className="p-12">
          <div className="text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Template not found</h3>
            <p className="text-muted-foreground mb-4">
              The product template you're looking for doesn't exist
            </p>
            <Button asChild>
              <Link href="/masters/products">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Templates
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/masters/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">{template.templateName}</h1>
            <p className="text-muted-foreground">{template.templateCode}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Template Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Template Information</CardTitle>
              <CardDescription>Basic details about this product template</CardDescription>
            </div>
            <Badge className={getRollerTypeBadge(template.rollerType)}>
              {template.rollerType}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {template.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
              <p className="text-sm">{template.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
              <Badge variant={template.isActive ? "default" : "secondary"}>
                {template.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h3>
              <p className="text-sm">{new Date(template.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Child Parts BOM */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <div>
                <CardTitle>Child Parts Required</CardTitle>
                <CardDescription>Bill of Materials for this roller type</CardDescription>
              </div>
            </div>
            <Button size="sm" onClick={() => setAddChildPartDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Child Part
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-3 text-sm font-medium text-muted-foreground w-12">#</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Part Name</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Part Code</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Quantity</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Unit</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Notes</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Linked Template</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(template.bomItems || [])
                  .sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0))
                  .map((part) => {
                    return (
                      <tr key={part.id} className="border-b last:border-0">
                        <td className="py-3 text-sm text-muted-foreground">{part.sequenceNumber || '-'}</td>
                        <td className="py-3 text-sm font-medium">{part.childPartTemplateName}</td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {part.childPartTemplateCode || '-'}
                        </td>
                        <td className="py-3 text-sm">{part.quantity}</td>
                        <td className="py-3 text-sm text-muted-foreground">pcs</td>
                        <td className="py-3 text-sm text-muted-foreground max-w-xs truncate">
                          {part.notes || '-'}
                        </td>
                        <td className="py-3">
                          {part.childPartTemplateId ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-primary hover:text-primary"
                              asChild
                            >
                              <Link href={`/masters/child-part-templates/${part.childPartTemplateId}`}>
                                <LinkIcon className="h-3 w-3 mr-1" />
                                {part.childPartTemplateName}
                              </Link>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Not linked</span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setEditingChildPart(part)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Manufacturing Process */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTree className="h-5 w-5" />
              <div>
                <CardTitle>Manufacturing Process</CardTitle>
                <CardDescription>{template.processTemplateName}</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/masters/process-templates/${template.processTemplateId}`}>
                View Full Process
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {processWithSteps && processWithSteps.steps && processWithSteps.steps.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-3 text-sm font-medium text-muted-foreground w-12">Step</th>
                    <th className="pb-3 text-sm font-medium text-muted-foreground">Process Name</th>
                    <th className="pb-3 text-sm font-medium text-muted-foreground">Mandatory</th>
                    <th className="pb-3 text-sm font-medium text-muted-foreground">Can Be Parallel</th>
                  </tr>
                </thead>
                <tbody>
                  {processWithSteps.steps
                    .sort((a, b) => a.stepNo - b.stepNo)
                    .map((step) => (
                      <tr key={step.id} className="border-b last:border-0">
                        <td className="py-3 text-sm text-muted-foreground font-medium">{step.stepNo}</td>
                        <td className="py-3 text-sm font-medium">{step.processName || `Process ${step.processId}`}</td>
                        <td className="py-3 text-sm">
                          <Badge variant={step.isMandatory ? "default" : "secondary"} className="text-xs">
                            {step.isMandatory ? "Yes" : "No"}
                          </Badge>
                        </td>
                        <td className="py-3 text-sm">
                          <Badge variant={step.canBeParallel ? "default" : "secondary"} className="text-xs">
                            {step.canBeParallel ? "Yes" : "No"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No process steps defined</p>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Created At</h3>
            <p className="text-sm">{new Date(template.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Created By</h3>
            <p className="text-sm">{template.createdBy || '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Add Child Part Dialog */}
      <Dialog open={addChildPartDialogOpen} onOpenChange={setAddChildPartDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Child Part</DialogTitle>
            <DialogDescription>
              Add a new child part to this product template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Part Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., Shaft, Core, Sleeve"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Part Code</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., SHAFT-MAG-001"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit</label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option value="pcs">pcs</option>
                  <option value="kg">kg</option>
                  <option value="meter">meter</option>
                  <option value="set">set</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="Additional notes or specifications"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Link to Child Part Template (Optional)</label>
              <div className="flex gap-2">
                <select className="flex-1 px-3 py-2 border rounded-md">
                  <option value="">Select a template...</option>
                </select>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/masters/child-part-templates">
                    Browse
                  </Link>
                </Button>
              </div>
              {(
                <p className="text-xs text-muted-foreground">
                  No child part templates available for {template?.rollerType} rollers
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddChildPartDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setAddChildPartDialogOpen(false)}>
              Add Child Part
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Child Part Dialog */}
      <Dialog open={!!editingChildPart} onOpenChange={(open) => !open && setEditingChildPart(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Child Part</DialogTitle>
            <DialogDescription>
              Update child part details
            </DialogDescription>
          </DialogHeader>
          {editingChildPart && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Part Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    defaultValue={editingChildPart.childPartName}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Part Code</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    defaultValue={editingChildPart.childPartCode}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 border rounded-md"
                    defaultValue={editingChildPart.quantity}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit</label>
                  <select className="w-full px-3 py-2 border rounded-md" defaultValue={editingChildPart.unit}>
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="meter">meter</option>
                    <option value="set">set</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (Optional)</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  defaultValue={editingChildPart.notes}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Link to Child Part Template (Optional)</label>
                <div className="flex gap-2">
                  <select className="flex-1 px-3 py-2 border rounded-md">
                    <option value="">Select a template...</option>
                  </select>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/masters/child-part-templates">
                      Browse
                    </Link>
                  </Button>
                </div>
                {(
                  <p className="text-xs text-muted-foreground">
                    No child part templates available for {template?.rollerType} rollers
                  </p>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingChildPart(null)}>
              Cancel
            </Button>
            <Button onClick={() => setEditingChildPart(null)}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
