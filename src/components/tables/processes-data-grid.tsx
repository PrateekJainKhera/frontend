"use client"

import { useMemo, useState } from 'react'
import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
    type MRT_PaginationState,
} from 'material-react-table'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { Process } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Eye, Clock, ExternalLink } from 'lucide-react'
import { ViewProcessDialog } from '@/components/dialogs/view-process-dialog'
import { EditProcessDialog } from '@/components/dialogs/edit-process-dialog'

interface ProcessesDataGridProps {
    processes: Process[]
    onUpdate?: () => void
}

const getCategoryColor = (category: string) => {
    switch (category) {
        case 'Machining':
            return 'bg-blue-100 text-blue-800'
        case 'Heat Treatment':
            return 'bg-orange-100 text-orange-800'
        case 'Finishing':
            return 'bg-green-100 text-green-800'
        case 'Assembly':
            return 'bg-purple-100 text-purple-800'
        case 'Inspection':
            return 'bg-yellow-100 text-yellow-800'
        case 'Dispatch':
            return 'bg-gray-100 text-gray-800'
        default:
            return 'bg-gray-100 text-gray-800'
    }
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

export function ProcessesDataGrid({ processes, onUpdate }: ProcessesDataGridProps) {
    const [selectedProcess, setSelectedProcess] = useState<Process | null>(null)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [pagination, setPagination] = useState<MRT_PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    })

    const handleView = (process: Process) => {
        setSelectedProcess(process)
        setViewDialogOpen(true)
    }

    const handleEdit = (process: Process) => {
        setSelectedProcess(process)
        setEditDialogOpen(true)
    }

    // Define columns
    const columns = useMemo<MRT_ColumnDef<Process>[]>(
        () => [
            {
                accessorKey: 'processCode',
                header: 'Code',
                size: 100,
                Cell: ({ cell }) => (
                    <span className="font-mono font-semibold">{cell.getValue<string>()}</span>
                ),
            },
            {
                accessorKey: 'processName',
                header: 'Process Name',
                size: 160,
                Cell: ({ cell }) => (
                    <span className="font-medium">{cell.getValue<string>()}</span>
                ),
            },
            {
                accessorKey: 'category',
                header: 'Category',
                size: 120,
                Cell: ({ cell }) => (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(cell.getValue<string>())}`}>
                        {cell.getValue<string>()}
                    </span>
                ),
            },
            {
                accessorKey: 'defaultMachine',
                header: 'Default Machine',
                size: 140,
                Cell: ({ cell }) => (
                    <span className="text-sm">{cell.getValue<string>() || '-'}</span>
                ),
            },
            {
                accessorKey: 'standardTimeMin',
                header: 'Std Time',
                size: 100,
                Cell: ({ cell }) => (
                    <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {cell.getValue<number>()} min
                    </div>
                ),
            },
            {
                accessorKey: 'skillRequired',
                header: 'Skill',
                size: 100,
                Cell: ({ cell }) => (
                    <Badge variant="outline">{cell.getValue<string>()}</Badge>
                ),
            },
            {
                accessorKey: 'isOutsourced',
                header: 'Type',
                size: 110,
                Cell: ({ cell }) => (
                    cell.getValue<boolean>() ? (
                        <Badge variant="secondary" className="gap-1">
                            <ExternalLink className="h-3 w-3" />
                            Outsourced
                        </Badge>
                    ) : (
                        <Badge variant="default">In-House</Badge>
                    )
                ),
            },
        ],
        []
    )

    const table = useMaterialReactTable({
        columns,
        data: processes,
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
                    onClick={() => handleView(row.original)}
                    title="View"
                >
                    <Eye className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(row.original)}
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

            {/* Dialogs */}
            {selectedProcess && (
                <>
                    <ViewProcessDialog
                        process={selectedProcess}
                        open={viewDialogOpen}
                        onOpenChange={setViewDialogOpen}
                    />
                    <EditProcessDialog
                        process={selectedProcess}
                        open={editDialogOpen}
                        onOpenChange={setEditDialogOpen}
                        onSuccess={() => {
                            setEditDialogOpen(false)
                            onUpdate?.()
                        }}
                    />
                </>
            )}
        </ThemeProvider>
    )
}
