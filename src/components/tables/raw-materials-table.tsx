"use client"

import { useState } from 'react'
import { RawMaterial } from '@/types'
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
import { Edit, Eye } from 'lucide-react'
import { ViewRawMaterialDialog } from '@/components/dialogs/view-raw-material-dialog'
import { EditRawMaterialDialog } from '@/components/dialogs/edit-raw-material-dialog'

interface RawMaterialsTableProps {
  materials: RawMaterial[]
  onUpdate?: () => void
}

export function RawMaterialsTable({ materials, onUpdate }: RawMaterialsTableProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const handleView = (material: RawMaterial) => {
    setSelectedMaterial(material)
    setViewDialogOpen(true)
  }

  const handleEdit = (material: RawMaterial) => {
    setSelectedMaterial(material)
    setEditDialogOpen(true)
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
              <TableCell className="text-sm">{material.lengthInMM}mm</TableCell>
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
    </div>
  )
}
