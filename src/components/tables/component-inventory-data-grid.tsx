"use client"

import { useMemo, useState } from 'react'
import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
    type MRT_PaginationState,
} from 'material-react-table'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { InventoryResponse } from '@/lib/api/inventory'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import { ComponentDetailsDialog } from '@/components/dialogs/component-details-dialog'
import { format } from 'date-fns'

interface ComponentInventoryDataGridProps {
    inventory: InventoryResponse[]
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

export function ComponentInventoryDataGrid({ inventory }: ComponentInventoryDataGridProps) {
    const [selectedInventory, setSelectedInventory] = useState<InventoryResponse | null>(null)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [pagination, setPagination] = useState<MRT_PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    })

    const handleView = (item: InventoryResponse) => {
        setSelectedInventory(item)
        setDetailsDialogOpen(true)
    }

    // Define columns for component inventory
    const columns = useMemo<MRT_ColumnDef<InventoryResponse>[]>(
        () => [
            {
                accessorKey: 'materialCode',
                header: 'Part Number',
                size: 130,
                Cell: ({ cell }) => (
                    <span className="font-mono font-semibold">
                        {cell.getValue<string>() || 'N/A'}
                    </span>
                ),
            },
            {
                accessorKey: 'materialName',
                header: 'Component Name',
                size: 220,
                Cell: ({ cell }) => (
                    <span className="font-medium">{cell.getValue<string>()}</span>
                ),
            },
            {
                accessorKey: 'totalQuantity',
                header: 'Current Stock',
                size: 120,
                Cell: ({ cell, row }) => (
                    <span className="font-semibold">
                        {(cell.getValue<number>() || 0).toFixed(2)} {row.original.uom}
                    </span>
                ),
                muiTableBodyCellProps: {
                    align: 'right',
                },
                muiTableHeadCellProps: {
                    align: 'right',
                },
            },
            {
                accessorKey: 'availableQuantity',
                header: 'Available',
                size: 100,
                Cell: ({ cell, row }) => (
                    <span className="text-green-600 font-medium">
                        {(cell.getValue<number>() || 0).toFixed(2)} {row.original.uom}
                    </span>
                ),
                muiTableBodyCellProps: {
                    align: 'right',
                },
                muiTableHeadCellProps: {
                    align: 'right',
                },
            },
            {
                accessorKey: 'reservedQuantity',
                header: 'Reserved',
                size: 100,
                Cell: ({ cell, row }) => (
                    <span className="text-yellow-600 font-medium">
                        {(cell.getValue<number>() || 0).toFixed(2)} {row.original.uom}
                    </span>
                ),
                muiTableBodyCellProps: {
                    align: 'right',
                },
                muiTableHeadCellProps: {
                    align: 'right',
                },
            },
            {
                accessorKey: 'uom',
                header: 'UOM',
                size: 80,
                Cell: ({ cell }) => (
                    <Badge variant="outline">{cell.getValue<string>()}</Badge>
                ),
            },
            {
                accessorKey: 'primaryStorageLocation',
                header: 'Location',
                size: 130,
                Cell: ({ cell }) => (
                    <span className="text-sm">{cell.getValue<string>() || 'N/A'}</span>
                ),
            },
            {
                id: 'status',
                header: 'Status',
                size: 110,
                Cell: ({ row }) => {
                    if (row.original.isOutOfStock) {
                        return (
                            <Badge className="bg-red-100 text-red-700">
                                Out of Stock
                            </Badge>
                        )
                    } else if (row.original.isLowStock) {
                        return (
                            <Badge className="bg-yellow-100 text-yellow-700">
                                Low Stock
                            </Badge>
                        )
                    } else {
                        return (
                            <Badge className="bg-green-100 text-green-700">
                                Available
                            </Badge>
                        )
                    }
                },
            },
            {
                accessorKey: 'updatedAt',
                header: 'Last Updated',
                size: 120,
                Cell: ({ cell }) => {
                    const date = cell.getValue<Date>()
                    return (
                        <span className="text-sm">
                            {date ? format(new Date(date), 'MMM dd, yyyy') : 'N/A'}
                        </span>
                    )
                },
            },
        ],
        []
    )

    const table = useMaterialReactTable({
        columns,
        data: inventory,
        enableColumnActions: true,
        enableColumnFilters: true,
        enableSorting: true,
        enableGlobalFilter: true,
        enableTopToolbar: true,
        enableBottomToolbar: true,
        enableRowActions: true,
        positionActionsColumn: 'last',

        // Enable Column Reordering
        enableColumnOrdering: true,

        onPaginationChange: setPagination,
        state: { pagination },
        muiPaginationProps: {
            rowsPerPageOptions: [10, 25, 50, 100],
            showFirstButton: true,
            showLastButton: true,
        },
        paginationDisplayMode: 'pages',

        // Global filter (search)
        muiSearchTextFieldProps: {
            placeholder: 'Search components...',
            sx: { minWidth: '300px' },
            variant: 'outlined',
        },

        renderRowActions: ({ row }) => (
            <div className="flex gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleView(row.original)}
                    title="View Details"
                >
                    <Eye className="h-4 w-4" />
                </Button>
            </div>
        ),
    })

    return (
        <ThemeProvider theme={muiTheme}>
            <MaterialReactTable table={table} />

            {/* Details Dialog */}
            {selectedInventory && (
                <ComponentDetailsDialog
                    inventory={selectedInventory}
                    open={detailsDialogOpen}
                    onOpenChange={setDetailsDialogOpen}
                />
            )}
        </ThemeProvider>
    )
}
