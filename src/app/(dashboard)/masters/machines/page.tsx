'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Settings,
  Plus,
  Search,
  Filter,
  Wrench,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
} from 'lucide-react'
import { mockMachinesMaster } from '@/data/mock-machines-master'
import { AddMachineDialog } from '@/components/dialogs/add-machine-dialog'
import { format } from 'date-fns'

type MachineStatus = 'Active' | 'In_Use' | 'Idle' | 'Maintenance' | 'Breakdown' | 'Retired'
type MachineType = 'Lathe' | 'CNC_Lathe' | 'Milling' | 'CNC_Mill' | 'Drilling' | 'Grinding' | 'Boring' | 'Welding' | 'Cutting' | 'Other'

export default function MachinesMasterPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  // Calculate stats
  const stats = {
    total: mockMachinesMaster.length,
    active: mockMachinesMaster.filter(m => m.status === 'Active' || m.status === 'In_Use' || m.status === 'Idle').length,
    maintenance: mockMachinesMaster.filter(m => m.status === 'Maintenance').length,
    breakdown: mockMachinesMaster.filter(m => m.status === 'Breakdown').length,
    maintenanceDue: mockMachinesMaster.filter(m =>
      m.nextMaintenanceDate && new Date(m.nextMaintenanceDate) <= new Date()
    ).length,
  }

  // Filter machines
  const filteredMachines = mockMachinesMaster.filter(machine => {
    const matchesSearch =
      machine.machineCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.machineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.model?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || machine.status === statusFilter
    const matchesType = typeFilter === 'all' || machine.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusBadge = (status: MachineStatus) => {
    const variants: Record<MachineStatus, { icon: any, className: string }> = {
      'Active': { icon: CheckCircle, className: 'bg-green-100 text-green-800 border-green-300' },
      'In_Use': { icon: Settings, className: 'bg-blue-100 text-blue-800 border-blue-300' },
      'Idle': { icon: CheckCircle, className: 'bg-gray-100 text-gray-800 border-gray-300' },
      'Maintenance': { icon: Wrench, className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      'Breakdown': { icon: XCircle, className: 'bg-red-100 text-red-800 border-red-300' },
      'Retired': { icon: XCircle, className: 'bg-gray-100 text-gray-600 border-gray-300' },
    }
    const config = variants[status]
    const Icon = config.icon
    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Machines Master</h1>
          <p className="text-muted-foreground mt-1">
            Manage factory machines, maintenance schedules, and specifications
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Machine
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Machines</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All machines</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">Operational machines</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
            <p className="text-xs text-muted-foreground mt-1">Under maintenance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Breakdown</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.breakdown}</div>
            <p className="text-xs text-muted-foreground mt-1">Not working</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Due</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.maintenanceDue}</div>
            <p className="text-xs text-muted-foreground mt-1">Action required</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Machines List</CardTitle>
              <CardDescription>View and manage all factory machines</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by code, name, manufacturer, or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="In_Use">In Use</SelectItem>
                  <SelectItem value="Idle">Idle</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Breakdown">Breakdown</SelectItem>
                  <SelectItem value="Retired">Retired</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Lathe">Lathe</SelectItem>
                  <SelectItem value="CNC_Lathe">CNC Lathe</SelectItem>
                  <SelectItem value="Milling">Milling</SelectItem>
                  <SelectItem value="CNC_Mill">CNC Mill</SelectItem>
                  <SelectItem value="Drilling">Drilling</SelectItem>
                  <SelectItem value="Grinding">Grinding</SelectItem>
                  <SelectItem value="Boring">Boring</SelectItem>
                  <SelectItem value="Welding">Welding</SelectItem>
                  <SelectItem value="Cutting">Cutting</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Machine Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Manufacturer / Model</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Maintenance</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMachines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground h-32">
                      No machines found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMachines.map((machine) => (
                    <TableRow key={machine.machineId}>
                      <TableCell className="font-medium">{machine.machineCode}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{machine.machineName}</span>
                          {machine.serialNumber && (
                            <span className="text-xs text-muted-foreground">
                              S/N: {machine.serialNumber}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{machine.type.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          {machine.manufacturer && (
                            <span className="font-medium">{machine.manufacturer}</span>
                          )}
                          {machine.model && (
                            <span className="text-xs text-muted-foreground">{machine.model}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {machine.location}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(machine.status)}</TableCell>
                      <TableCell>
                        {machine.nextMaintenanceDate ? (
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {format(new Date(machine.nextMaintenanceDate), 'dd MMM yyyy')}
                              </span>
                            </div>
                            {new Date(machine.nextMaintenanceDate) <= new Date() && (
                              <Badge variant="outline" className="w-fit mt-1 text-xs bg-orange-50 text-orange-700 border-orange-300">
                                Overdue
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not scheduled</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {machine.utilizationPercent !== undefined ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {machine.utilizationPercent.toFixed(0)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                          <Button size="sm" variant="ghost">
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Machine Dialog */}
      <AddMachineDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
      />
    </div>
  )
}
