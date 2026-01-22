'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockOrders } from '@/lib/mock-data'
import { TransportMode } from '@/types/dispatch'
import { OrderStatus } from '@/types/enums'

export default function CreateDeliveryChallanPage() {
  const router = useRouter()
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [transportMode, setTransportMode] = useState<TransportMode>(TransportMode.ROAD)
  const [transporterName, setTransporterName] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [driverName, setDriverName] = useState('')
  const [driverPhone, setDriverPhone] = useState('')
  const [ewayBillNo, setEwayBillNo] = useState('')
  const [lrNo, setLrNo] = useState('')
  const [freightCharges, setFreightCharges] = useState('')
  const [remarks, setRemarks] = useState('')

  // Get completed orders (QC done)
  const completedOrders = mockOrders.filter(
    order => order.status === OrderStatus.COMPLETED && order.qtyCompleted > 0
  )

  const selectedOrder = completedOrders.find(o => o.id === selectedOrderId)

  const handleSubmit = () => {
    if (!selectedOrderId) {
      alert('Please select an order')
      return
    }

    // In real app, this would call API
    console.log('Creating delivery challan:', {
      orderId: selectedOrderId,
      transportMode,
      transporterName,
      vehicleNumber,
      driverName,
      driverPhone,
      ewayBillNo,
      lrNo,
      freightCharges,
      remarks
    })

    alert('Delivery Challan created successfully!')
    router.push('/dispatch')
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/dispatch')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Delivery Challan</h1>
          <p className="text-muted-foreground">
            Generate delivery challan for completed orders
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
              <CardDescription>Select order for dispatch</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="order">Select Order *</Label>
                <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                  <SelectTrigger id="order">
                    <SelectValue placeholder="Select completed order" />
                  </SelectTrigger>
                  <SelectContent>
                    {completedOrders.map(order => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.orderNo} - {order.customer?.customerName} - {order.product?.modelName} ({order.qtyCompleted} pcs)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedOrder && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Customer:</span>
                      <p className="font-medium">{selectedOrder.customer?.customerName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Product:</span>
                      <p className="font-medium">{selectedOrder.product?.modelName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quantity:</span>
                      <p className="font-medium">{selectedOrder.qtyCompleted} pcs</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Order Date:</span>
                      <p className="font-medium">{selectedOrder.orderDate.toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transport Details */}
          <Card>
            <CardHeader>
              <CardTitle>Transport Details</CardTitle>
              <CardDescription>Enter transporter and vehicle information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transport-mode">Transport Mode *</Label>
                  <Select value={transportMode} onValueChange={(value) => setTransportMode(value as TransportMode)}>
                    <SelectTrigger id="transport-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TransportMode.ROAD}>Road</SelectItem>
                      <SelectItem value={TransportMode.RAIL}>Rail</SelectItem>
                      <SelectItem value={TransportMode.AIR}>Air</SelectItem>
                      <SelectItem value={TransportMode.COURIER}>Courier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transporter">Transporter Name</Label>
                  <Input
                    id="transporter"
                    placeholder="Enter transporter name"
                    value={transporterName}
                    onChange={(e) => setTransporterName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle">Vehicle Number</Label>
                  <Input
                    id="vehicle"
                    placeholder="MH-12-AB-1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="driver">Driver Name</Label>
                  <Input
                    id="driver"
                    placeholder="Enter driver name"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="driver-phone">Driver Phone</Label>
                  <Input
                    id="driver-phone"
                    placeholder="+91-9876543210"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statutory Details */}
          <Card>
            <CardHeader>
              <CardTitle>Statutory Details</CardTitle>
              <CardDescription>E-way bill and other statutory information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eway">E-way Bill Number</Label>
                  <Input
                    id="eway"
                    placeholder="EWB-123456789012"
                    value={ewayBillNo}
                    onChange={(e) => setEwayBillNo(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lr">LR Number</Label>
                  <Input
                    id="lr"
                    placeholder="LR-2024-1234"
                    value={lrNo}
                    onChange={(e) => setLrNo(e.target.value)}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="freight">Freight Charges (₹)</Label>
                  <Input
                    id="freight"
                    type="number"
                    placeholder="5000"
                    value={freightCharges}
                    onChange={(e) => setFreightCharges(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  placeholder="Add any special instructions or remarks..."
                  rows={4}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleSubmit}
                className="w-full"
                size="lg"
                disabled={!selectedOrderId}
              >
                <Save className="mr-2 h-4 w-4" />
                Create Delivery Challan
              </Button>

              <Button
                onClick={() => router.push('/dispatch')}
                variant="outline"
                className="w-full"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium">Draft</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created By</p>
                <p className="font-medium">Current User</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">{new Date().toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
