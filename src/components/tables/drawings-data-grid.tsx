"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
    type MRT_PaginationState,
} from 'material-react-table'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, FileText } from 'lucide-react'
import { Drawing } from '@/lib/mock-data'

interface DrawingsDataGridProps {
    drawings: Drawing[]
    onUpdate?: () => void
}

const getStatusBadge = (status: Drawing['status']) => {
    switch (status) {
        case 'approved':
            return <Badge className="bg-green-100 text-green-700">Approved</Badge>
        case 'draft':
            return <Badge className="bg-yellow-100 text-yellow-700">Draft</Badge>
        case 'obsolete':
            return <Badge className="bg-red-100 text-red-700">Obsolete</Badge>
    }
}

const getDrawingTypeBadge = (drawingType: Drawing['drawingType']) => {
    const colors: Record<Drawing['drawingType'], string> = {
        shaft: 'bg-blue-100 text-blue-700',
        pipe: 'bg-purple-100 text-purple-700',
        final: 'bg-green-100 text-green-700',
        gear: 'bg-amber-100 text-amber-700',
        bushing: 'bg-cyan-100 text-cyan-700',
        roller: 'bg-pink-100 text-pink-700',
        other: 'bg-gray-100 text-gray-700',
    }
    return (
        <Badge className={colors[drawingType]}>
            {drawingType.charAt(0).toUpperCase() + drawingType.slice(1)}
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

export function DrawingsDataGrid({ drawings }: DrawingsDataGridProps) {
    const [pagination, setPagination] = useState<MRT_PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    })

    // Define columns
    const columns = useMemo<MRT_ColumnDef<Drawing>[]>(
        () => [
            {
                accessorKey: 'drawingNumber',
                header: 'Drawing No',
                size: 130,
                Cell: ({ row }) => (
                    <div>
                        <div className="font-mono font-semibold">{row.original.drawingNumber}</div>
                        {row.original.status === 'obsolete' && (
                            <div className="text-xs text-red-600 font-semibold mt-1">⚠️ DO NOT USE</div>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: 'drawingName',
                header: 'Name',
                size: 200,
                Cell: ({ row }) => (
                    <div>
                        <div className="truncate max-w-[200px]">{row.original.drawingName}</div>
                        {row.original.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {row.original.description}
                            </div>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: 'revision',
                header: 'Revision',
                size: 90,
                Cell: ({ cell }) => (
                    <Badge variant="outline" className="font-mono">
                        Rev {cell.getValue<string>()}
                    </Badge>
                ),
            },
            {
                accessorKey: 'revisionDate',
                header: 'Rev. Date',
                size: 110,
                Cell: ({ cell }) => (
                    <span className="text-sm text-muted-foreground">
                        {cell.getValue<string>()}
                    </span>
                ),
            },
            {
                accessorKey: 'drawingType',
                header: 'Drawing Type',
                size: 110,
                Cell: ({ cell }) => getDrawingTypeBadge(cell.getValue<Drawing['drawingType']>()),
            },
            {
                accessorKey: 'status',
                header: 'Status',
                size: 100,
                Cell: ({ cell }) => getStatusBadge(cell.getValue<Drawing['status']>()),
            },
            {
                id: 'linkedTo',
                header: 'Linked To',
                size: 150,
                Cell: ({ row }) => (
                    <div className="text-sm space-y-1">
                        {row.original.linkedPartName && (
                            <div className="text-blue-600">→ {row.original.linkedPartName}</div>
                        )}
                        {row.original.linkedProductName && (
                            <div className="text-purple-600">→ {row.original.linkedProductName}</div>
                        )}
                        {row.original.linkedCustomerName && (
                            <div className="text-gray-600 text-xs">({row.original.linkedCustomerName})</div>
                        )}
                        {!row.original.linkedPartName && !row.original.linkedProductName && (
                            <div className="text-muted-foreground">—</div>
                        )}
                    </div>
                ),
            },
            {
                id: 'file',
                header: 'File',
                size: 140,
                Cell: ({ row }) => (
                    <div>
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{row.original.fileName}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{row.original.fileSize} KB</div>
                    </div>
                ),
            },
        ],
        []
    )

    const table = useMaterialReactTable({
        columns,
        data: drawings,
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

        // Row styling for obsolete drawings
        muiTableBodyRowProps: ({ row }) => ({
            sx: row.original.status === 'obsolete' ? { backgroundColor: 'rgb(254 242 242)' } : {},
        }),

        renderRowActions: ({ row }) => (
            <div className="flex gap-1">
                <Link href={`/masters/drawings/${row.original.id}`}>
                    <Button variant="ghost" size="icon" title="View">
                        <Eye className="h-4 w-4" />
                    </Button>
                </Link>
            </div>
        ),
    })

    return (
        <ThemeProvider theme={muiTheme}>
            <MaterialReactTable table={table} />
        </ThemeProvider>
    )
}
