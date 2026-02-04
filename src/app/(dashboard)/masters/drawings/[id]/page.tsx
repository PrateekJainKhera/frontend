"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Edit,
  Download,
  Eye,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Package,
  ShoppingCart,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Drawing } from '@/lib/mock-data'
import { drawingService, DrawingResponse } from '@/lib/api/drawings'

const FILE_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5217/api').replace('/api', '')

export default function DrawingDetailPage() {
  const params = useParams()
  const [drawing, setDrawing] = useState<Drawing | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDrawing()
  }, [params.id])

  const mapToDrawing = (d: DrawingResponse): Drawing => ({
    id: String(d.id),
    drawingNumber: d.drawingNumber,
    drawingName: d.drawingName,
    drawingType: d.drawingType as Drawing['drawingType'],
    revision: d.revision || '',
    revisionDate: d.revisionDate || '',
    status: d.status as Drawing['status'],
    fileName: d.fileName || '',
    fileType: (d.fileType === 'pdf' ? 'pdf' : d.fileType === 'dwg' ? 'dwg' : 'image') as Drawing['fileType'],
    fileUrl: d.fileUrl || '',
    fileSize: d.fileSize || 0,
    manufacturingDimensions: d.manufacturingDimensionsJSON ? JSON.parse(d.manufacturingDimensionsJSON) : undefined,
    linkedPartId: d.linkedPartId?.toString(),
    linkedProductId: d.linkedProductId?.toString(),
    linkedCustomerId: d.linkedCustomerId?.toString(),
    description: d.description || '',
    notes: d.notes,
    createdBy: d.createdBy || '',
    createdAt: d.createdAt,
    updatedAt: d.updatedAt || '',
    approvedBy: d.approvedBy,
    approvedAt: d.approvedAt,
  })

  const loadDrawing = async () => {
    setLoading(true)
    try {
      const data = await drawingService.getById(Number(params.id))
      setDrawing(mapToDrawing(data))
    } catch (err) {
      console.error('Failed to load drawing:', err)
      setDrawing(null)
    }
    setLoading(false)
  }

  const getStatusBadge = (status: Drawing['status']) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        )
      case 'draft':
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <Clock className="mr-1 h-3 w-3" />
            Draft
          </Badge>
        )
      case 'obsolete':
        return (
          <Badge className="bg-red-100 text-red-700">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Obsolete
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!drawing) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Drawing not found</p>
          <Link href="/masters/drawings">
            <Button className="mt-4" variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Drawings
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/masters/drawings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {drawing.drawingNumber} Rev {drawing.revision}
            </h1>
            <p className="text-muted-foreground">{drawing.drawingName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => drawing.fileUrl && window.open(FILE_BASE_URL + drawing.fileUrl, '_blank')}>
            <Eye className="mr-2 h-4 w-4" />
            Open Drawing
          </Button>
          <Link href={`/masters/drawings/${drawing.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Obsolete Warning */}
      {drawing.status === 'obsolete' && (
        <Card className="border-2 border-red-500 bg-red-50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
              <div>
                <CardTitle className="text-red-900">⚠️ OBSOLETE DRAWING</CardTitle>
                <CardDescription className="text-red-700 mt-1">
                  This drawing revision is obsolete and must NOT be used for production.
                  {drawing.notes && (
                    <div className="mt-2 font-semibold">{drawing.notes}</div>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Status and Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Status</CardDescription>
            <div>{getStatusBadge(drawing.status)}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Revision</CardDescription>
            <CardTitle className="text-2xl font-mono">Rev {drawing.revision}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Drawing Type</CardDescription>
            <CardTitle className="text-2xl capitalize">{drawing.drawingType}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Drawing File */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold">{drawing.fileName}</div>
                <div className="text-sm text-muted-foreground">
                  {drawing.fileType.toUpperCase()} • {drawing.fileSize} KB
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => drawing.fileUrl && window.open(FILE_BASE_URL + drawing.fileUrl, '_blank')}>
                <Eye className="mr-2 h-4 w-4" />
                Open Drawing
              </Button>
              <a href={drawing.fileUrl ? FILE_BASE_URL + drawing.fileUrl : '#'} download={drawing.fileName}>
                <Button size="sm" disabled={!drawing.fileUrl}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Linked Information */}
      <Card>
        <CardHeader>
          <CardTitle>Linked Items</CardTitle>
          <CardDescription>
            Parts, products, and customers associated with this drawing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {drawing.linkedPartName && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Package className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-semibold text-blue-900">Linked Part</div>
                <div className="text-blue-700">{drawing.linkedPartName}</div>
              </div>
            </div>
          )}

          {drawing.linkedProductName && (
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <ShoppingCart className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <div className="font-semibold text-purple-900">Linked Product/Roller Model</div>
                <div className="text-purple-700">{drawing.linkedProductName}</div>
              </div>
            </div>
          )}

          {drawing.linkedCustomerName && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Users className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <div className="font-semibold text-gray-900">Customer</div>
                <div className="text-gray-700">{drawing.linkedCustomerName}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Customer-specific drawing
                </div>
              </div>
            </div>
          )}

          {!drawing.linkedPartName && !drawing.linkedProductName && !drawing.linkedCustomerName && (
            <div className="text-center py-6 text-muted-foreground">
              No linked items
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manufacturing Dimensions - CRITICAL */}
      {drawing.manufacturingDimensions && (
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <CardTitle className="text-orange-900">⚙️ Manufacturing Dimensions (AUTHORITATIVE)</CardTitle>
                <CardDescription className="text-orange-700 mt-1">
                  These dimensions are the authoritative source for job cards and production planning
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* SHAFT-specific dimensions */}
            {drawing.drawingType === 'shaft' && drawing.manufacturingDimensions.rodDiameter && (
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <div className="font-semibold text-orange-900 mb-3">Shaft Dimensions</div>
                <div className="grid grid-cols-3 gap-4">
                  {drawing.manufacturingDimensions.rodDiameter && (
                    <div>
                      <div className="text-sm text-gray-600">Rod Diameter</div>
                      <div className="text-lg font-semibold">{drawing.manufacturingDimensions.rodDiameter} mm</div>
                    </div>
                  )}
                  {drawing.manufacturingDimensions.finishedDiameter && (
                    <div>
                      <div className="text-sm text-gray-600">Finished Diameter</div>
                      <div className="text-lg font-semibold">{drawing.manufacturingDimensions.finishedDiameter} mm</div>
                    </div>
                  )}
                  {drawing.manufacturingDimensions.finishedLength && (
                    <div>
                      <div className="text-sm text-gray-600">Finished Length</div>
                      <div className="text-lg font-semibold">{drawing.manufacturingDimensions.finishedLength} mm</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PIPE-specific dimensions */}
            {drawing.drawingType === 'pipe' && drawing.manufacturingDimensions.pipeOD && (
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <div className="font-semibold text-orange-900 mb-3">Pipe Dimensions</div>
                <div className="grid grid-cols-4 gap-4">
                  {drawing.manufacturingDimensions.pipeOD && (
                    <div>
                      <div className="text-sm text-gray-600">Outer Diameter (OD)</div>
                      <div className="text-lg font-semibold">{drawing.manufacturingDimensions.pipeOD} mm</div>
                    </div>
                  )}
                  {drawing.manufacturingDimensions.pipeID && (
                    <div>
                      <div className="text-sm text-gray-600">Inner Diameter (ID)</div>
                      <div className="text-lg font-semibold">{drawing.manufacturingDimensions.pipeID} mm</div>
                    </div>
                  )}
                  {drawing.manufacturingDimensions.pipeThickness && (
                    <div>
                      <div className="text-sm text-gray-600">Thickness</div>
                      <div className="text-lg font-semibold">{drawing.manufacturingDimensions.pipeThickness} mm</div>
                    </div>
                  )}
                  {drawing.manufacturingDimensions.cutLength && (
                    <div>
                      <div className="text-sm text-gray-600">Cut Length</div>
                      <div className="text-lg font-semibold">{drawing.manufacturingDimensions.cutLength} mm</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Material & Quality */}
            <div className="bg-white p-4 rounded-lg border border-orange-200">
              <div className="font-semibold text-orange-900 mb-3">Material & Quality</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Material Grade</div>
                  <div className="text-lg font-semibold">{drawing.manufacturingDimensions.materialGrade}</div>
                </div>
                {drawing.manufacturingDimensions.tolerance && (
                  <div>
                    <div className="text-sm text-gray-600">Tolerance</div>
                    <div className="text-lg font-semibold">{drawing.manufacturingDimensions.tolerance}</div>
                  </div>
                )}
                {drawing.manufacturingDimensions.surfaceFinish && (
                  <div>
                    <div className="text-sm text-gray-600">Surface Finish</div>
                    <div className="text-lg font-semibold">{drawing.manufacturingDimensions.surfaceFinish}</div>
                  </div>
                )}
                {drawing.manufacturingDimensions.hardness && (
                  <div>
                    <div className="text-sm text-gray-600">Hardness</div>
                    <div className="text-lg font-semibold">{drawing.manufacturingDimensions.hardness}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Features */}
            {(drawing.manufacturingDimensions.keySlotLength ||
              drawing.manufacturingDimensions.keySlotWidth ||
              drawing.manufacturingDimensions.threadSize ||
              drawing.manufacturingDimensions.bearingSize) && (
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <div className="font-semibold text-orange-900 mb-3">Additional Features</div>
                <div className="grid grid-cols-4 gap-4">
                  {drawing.manufacturingDimensions.keySlotLength && (
                    <div>
                      <div className="text-sm text-gray-600">Key Slot Length</div>
                      <div className="text-lg font-semibold">{drawing.manufacturingDimensions.keySlotLength} mm</div>
                    </div>
                  )}
                  {drawing.manufacturingDimensions.keySlotWidth && (
                    <div>
                      <div className="text-sm text-gray-600">Key Slot Width</div>
                      <div className="text-lg font-semibold">{drawing.manufacturingDimensions.keySlotWidth} mm</div>
                    </div>
                  )}
                  {drawing.manufacturingDimensions.threadSize && (
                    <div>
                      <div className="text-sm text-gray-600">Thread Size</div>
                      <div className="text-lg font-semibold">{drawing.manufacturingDimensions.threadSize}</div>
                    </div>
                  )}
                  {drawing.manufacturingDimensions.bearingSize && (
                    <div>
                      <div className="text-sm text-gray-600">Bearing Size</div>
                      <div className="text-lg font-semibold">{drawing.manufacturingDimensions.bearingSize}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Weight & Material Required */}
            {(drawing.manufacturingDimensions.theoreticalWeight ||
              drawing.manufacturingDimensions.materialRequiredPerPiece) && (
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <div className="font-semibold text-orange-900 mb-3">Weight & Material Required</div>
                <div className="grid grid-cols-2 gap-4">
                  {drawing.manufacturingDimensions.theoreticalWeight && (
                    <div>
                      <div className="text-sm text-gray-600">Theoretical Weight (per piece)</div>
                      <div className="text-lg font-semibold">{drawing.manufacturingDimensions.theoreticalWeight} kg</div>
                    </div>
                  )}
                  {drawing.manufacturingDimensions.materialRequiredPerPiece && (
                    <div>
                      <div className="text-sm text-gray-600">Material Required (per piece)</div>
                      <div className="text-lg font-semibold">{drawing.manufacturingDimensions.materialRequiredPerPiece} kg</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Drawing Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-semibold text-muted-foreground">Drawing Number</div>
              <div className="font-mono text-lg">{drawing.drawingNumber}</div>
            </div>
            <Separator />
            <div>
              <div className="text-sm font-semibold text-muted-foreground">Drawing Name</div>
              <div>{drawing.drawingName}</div>
            </div>
            <Separator />
            <div>
              <div className="text-sm font-semibold text-muted-foreground">Description</div>
              <div className="text-sm">{drawing.description}</div>
            </div>
            {drawing.notes && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-semibold text-muted-foreground">Notes</div>
                  <div className="text-sm bg-yellow-50 p-3 rounded border border-yellow-200 mt-1">
                    {drawing.notes}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-semibold">Created By</div>
                <div className="text-sm">{drawing.createdBy}</div>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-semibold">Created On</div>
                <div className="text-sm">{drawing.createdAt}</div>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-semibold">Last Updated</div>
                <div className="text-sm">{drawing.updatedAt}</div>
              </div>
            </div>
            {drawing.approvedBy && drawing.approvedAt && (
              <>
                <Separator />
                <div className="flex items-center gap-3 bg-green-50 p-3 rounded border border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-sm font-semibold text-green-900">Approved By</div>
                    <div className="text-sm text-green-700">{drawing.approvedBy}</div>
                    <div className="text-xs text-green-600 mt-1">on {drawing.approvedAt}</div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revision History */}
      <Card>
        <CardHeader>
          <CardTitle>Revision History</CardTitle>
          <CardDescription>
            Current revision for drawing {drawing.drawingNumber}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded border bg-blue-50 border-blue-200">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono">
                  Rev {drawing.revision}
                </Badge>
                {getStatusBadge(drawing.status)}
                <Badge className="bg-blue-100 text-blue-700">Current</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Updated: {drawing.updatedAt}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
