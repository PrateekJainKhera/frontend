'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  PackageCheck,
  AlertTriangle,
  CheckCircle2,
  User,
  Calendar,
  Warehouse,
  Weight,
  Ruler,
  FileText,
  TrendingDown,
} from 'lucide-react'
import { MaterialRequisition, MaterialAllocation } from '@/types/material-issue'
import { mockMaterialAllocations } from '@/data/mock-material-requisitions'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface MaterialIssueDialogProps {
  open: boolean
  onClose: () => void
  requisition: MaterialRequisition | null
}

export function MaterialIssueDialog({
  open,
  onClose,
  requisition,
}: MaterialIssueDialogProps) {
  const [receivedBy, setReceivedBy] = useState('')
  const [notes, setNotes] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  if (!requisition) return null

  // Find allocation for this requisition
  const allocation = mockMaterialAllocations.find(
    alloc => alloc.requisitionId === requisition.requisitionId
  )

  if (!allocation) return null

  const handleIssue = () => {
    if (!receivedBy.trim()) {
      toast.error('Receiver required', {
        description: 'Please enter the name of the person receiving the materials',
      })
      return
    }

    if (!confirmed) {
      toast.error('Confirmation required', {
        description: 'Please confirm that you want to issue these materials',
      })
      return
    }

    // Simulate issue
    toast.success('Materials issued successfully', {
      description: `${allocation.totalPieces} pieces issued to ${requisition.jobCardNo}`,
    })

    onClose()
  }

  const material = requisition.materials[0]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-green-600" />
            Issue Materials - {requisition.requisitionNo}
          </DialogTitle>
          <DialogDescription>
            Confirm material issue and deduct from inventory
          </DialogDescription>
        </DialogHeader>

        {/* Warning Alert */}
        <Alert className="border-orange-300 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            <strong>Important:</strong> This action will deduct materials from inventory and mark them as "In Use".
            Ensure the receiver has confirmed before proceeding.
          </AlertDescription>
        </Alert>

        {/* Requisition Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Requisition Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Job Card</p>
                <p className="font-semibold">{requisition.jobCardNo}</p>
                <p className="text-xs text-muted-foreground">{requisition.orderNo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-semibold">{requisition.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                <Badge
                  variant={requisition.priority === 'High' ? 'destructive' : 'secondary'}
                >
                  {requisition.priority}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <p className="font-semibold">
                    {format(new Date(requisition.dueDate), 'dd MMM yyyy')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Material Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Material Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Material</p>
                <p className="font-semibold">{material.materialName}</p>
                <p className="text-xs text-muted-foreground">{material.materialGrade}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dimensions</p>
                <p className="font-semibold">Ø {material.dimensions.diameter}mm</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quantity Required</p>
                <p className="font-semibold">{material.quantityRequired} {material.unit}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Allocated By</p>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <p className="font-semibold">{allocation.allocatedByName}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Allocation Summary */}
        <Card className="border-green-300 bg-green-50">
          <CardHeader>
            <CardTitle className="text-base">Allocation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Pieces</p>
                <p className="text-2xl font-bold text-green-700">{allocation.totalPieces}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Length</p>
                <div className="flex items-center gap-1">
                  <Ruler className="h-4 w-4 text-green-600" />
                  <p className="text-2xl font-bold text-green-700">
                    {(allocation.totalAllocatedLength / 1000).toFixed(2)}m
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Weight</p>
                <div className="flex items-center gap-1">
                  <Weight className="h-4 w-4 text-green-600" />
                  <p className="text-2xl font-bold text-green-700">
                    {allocation.totalAllocatedWeight.toFixed(2)}kg
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expected Wastage</p>
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-4 w-4 text-orange-600" />
                  <p className="text-2xl font-bold text-orange-700">
                    {allocation.expectedWastagePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pieces to Issue */}
        <div>
          <h3 className="font-semibold mb-3">Pieces to Issue</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Piece Number</TableHead>
                  <TableHead>Allocated Length</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>GRN Details</TableHead>
                  <TableHead>Status Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocation.pieces.map((piece) => (
                  <TableRow key={piece.pieceId}>
                    <TableCell>
                      <span className="font-medium">{piece.pieceNumber}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Ruler className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{piece.allocatedLength}mm</span>
                        <span className="text-xs text-muted-foreground">
                          / {piece.currentLength}mm
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Weight className="h-3 w-3 text-muted-foreground" />
                        <span>{piece.weight.toFixed(2)}kg</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Warehouse className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{piece.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="font-medium">{piece.grn.grnNo}</span>
                        <span className="text-muted-foreground">{piece.grn.supplier}</span>
                        <span className="text-muted-foreground">
                          {format(new Date(piece.grn.receivedDate), 'dd MMM yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          Available
                        </Badge>
                        <span className="text-muted-foreground">→</span>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          In Use
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Issue Details */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="received-by">
              Received By <span className="text-red-500">*</span>
            </Label>
            <Input
              id="received-by"
              placeholder="Name of person receiving materials"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Production supervisor or operator name
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions or remarks"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="confirm"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="confirm" className="text-sm font-normal cursor-pointer">
              I confirm that the materials have been physically received and verified
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleIssue}
            disabled={!receivedBy.trim() || !confirmed}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Issue Materials
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
