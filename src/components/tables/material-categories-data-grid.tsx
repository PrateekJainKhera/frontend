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
import { Eye, Edit } from 'lucide-react'
import { MaterialCategoryResponse } from '@/lib/api/material-categories'

interface MaterialCategoriesDataGridProps {
    categories: MaterialCategoryResponse[]
    onUpdate?: () => void
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

export function MaterialCategoriesDataGrid({ categories }: MaterialCategoriesDataGridProps) {
    const [pagination, setPagination] = useState<MRT_PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    })

    // Define columns
    const columns = useMemo<MRT_ColumnDef<MaterialCategoryResponse>[]>(
        () => [
            {
                accessorKey: 'categoryCode',
                header: 'Code',
                size: 100,
                Cell: ({ cell }) => (
                    <span className="font-mono font-semibold">{cell.getValue<string>()}</span>
                ),
            },
            {
                accessorKey: 'categoryName',
                header: 'Category Name',
                size: 180,
                Cell: ({ cell }) => (
                    <span className="font-medium">{cell.getValue<string>()}</span>
                ),
            },
            {
                accessorKey: 'quality',
                header: 'Quality',
                size: 100,
            },
            {
                accessorKey: 'description',
                header: 'Description',
                size: 200,
                Cell: ({ cell }) => (
                    <span className="truncate max-w-[200px] block">{cell.getValue<string>()}</span>
                ),
            },
            {
                accessorKey: 'defaultUOM',
                header: 'UOM',
                size: 80,
                Cell: ({ cell }) => (
                    <Badge variant="outline">{cell.getValue<string>()?.toUpperCase()}</Badge>
                ),
            },
            {
                accessorKey: 'materialType',
                header: 'Type',
                size: 120,
                Cell: ({ cell }) => (
                    <Badge variant={cell.getValue<string>() === 'raw_material' ? 'default' : 'secondary'}>
                        {cell.getValue<string>() === 'raw_material' ? 'Raw Material' : 'Component'}
                    </Badge>
                ),
            },
            {
                accessorKey: 'isActive',
                header: 'Status',
                size: 100,
                Cell: ({ cell }) => (
                    <Badge variant={cell.getValue<boolean>() ? 'default' : 'destructive'}>
                        {cell.getValue<boolean>() ? 'Active' : 'Inactive'}
                    </Badge>
                ),
            },
        ],
        []
    )

    const table = useMaterialReactTable({
        columns,
        data: categories,
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
                <Link href={`/masters/material-categories/${row.original.id}`}>
                    <Button variant="ghost" size="icon" title="View">
                        <Eye className="h-4 w-4" />
                    </Button>
                </Link>
                <Link href={`/masters/material-categories/${row.original.id}/edit`}>
                    <Button variant="ghost" size="icon" title="Edit">
                        <Edit className="h-4 w-4" />
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
