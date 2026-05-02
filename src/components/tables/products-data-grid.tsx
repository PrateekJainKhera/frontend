"use client"

import { useMemo, useState } from 'react'

import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
    type MRT_PaginationState,
} from 'material-react-table'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { Product } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Eye, Package } from 'lucide-react'
import { formatDate } from '@/lib/utils/formatters'
import { ViewProductDialog } from '@/components/dialogs/view-product-dialog'
import { EditProductDialog } from '@/components/dialogs/edit-product-dialog'
import { ProductBOMDialog } from '@/components/dialogs/product-bom-dialog'

interface ProductsDataGridProps {
    products: Product[]
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

export function ProductsDataGrid({ products, onUpdate }: ProductsDataGridProps) {
    const [data, setData] = useState<Product[]>(products)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [bomDialogOpen, setBomDialogOpen] = useState(false)
    const [pagination, setPagination] = useState<MRT_PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    })

    // Sync prop to internal state
    useMemo(() => {
        setData(products)
    }, [products])

    const handleView = (product: Product) => {
        setSelectedProduct(product)
        setViewDialogOpen(true)
    }

    const handleEdit = (product: Product) => {
        setSelectedProduct(product)
        setEditDialogOpen(true)
    }

    const handleViewBOM = (product: Product) => {
        setSelectedProduct(product)
        setBomDialogOpen(true)
    }

    // Define columns
    const columns = useMemo<MRT_ColumnDef<Product>[]>(
        () => [
            {
                accessorKey: 'partCode',
                header: 'Part Code',
                size: 120,
                Cell: ({ cell }) => (
                    <span className="font-mono font-semibold">{cell.getValue<string>()}</span>
                ),
            },
            {
                accessorKey: 'customerName',
                header: 'Customer',
                size: 150,
            },
            {
                accessorKey: 'modelName',
                header: 'Model',
                size: 120,
            },
            {
                accessorKey: 'rollerType',
                header: 'Roller Type',
                size: 120,
                Cell: ({ cell }) => (
                    <Badge variant="outline">{cell.getValue<string>()}</Badge>
                ),
            },
            {
                id: 'dimensions',
                header: 'Dimensions',
                size: 130,
                Cell: ({ row }) => (
                    <span className="text-sm">
                        ⌀{row.original.diameter} × {row.original.length}mm
                    </span>
                ),
            },
            {
                accessorKey: 'numberOfTeeth',
                header: 'No. of Teeth',
                size: 100,
                Cell: ({ cell }) => {
                    const val = cell.getValue<number>()
                    return <span className="text-sm">{val > 0 ? val : '—'}</span>
                },
            },
            {
                accessorKey: 'materialGrade',
                header: 'Material',
                size: 100,
            },
            {
                id: 'templateLinked',
                header: 'Template',
                size: 100,
                Cell: ({ row }) => (
                    row.original.productTemplateId
                        ? <Badge variant="outline" className="border-green-500 text-green-700 text-xs">Linked</Badge>
                        : <Badge variant="outline" className="border-orange-400 text-orange-600 text-xs">Not Linked</Badge>
                ),
            },
            {
                accessorKey: 'drawingNo',
                header: 'Drawing No',
                size: 120,
                Cell: ({ cell }) => (
                    <span className="text-sm text-muted-foreground">
                        {cell.getValue<string>() || '-'}
                    </span>
                ),
            },
            {
                accessorKey: 'revisionNo',
                header: 'Rev No',
                size: 80,
                Cell: ({ cell }) => (
                    <span className="text-sm text-muted-foreground">
                        {cell.getValue<string>() || '-'}
                    </span>
                ),
            },
            {
                accessorKey: 'createdAt',
                header: 'Created',
                size: 100,
                Cell: ({ cell }) => (
                    <span className="text-sm text-muted-foreground">
                        {formatDate(new Date(cell.getValue<string>()))}
                    </span>
                ),
            },
        ],
        []
    )

    const table = useMaterialReactTable({
        columns,
        data: data,
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
                    onClick={() => handleViewBOM(row.original)}
                    title="View BOM"
                >
                    <Package className="h-4 w-4" />
                </Button>
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
            {selectedProduct && (
                <>
                    <ViewProductDialog
                        product={selectedProduct}
                        open={viewDialogOpen}
                        onOpenChange={setViewDialogOpen}
                    />
                    <EditProductDialog
                        product={selectedProduct}
                        open={editDialogOpen}
                        onOpenChange={setEditDialogOpen}
                        onSuccess={() => {
                            setEditDialogOpen(false)
                            onUpdate?.()
                        }}
                    />
                    <ProductBOMDialog
                        product={selectedProduct}
                        open={bomDialogOpen}
                        onOpenChange={setBomDialogOpen}
                        onLinked={() => { setBomDialogOpen(false); onUpdate?.() }}
                    />
                </>
            )}
        </ThemeProvider>
    )
}
