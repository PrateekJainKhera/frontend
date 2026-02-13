'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { machineModelService } from '@/lib/api/machine-models'
import { MachineModel } from '@/types/machine-model'

export default function MachineModelsPage() {
  const [models, setModels] = useState<MachineModel[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<MachineModel | null>(null)
  const [formData, setFormData] = useState({ modelName: '', isActive: true })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadModels()
  }, [])

  const loadModels = async () => {
    setLoading(true)
    try {
      const data = await machineModelService.getAll()
      setModels(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load models'
      toast.error(message)
      setModels([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.modelName.trim()) {
      toast.error('Model name is required')
      return
    }

    setIsSubmitting(true)
    try {
      await machineModelService.create({ modelName: formData.modelName })
      toast.success('Machine model created successfully')
      setIsCreateDialogOpen(false)
      setFormData({ modelName: '', isActive: true })
      loadModels()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create model'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedModel || !formData.modelName.trim()) {
      toast.error('Model name is required')
      return
    }

    setIsSubmitting(true)
    try {
      await machineModelService.update(selectedModel.id, {
        id: selectedModel.id,
        modelName: formData.modelName,
        isActive: formData.isActive
      })
      toast.success('Machine model updated successfully')
      setIsEditDialogOpen(false)
      setSelectedModel(null)
      setFormData({ modelName: '', isActive: true })
      loadModels()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update model'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedModel) return

    setIsSubmitting(true)
    try {
      await machineModelService.delete(selectedModel.id)
      toast.success('Machine model deleted successfully')
      setIsDeleteDialogOpen(false)
      setSelectedModel(null)
      loadModels()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete model'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (model: MachineModel) => {
    setSelectedModel(model)
    setFormData({ modelName: model.modelName, isActive: model.isActive })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (model: MachineModel) => {
    setSelectedModel(model)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Machine Models</h2>
          <p className="text-muted-foreground">Manage machine model master data</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Model
        </Button>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Total Models</CardDescription>
            <CardTitle className="text-2xl">{models.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Active Models</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {models.filter(m => m.isActive).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Total Products</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {models.reduce((sum, m) => sum + (m.productCount || 0), 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model Name</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : models.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No machine models found. Click "Add Model" to create one.
                </TableCell>
              </TableRow>
            ) : (
              models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium">{model.modelName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{model.productCount || 0} products</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={model.isActive ? 'default' : 'secondary'}>
                      {model.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{model.createdBy}</TableCell>
                  <TableCell>{new Date(model.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(model)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(model)}
                        disabled={(model.productCount ?? 0) > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Machine Model</DialogTitle>
            <DialogDescription>Add a new machine model to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="modelName">Model Name *</Label>
              <Input
                id="modelName"
                placeholder="e.g., Roller Mill 500"
                value={formData.modelName}
                onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Machine Model</DialogTitle>
            <DialogDescription>Update machine model details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editModelName">Model Name *</Label>
              <Input
                id="editModelName"
                placeholder="e.g., Roller Mill 500"
                value={formData.modelName}
                onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the machine model "{selectedModel?.modelName}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
