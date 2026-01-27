"use client"

import { useMemo, useState } from 'react'
import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
    type MRT_PaginationState,
} from 'material-react-table'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Settings,
    Wrench,
    CheckCircle,
    XCircle,
    MapPin,
    Calendar,
    Edit,
    Eye,
} from 'lucide-react'
import { format } from 'date-fns'

// Types
type MachineStatus = 'Active' | 'In_Use' | 'Idle' | 'Maintenance' | 'Breakdown' | 'Retired'

interface Machine {
    machineId: string
    machineCode: string
    machineName: string
    type: string
    status: MachineStatus
    location: string
    manufacturer?: string
    model?: string
    serialNumber?: string
    nextMaintenanceDate?: Date
    utilizationPercent?: number
}

interface MachinesDataGridProps {
    machines: Machine[]
    onEdit?: (machine: Machine) => void
    onView?: (machine: Machine) => void
}

// Status badge helper
const getStatusBadge = (status: MachineStatus) => {
    const variants: Record<MachineStatus, { icon: any; className: string }> = {
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

// MUI Theme matching app styles
const muiTheme = createTheme({
    palette: { mode: 'light' },
    typography: { fontFamily: 'inherit' },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    boxShadow: 'none',
                    border: '2px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                },
            },
        },
        MuiTableHead: {
            styleOverrides: {
                root: {
                    '& .MuiTableCell-head': {
                        backgroundColor: 'hsl(var(--muted))',
                        fontWeight: 600,
                    },
                },
            },
        },
    },
})

export function MachinesDataGrid({ machines, onEdit, onView }: MachinesDataGridProps) {
    const [pagination, setPagination] = useState<MRT_PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    })

    // Define columns
    const columns = useMemo<MRT_ColumnDef<Machine>[]>(
        () => [
            {
                accessorKey: 'machineCode',
                header: 'Code',
                size: 100,
                Cell: ({ cell }) => (
                    <span className="font-mono font-semibold">{cell.getValue<string>()}</span>
                ),
            },
            {
                accessorKey: 'machineName',
                header: 'Name',
                size: 180,
                Cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span className="font-medium">{row.original.machineName}</span>
                        {row.original.serialNumber && (
                            <span className="text-xs text-muted-foreground">
                                S/N: {row.original.serialNumber}
                            </span>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: 'type',
                header: 'Type',
                size: 120,
                Cell: ({ cell }) => (
                    <Badge variant="outline">{cell.getValue<string>()?.replace('_', ' ')}</Badge>
                ),
            },
            {
                id: 'manufacturer',
                header: 'Manufacturer / Model',
                size: 150,
                Cell: ({ row }) => (
                    <div className="flex flex-col">
                        {row.original.manufacturer && (
                            <span className="font-medium">{row.original.manufacturer}</span>
                        )}
                        {row.original.model && (
                            <span className="text-xs text-muted-foreground">{row.original.model}</span>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: 'location',
                header: 'Location',
                size: 120,
                Cell: ({ cell }) => (
                    <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {cell.getValue<string>()}
                    </div>
                ),
            },
            {
                accessorKey: 'status',
                header: 'Status',
                size: 130,
                Cell: ({ cell }) => getStatusBadge(cell.getValue<MachineStatus>()),
            },
            {
                accessorKey: 'nextMaintenanceDate',
                header: 'Next Maintenance',
                size: 140,
                Cell: ({ cell }) => {
                    const date = cell.getValue<Date>()
                    if (!date) return <span className="text-muted-foreground text-sm">Not scheduled</span>
                    const isOverdue = new Date(date) <= new Date()
                    return (
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{format(new Date(date), 'dd MMM yyyy')}</span>
                            </div>
                            {isOverdue && (
                                <Badge variant="outline" className="w-fit mt-1 text-xs bg-orange-50 text-orange-700 border-orange-300">
                                    Overdue
                                </Badge>
                            )}
                        </div>
                    )
                },
            },
            {
                accessorKey: 'utilizationPercent',
                header: 'Utilization',
                size: 100,
                Cell: ({ cell }) => {
                    const value = cell.getValue<number>()
                    if (value === undefined) return <span className="text-muted-foreground text-sm">N/A</span>
                    return <span className="text-sm font-medium">{value.toFixed(0)}%</span>
                },
            },
        ],
        []
    )

    const table = useMaterialReactTable({
        columns,
        data: machines,
        enableColumnActions: false,
        enableColumnFilters: false,
        enableSorting: true,
        enableGlobalFilter: false,
        enableTopToolbar: false,
        enableBottomToolbar: true,
        enableRowActions: true,
        positionActionsColumn: 'last',

        // Enable Column Reordering
        enableColumnOrdering: true,

        onPaginationChange: setPagination,
        state: { pagination },
        muiPaginationProps: {
            rowsPerPageOptions: [10, 25, 50],
            showFirstButton: true,
            showLastButton: true,
        },
        paginationDisplayMode: 'pages',

        renderRowActions: ({ row }) => (
            <div className="flex gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onView?.(row.original)}
                    title="View"
                >
                    <Eye className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit?.(row.original)}
                    title="Edit"
                >
                    <Edit className="h-4 w-4" />
                </Button>
            </div>
        ),
    })

    return (
        <ThemeProvider theme={muiTheme}>
            <MaterialReactTable table={table} />
        </ThemeProvider>
    )
}
