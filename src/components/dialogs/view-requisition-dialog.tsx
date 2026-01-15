'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileText,
  Calendar,
  User,
  Package,
  Ruler,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { MaterialRequisition, RequisitionStatus } from '@/types/material-issue'
import { format } from 'date-fns'

interface ViewRequisitionDialogProps {
  open: boolean
  onClose: () => void
  requisition: MaterialRequisition | null
}

export function ViewRequisitionDialog({
  open,
  onClose,
  requisition,
}: ViewRequisitionDialogProps) {
  if (!requisition) return null

  const getStatusBadge = (status: RequisitionStatus) => {
    const variants: Record<RequisitionStatus, { className: string }> = {
      'Pending': { className: 'bg-orange-100 text-orange-800 border-orange-300' },
      'Partial': { className: 'bg-blue-100 text-blue-800 border-blue-300' },
      'Allocated': { className: 'bg-purple-100 text-purple-800 border-purple-300' },
      'Issued': { className: 'bg-green-100 text-green-800 border-green-300' },
      'Cancelled': { className: 'bg-gray-100 text-gray-800 border-gray-300' },
    }
    const config = variants[status]
    return <Badge variant="outline" className={config.className}>{status}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', className: string }> = {
      'High': { variant: 'destructive', className: '' },
      'Medium': { variant: 'outline', className: 'border-yellow-500 text-yellow-700 bg-yellow-50' },
      'Low': { variant: 'secondary', className: '' },
    }
    const config = variants[priority]
    return <Badge variant={config.variant} className={config.className}>{priority}</Badge>
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Requisition Details - {requisition.requisitionNo}
          </DialogTitle>
          <DialogDescription>
            View complete details of material requisition
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Priority */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              {getStatusBadge(requisition.status)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Priority:</span>
              {getPriorityBadge(requisition.priority)}
            </div>
          </div>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Requisition Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Requisition No</p>
                  <p className="font-semibold">{requisition.requisitionNo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requisition Date</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <p className="font-semibold">
                      {format(new Date(requisition.requisitionDate), 'dd MMM yyyy')}
                    </p>
                  </div>
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

          {/* Job Card & Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Job Card & Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Job Card No</p>
                  <p className="font-semibold">{requisition.jobCardNo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order No</p>
                  <p className="font-semibold">{requisition.orderNo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-semibold">{requisition.customerName}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Material Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Material Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Dimensions</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Allocated</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Pending</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requisition.materials.map((material, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{material.materialName}</p>
                            <p className="text-xs text-muted-foreground">{material.materialType}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{material.materialGrade}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Ruler className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            Ø{material.dimensions.diameter}mm × {material.dimensions.length}mm
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{material.quantityRequired} {material.unit}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          <span>{material.quantityAllocated} {material.unit}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-blue-600" />
                          <span>{material.quantityIssued} {material.unit}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {material.quantityPending > 0 ? (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-orange-600" />
                            <span className="text-orange-600">{material.quantityPending} {material.unit}</span>
                          </div>
                        ) : (
                          <span className="text-green-600">Complete</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Request Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Requested By</p>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <p className="font-semibold">{requisition.requestedByName}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created At</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <p className="font-semibold">
                      {format(new Date(requisition.createdAt), 'dd MMM yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </div>

              {requisition.notes && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm p-3 bg-gray-50 rounded-md">{requisition.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold">{requisition.totalItems}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Allocated</p>
                  <p className="text-2xl font-bold text-purple-600">{requisition.allocatedItems}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Issued</p>
                  <p className="text-2xl font-bold text-green-600">{requisition.issuedItems}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">{requisition.pendingItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
