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
  Settings,
  Plus,
  Search,
  Filter,
  Wrench,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Mic,
} from 'lucide-react'
import { mockMachinesMaster } from '@/data/mock-machines-master'
import { AddMachineDialog } from '@/components/dialogs/add-machine-dialog'
import { MachinesDataGrid } from '@/components/tables/machines-data-grid'

export default function MachinesMasterPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const handleMicClick = () => {
    alert('Voice search feature coming soon!')
  }

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

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Filters Row */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Compact Search with Mic */}
        <div className="flex items-center gap-2 bg-background border-2 border-border rounded-lg px-4 py-1 shadow-sm flex-1 max-w-md">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search machines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 h-8 px-0 text-sm flex-1 placeholder:text-muted-foreground/40 focus:placeholder:text-transparent caret-foreground"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handleMicClick}
            title="Voice search"
          >
            <Mic className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Filters */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
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
          <SelectTrigger className="w-[160px]">
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Machines</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Breakdown</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.breakdown}</div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Due</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.maintenanceDue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Data Grid */}
      <MachinesDataGrid
        machines={filteredMachines}
        onEdit={(machine) => console.log('Edit', machine)}
        onView={(machine) => console.log('View', machine)}
      />

      {/* Add Machine Dialog */}
      <AddMachineDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
      />

      {/* Floating Action Button */}
      <Button
        onClick={() => setAddDialogOpen(true)}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}
