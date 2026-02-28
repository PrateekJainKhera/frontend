"use client"

import { useState } from 'react'
import { MaterialResponse } from '@/lib/api/materials'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Eye, Trash2 } from 'lucide-react'
import { ViewRawMaterialDialog } from '@/components/dialogs/view-raw-material-dialog'
import { EditRawMaterialDialog } from '@/components/dialogs/edit-raw-material-dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { materialService } from '@/lib/api/materials'
import { toast } from 'sonner'

interface RawMaterialsTableProps {
  materials: MaterialResponse[]
  onUpdate?: () => void
}

export function RawMaterialsTable({ materials, onUpdate }: RawMaterialsTableProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialResponse | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MaterialResponse | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleView = (material: MaterialResponse) => {
    setSelectedMaterial(material)
    setViewDialogOpen(true)
  }

  const handleEdit = (material: MaterialResponse) => {
    setSelectedMaterial(material)
    setEditDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await materialService.delete(deleteTarget.id)
      toast.success(`"${deleteTarget.materialName}" deleted`)
      setDeleteTarget(null)
      onUpdate?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete material')
    } finally {
      setDeleting(false)
    }
  }

  if (materials.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No materials found</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Material Name</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Shape</TableHead>
            <TableHead>Diameter</TableHead>
            <TableHead>Length</TableHead>
            <TableHead>Weight/Unit</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materials.map((material) => (
            <TableRow key={material.id}>
              <TableCell className="font-medium">
                {material.materialName}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{material.grade}</Badge>
              </TableCell>
              <TableCell>{material.shape}</TableCell>
              <TableCell className="text-sm">⌀{material.diameter}mm</TableCell>
              <TableCell className="text-sm">{material.lengthInMM} mm ({material.lengthInMM / 1000} m)</TableCell>
              <TableCell className="font-mono text-sm">
                {material.weightKG.toFixed(2)} kg
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleView(material)} title="View Details">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(material)} title="Edit Material">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(material)} title="Delete Material">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialogs */}
      {selectedMaterial && (
        <>
          <ViewRawMaterialDialog
            material={selectedMaterial}
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
          />
          <EditRawMaterialDialog
            material={selectedMaterial}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSuccess={() => {
              setEditDialogOpen(false)
              onUpdate?.()
            }}
          />
        </>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.materialName}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
