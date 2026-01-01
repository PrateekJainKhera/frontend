import { ProductBOM } from '@/types'

export const mockBOMs: ProductBOM[] = [
  // BOM for MAG-250-EN8-001 (Magnetic Roller)
  {
    id: 'bom-1',
    productId: 'prod-1',
    bomVersion: 'v1.0',
    isActive: true,
    notes: 'Standard magnetic roller 250mm diameter configuration',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    bomItems: [
      // Raw Materials
      {
        id: 'bom-item-1-1',
        bomId: 'bom-1',
        itemType: 'RAW_MATERIAL',
        itemId: 'rm-1',
        itemName: 'EN8 Rod 50mm',
        itemCode: 'EN8-ROD-50',
        quantity: 1.3,
        unit: 'meters',
        isOptional: false,
        notes: 'Allow 10% extra for machining scrap',
        approvalRequired: true,
        approvedSuppliers: ['Tata Steel', 'SAIL']
      },
      {
        id: 'bom-item-1-2',
        bomId: 'bom-1',
        itemType: 'RAW_MATERIAL',
        itemId: 'rm-4',
        itemName: 'EN8 Pipe 250mm OD',
        itemCode: 'EN8-PIPE-250',
        quantity: 1.25,
        unit: 'meters',
        isOptional: false,
        notes: 'Main roller body pipe',
        approvalRequired: true,
        approvedSuppliers: ['Tata Steel', 'JSW Steel']
      },
      // Components
      {
        id: 'bom-item-1-3',
        bomId: 'bom-1',
        itemType: 'COMPONENT',
        itemId: 'comp-1',
        itemName: 'Deep Groove Ball Bearing 6205-2RS',
        itemCode: 'BRG-6205-2RS',
        quantity: 2,
        unit: 'pcs',
        isOptional: false,
        notes: 'Use SKF or NTN only for quality',
        approvalRequired: true,
        approvedSuppliers: ['SKF', 'NTN', 'FAG']
      },
      {
        id: 'bom-item-1-4',
        bomId: 'bom-1',
        itemType: 'COMPONENT',
        itemId: 'comp-3',
        itemName: 'Spur Gear Module 2, 40 Teeth',
        itemCode: 'GR-M2-Z40',
        quantity: 1,
        unit: 'pcs',
        isOptional: false,
        approvalRequired: false
      },
      {
        id: 'bom-item-1-5',
        bomId: 'bom-1',
        itemType: 'COMPONENT',
        itemId: 'comp-5',
        itemName: 'Oil Seal 35x52x7',
        itemCode: 'SEAL-OIL-35X52X7',
        quantity: 2,
        unit: 'pcs',
        isOptional: false,
        approvalRequired: false
      },
      {
        id: 'bom-item-1-6',
        bomId: 'bom-1',
        itemType: 'COMPONENT',
        itemId: 'comp-8',
        itemName: 'Precision Shaft D25 x L150',
        itemCode: 'SHAFT-D25-L150',
        quantity: 2,
        unit: 'pcs',
        isOptional: false,
        notes: 'End shafts - hardened and ground',
        approvalRequired: true,
        approvedSuppliers: ['In-house']
      },
      {
        id: 'bom-item-1-7',
        bomId: 'bom-1',
        itemType: 'COMPONENT',
        itemId: 'comp-10',
        itemName: 'Rubber Bushing 25x35x20',
        itemCode: 'BUSH-RUB-25X35X20',
        quantity: 4,
        unit: 'pcs',
        isOptional: false,
        approvalRequired: false
      },
      {
        id: 'bom-item-1-8',
        bomId: 'bom-1',
        itemType: 'COMPONENT',
        itemId: 'comp-12',
        itemName: 'Hex Bolt M8x25 with Nut',
        itemCode: 'BOLT-M8X25',
        quantity: 8,
        unit: 'pcs',
        isOptional: false,
        approvalRequired: false
      }
    ]
  },

  // BOM for RUB-300-NBR-002 (Rubber Roller)
  {
    id: 'bom-2',
    productId: 'prod-2',
    bomVersion: 'v1.0',
    isActive: true,
    notes: 'Rubber roller with NBR coating - larger 300mm diameter',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
    bomItems: [
      // Raw Materials
      {
        id: 'bom-item-2-1',
        bomId: 'bom-2',
        itemType: 'RAW_MATERIAL',
        itemId: 'rm-1',
        itemName: 'EN8 Rod 60mm',
        itemCode: 'EN8-ROD-60',
        quantity: 1.6,
        unit: 'meters',
        isOptional: false,
        notes: 'Larger diameter for 300mm roller',
        approvalRequired: true,
        approvedSuppliers: ['Tata Steel', 'SAIL']
      },
      {
        id: 'bom-item-2-2',
        bomId: 'bom-2',
        itemType: 'RAW_MATERIAL',
        itemId: 'rm-4',
        itemName: 'EN8 Pipe 300mm OD',
        itemCode: 'EN8-PIPE-300',
        quantity: 1.55,
        unit: 'meters',
        isOptional: false,
        notes: 'Main roller body pipe',
        approvalRequired: true,
        approvedSuppliers: ['Tata Steel', 'JSW Steel']
      },
      // Components - Larger bearings for 300mm roller
      {
        id: 'bom-item-2-3',
        bomId: 'bom-2',
        itemType: 'COMPONENT',
        itemId: 'comp-2',
        itemName: 'Tapered Roller Bearing 32206',
        itemCode: 'BRG-TRB-32206',
        quantity: 2,
        unit: 'pcs',
        isOptional: false,
        notes: 'Larger load capacity for rubber roller',
        approvalRequired: true,
        approvedSuppliers: ['SKF', 'Timken', 'NTN']
      },
      {
        id: 'bom-item-2-4',
        bomId: 'bom-2',
        itemType: 'COMPONENT',
        itemId: 'comp-4',
        itemName: 'Helical Gear Module 3, 35 Teeth',
        itemCode: 'GR-M3-Z35',
        quantity: 1,
        unit: 'pcs',
        isOptional: false,
        approvalRequired: false
      },
      {
        id: 'bom-item-2-5',
        bomId: 'bom-2',
        itemType: 'COMPONENT',
        itemId: 'comp-6',
        itemName: 'Mechanical Seal 40x60x10',
        itemCode: 'SEAL-MECH-40X60X10',
        quantity: 2,
        unit: 'pcs',
        isOptional: false,
        notes: 'Required for rubber coating process',
        approvalRequired: true,
        approvedSuppliers: ['John Crane', 'Burgmann']
      },
      {
        id: 'bom-item-2-6',
        bomId: 'bom-2',
        itemType: 'COMPONENT',
        itemId: 'comp-9',
        itemName: 'Hardened Shaft D30 x L180',
        itemCode: 'SHAFT-D30-L180',
        quantity: 2,
        unit: 'pcs',
        isOptional: false,
        notes: 'Larger shafts for 300mm roller',
        approvalRequired: true,
        approvedSuppliers: ['In-house']
      },
      {
        id: 'bom-item-2-7',
        bomId: 'bom-2',
        itemType: 'COMPONENT',
        itemId: 'comp-11',
        itemName: 'Bronze Bushing 30x40x25',
        itemCode: 'BUSH-BRZ-30X40X25',
        quantity: 4,
        unit: 'pcs',
        isOptional: false,
        approvalRequired: false
      }
    ]
  },

  // BOM for ANI-200-EN19-003 (Anilox Roller)
  {
    id: 'bom-3',
    productId: 'prod-3',
    bomVersion: 'v1.0',
    isActive: true,
    notes: 'Anilox roller with chrome coating - precision grade',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20'),
    bomItems: [
      // Raw Materials - EN19 for better hardness
      {
        id: 'bom-item-3-1',
        bomId: 'bom-3',
        itemType: 'RAW_MATERIAL',
        itemId: 'rm-2',
        itemName: 'EN19 Rod 45mm',
        itemCode: 'EN19-ROD-45',
        quantity: 1.15,
        unit: 'meters',
        isOptional: false,
        notes: 'High-grade alloy steel for precision',
        approvalRequired: true,
        approvedSuppliers: ['Tata Steel', 'SAIL', 'Kalyani Steels']
      },
      {
        id: 'bom-item-3-2',
        bomId: 'bom-3',
        itemType: 'RAW_MATERIAL',
        itemId: 'rm-5',
        itemName: 'EN19 Pipe 200mm OD',
        itemCode: 'EN19-PIPE-200',
        quantity: 1.1,
        unit: 'meters',
        isOptional: false,
        notes: 'Precision-grade pipe for anilox',
        approvalRequired: true,
        approvedSuppliers: ['Tata Steel', 'JSW Steel']
      },
      // High-precision components
      {
        id: 'bom-item-3-3',
        bomId: 'bom-3',
        itemType: 'COMPONENT',
        itemId: 'comp-1',
        itemName: 'Deep Groove Ball Bearing 6205-2RS',
        itemCode: 'BRG-6205-2RS',
        quantity: 2,
        unit: 'pcs',
        isOptional: false,
        notes: 'Precision grade bearings only',
        approvalRequired: true,
        approvedSuppliers: ['SKF', 'NTN']
      },
      {
        id: 'bom-item-3-4',
        bomId: 'bom-3',
        itemType: 'COMPONENT',
        itemId: 'comp-7',
        itemName: 'Flexible Coupling Type AL-100',
        itemCode: 'COUP-AL-100',
        quantity: 1,
        unit: 'pcs',
        isOptional: false,
        approvalRequired: false
      },
      {
        id: 'bom-item-3-5',
        bomId: 'bom-3',
        itemType: 'COMPONENT',
        itemId: 'comp-5',
        itemName: 'Oil Seal 35x52x7',
        itemCode: 'SEAL-OIL-35X52X7',
        quantity: 2,
        unit: 'pcs',
        isOptional: false,
        approvalRequired: false
      },
      {
        id: 'bom-item-3-6',
        bomId: 'bom-3',
        itemType: 'COMPONENT',
        itemId: 'comp-8',
        itemName: 'Precision Shaft D25 x L150',
        itemCode: 'SHAFT-D25-L150',
        quantity: 2,
        unit: 'pcs',
        isOptional: false,
        notes: 'High-precision ground shafts',
        approvalRequired: true,
        approvedSuppliers: ['In-house']
      }
    ]
  },

  // BOM for IDL-150-SS304-004 (Idler Roller)
  {
    id: 'bom-4',
    productId: 'prod-4',
    bomVersion: 'v1.0',
    isActive: true,
    notes: 'Stainless steel idler roller - corrosion resistant',
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-05'),
    bomItems: [
      // Stainless Steel Raw Materials
      {
        id: 'bom-item-4-1',
        bomId: 'bom-4',
        itemType: 'RAW_MATERIAL',
        itemId: 'rm-3',
        itemName: 'SS304 Rod 40mm',
        itemCode: 'SS304-ROD-40',
        quantity: 0.9,
        unit: 'meters',
        isOptional: false,
        notes: 'Stainless steel for corrosion resistance',
        approvalRequired: true,
        approvedSuppliers: ['Jindal Stainless', 'Viraj Profiles']
      },
      {
        id: 'bom-item-4-2',
        bomId: 'bom-4',
        itemType: 'RAW_MATERIAL',
        itemId: 'rm-6',
        itemName: 'SS304 Pipe 150mm OD',
        itemCode: 'SS304-PIPE-150',
        quantity: 0.85,
        unit: 'meters',
        isOptional: false,
        notes: 'Smaller diameter idler roller',
        approvalRequired: true,
        approvedSuppliers: ['Jindal Stainless', 'Viraj Profiles']
      },
      // Components
      {
        id: 'bom-item-4-3',
        bomId: 'bom-4',
        itemType: 'COMPONENT',
        itemId: 'comp-1',
        itemName: 'Deep Groove Ball Bearing 6205-2RS',
        itemCode: 'BRG-6205-2RS',
        quantity: 2,
        unit: 'pcs',
        isOptional: false,
        notes: 'Stainless steel compatible bearings',
        approvalRequired: true,
        approvedSuppliers: ['SKF', 'NTN', 'NSK']
      },
      {
        id: 'bom-item-4-4',
        bomId: 'bom-4',
        itemType: 'COMPONENT',
        itemId: 'comp-5',
        itemName: 'Oil Seal 35x52x7',
        itemCode: 'SEAL-OIL-35X52X7',
        quantity: 2,
        unit: 'pcs',
        isOptional: false,
        approvalRequired: false
      },
      {
        id: 'bom-item-4-5',
        bomId: 'bom-4',
        itemType: 'COMPONENT',
        itemId: 'comp-8',
        itemName: 'Precision Shaft D25 x L150',
        itemCode: 'SHAFT-D25-L150',
        quantity: 2,
        unit: 'pcs',
        isOptional: false,
        notes: 'SS shafts for corrosion resistance',
        approvalRequired: true,
        approvedSuppliers: ['In-house']
      },
      {
        id: 'bom-item-4-6',
        bomId: 'bom-4',
        itemType: 'COMPONENT',
        itemId: 'comp-12',
        itemName: 'Hex Bolt M8x25 with Nut',
        itemCode: 'BOLT-M8X25-SS',
        quantity: 6,
        unit: 'pcs',
        isOptional: false,
        notes: 'Stainless steel fasteners',
        approvalRequired: false
      }
    ]
  },

  // BOM for MAG-280-EN8-005 (Larger Magnetic Roller)
  {
    id: 'bom-5',
    productId: 'prod-5',
    bomVersion: 'v1.0',
    isActive: true,
    notes: 'Larger magnetic roller 280mm diameter - heavy duty',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15'),
    bomItems: [
      // Raw Materials - Larger diameter
      {
        id: 'bom-item-5-1',
        bomId: 'bom-5',
        itemType: 'RAW_MATERIAL',
        itemId: 'rm-1',
        itemName: 'EN8 Rod 65mm',
        itemCode: 'EN8-ROD-65',
        quantity: 1.4,
        unit: 'meters',
        isOptional: false,
        notes: 'Larger diameter shafts',
        approvalRequired: true,
        approvedSuppliers: ['Tata Steel', 'SAIL']
      },
      {
        id: 'bom-item-5-2',
        bomId: 'bom-5',
        itemType: 'RAW_MATERIAL',
        itemId: 'rm-4',
        itemName: 'EN8 Pipe 280mm OD',
        itemCode: 'EN8-PIPE-280',
        quantity: 1.35,
        unit: 'meters',
        isOptional: false,
        notes: 'Heavy-duty roller body',
        approvalRequired: true,
        approvedSuppliers: ['Tata Steel', 'JSW Steel']
      },
      // Heavy-duty components
      {
        id: 'bom-item-5-3',
        bomId: 'bom-5',
        itemType: 'COMPONENT',
        itemId: 'comp-2',
        itemName: 'Tapered Roller Bearing 32206',
        itemCode: 'BRG-TRB-32206',
        quantity: 2,
        unit: 'pcs',
        isOptional: false,
        notes: 'Heavy-duty bearings for larger roller',
        approvalRequired: true,
        approvedSuppliers: ['SKF', 'Timken', 'NTN']
      },
      {
        id: 'bom-item-5-4',
        bomId: 'bom-5',
        itemType: 'COMPONENT',
        itemId: 'comp-4',
        itemName: 'Helical Gear Module 3, 35 Teeth',
        itemCode: 'GR-M3-Z35',
        quantity: 1,
        unit: 'pcs',
        isOptional: false,
        approvalRequired: false
      },
      {
        id: 'bom-item-5-5',
        bomId: 'bom-5',
        itemType: 'COMPONENT',
        itemId: 'comp-6',
        itemName: 'Mechanical Seal 40x60x10',
        itemCode: 'SEAL-MECH-40X60X10',
        quantity: 2,
        unit: 'pcs',
        isOptional: false,
        approvalRequired: false
      },
      {
        id: 'bom-item-5-6',
        bomId: 'bom-5',
        itemType: 'COMPONENT',
        itemId: 'comp-9',
        itemName: 'Hardened Shaft D30 x L180',
        itemCode: 'SHAFT-D30-L180',
        quantity: 2,
        unit: 'pcs',
        isOptional: false,
        notes: 'Heavy-duty hardened shafts',
        approvalRequired: true,
        approvedSuppliers: ['In-house']
      },
      {
        id: 'bom-item-5-7',
        bomId: 'bom-5',
        itemType: 'COMPONENT',
        itemId: 'comp-10',
        itemName: 'Rubber Bushing 25x35x20',
        itemCode: 'BUSH-RUB-25X35X20',
        quantity: 4,
        unit: 'pcs',
        isOptional: false,
        approvalRequired: false
      },
      {
        id: 'bom-item-5-8',
        bomId: 'bom-5',
        itemType: 'COMPONENT',
        itemId: 'comp-12',
        itemName: 'Hex Bolt M10x30 with Nut',
        itemCode: 'BOLT-M10X30',
        quantity: 10,
        unit: 'pcs',
        isOptional: false,
        notes: 'Larger bolts for heavy-duty assembly',
        approvalRequired: false
      }
    ]
  }
]
