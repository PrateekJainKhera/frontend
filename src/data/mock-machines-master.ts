// Mock data for Machines Master

export interface MachineMaster {
  machineId: string
  machineCode: string
  machineName: string
  type: 'Lathe' | 'CNC_Lathe' | 'Milling' | 'CNC_Mill' | 'Drilling' | 'Grinding' | 'Boring' | 'Welding' | 'Cutting' | 'Other'
  manufacturer?: string
  model?: string
  serialNumber?: string
  location: string
  department?: string
  status: 'Active' | 'In_Use' | 'Idle' | 'Maintenance' | 'Breakdown' | 'Retired'

  purchaseDate?: Date
  purchaseCost?: number
  currentValue?: number

  lastMaintenanceDate?: Date
  nextMaintenanceDate?: Date
  maintenanceIntervalDays?: number

  totalRunHours?: number
  currentMonthHours?: number
  utilizationPercent?: number

  hourlyRate?: number
  isActive: boolean
  notes?: string

  createdAt: Date
  updatedAt: Date
}

export const mockMachinesMaster: MachineMaster[] = [
  {
    machineId: 'MACH-001',
    machineCode: 'LAT-001',
    machineName: 'Heavy Duty Lathe #1',
    type: 'Lathe',
    manufacturer: 'HMT',
    model: 'NH-26',
    serialNumber: 'HMT-NH26-2018-001',
    location: 'Shop Floor A',
    department: 'Turning Section',
    status: 'Active',

    purchaseDate: new Date('2018-03-15'),
    purchaseCost: 2500000,
    currentValue: 1800000,

    lastMaintenanceDate: new Date('2024-12-20'),
    nextMaintenanceDate: new Date('2025-03-20'),
    maintenanceIntervalDays: 90,

    totalRunHours: 8500,
    currentMonthHours: 180,
    utilizationPercent: 75,

    hourlyRate: 350,
    isActive: true,
    notes: 'Primary lathe for large diameter turning operations',

    createdAt: new Date('2018-03-15'),
    updatedAt: new Date('2024-12-20'),
  },

  {
    machineId: 'MACH-002',
    machineCode: 'CNC-LAT-001',
    machineName: 'CNC Lathe #1',
    type: 'CNC_Lathe',
    manufacturer: 'ACE Micromatic',
    model: 'JOBBER XL',
    serialNumber: 'ACE-JXL-2020-045',
    location: 'Shop Floor A',
    department: 'CNC Section',
    status: 'In_Use',

    purchaseDate: new Date('2020-06-10'),
    purchaseCost: 4500000,
    currentValue: 3600000,

    lastMaintenanceDate: new Date('2025-01-05'),
    nextMaintenanceDate: new Date('2025-04-05'),
    maintenanceIntervalDays: 90,

    totalRunHours: 5200,
    currentMonthHours: 220,
    utilizationPercent: 92,

    hourlyRate: 550,
    isActive: true,
    notes: 'High precision CNC lathe with 8-station turret',

    createdAt: new Date('2020-06-10'),
    updatedAt: new Date('2025-01-05'),
  },

  {
    machineId: 'MACH-003',
    machineCode: 'MILL-001',
    machineName: 'Universal Milling Machine #1',
    type: 'Milling',
    manufacturer: 'BFW',
    model: 'UMM-3',
    serialNumber: 'BFW-UMM3-2017-112',
    location: 'Shop Floor B',
    department: 'Milling Section',
    status: 'Idle',

    purchaseDate: new Date('2017-09-22'),
    purchaseCost: 1800000,
    currentValue: 1200000,

    lastMaintenanceDate: new Date('2024-11-15'),
    nextMaintenanceDate: new Date('2025-02-15'),
    maintenanceIntervalDays: 90,

    totalRunHours: 6800,
    currentMonthHours: 95,
    utilizationPercent: 40,

    hourlyRate: 300,
    isActive: true,
    notes: 'General purpose milling for flat surfaces',

    createdAt: new Date('2017-09-22'),
    updatedAt: new Date('2024-11-15'),
  },

  {
    machineId: 'MACH-004',
    machineCode: 'CNC-MILL-001',
    machineName: 'CNC VMC #1',
    type: 'CNC_Mill',
    manufacturer: 'Mazak',
    model: 'VTC-800/30SR',
    serialNumber: 'MAZ-VTC800-2021-089',
    location: 'Shop Floor B',
    department: 'CNC Section',
    status: 'In_Use',

    purchaseDate: new Date('2021-01-20'),
    purchaseCost: 8500000,
    currentValue: 7200000,

    lastMaintenanceDate: new Date('2024-12-28'),
    nextMaintenanceDate: new Date('2025-03-28'),
    maintenanceIntervalDays: 90,

    totalRunHours: 4100,
    currentMonthHours: 210,
    utilizationPercent: 88,

    hourlyRate: 750,
    isActive: true,
    notes: '3-axis VMC with 30-tool magazine, excellent for complex parts',

    createdAt: new Date('2021-01-20'),
    updatedAt: new Date('2024-12-28'),
  },

  {
    machineId: 'MACH-005',
    machineCode: 'DRILL-001',
    machineName: 'Radial Drilling Machine #1',
    type: 'Drilling',
    manufacturer: 'MAS',
    model: 'VR-5',
    serialNumber: 'MAS-VR5-2016-034',
    location: 'Shop Floor A',
    department: 'Drilling Section',
    status: 'Active',

    purchaseDate: new Date('2016-11-08'),
    purchaseCost: 850000,
    currentValue: 500000,

    lastMaintenanceDate: new Date('2024-10-10'),
    nextMaintenanceDate: new Date('2025-01-10'),
    maintenanceIntervalDays: 90,

    totalRunHours: 9200,
    currentMonthHours: 120,
    utilizationPercent: 50,

    hourlyRate: 200,
    isActive: true,
    notes: 'Heavy duty radial drill for large components',

    createdAt: new Date('2016-11-08'),
    updatedAt: new Date('2024-10-10'),
  },

  {
    machineId: 'MACH-006',
    machineCode: 'GRIND-001',
    machineName: 'Cylindrical Grinder #1',
    type: 'Grinding',
    manufacturer: 'Karats',
    model: 'CG-325',
    serialNumber: 'KAR-CG325-2019-078',
    location: 'Shop Floor C',
    department: 'Grinding Section',
    status: 'Active',

    purchaseDate: new Date('2019-04-12'),
    purchaseCost: 3200000,
    currentValue: 2600000,

    lastMaintenanceDate: new Date('2024-12-18'),
    nextMaintenanceDate: new Date('2025-03-18'),
    maintenanceIntervalDays: 90,

    totalRunHours: 5800,
    currentMonthHours: 165,
    utilizationPercent: 69,

    hourlyRate: 450,
    isActive: true,
    notes: 'Precision grinding for shafts and cylindrical parts',

    createdAt: new Date('2019-04-12'),
    updatedAt: new Date('2024-12-18'),
  },

  {
    machineId: 'MACH-007',
    machineCode: 'LAT-002',
    machineName: 'Medium Lathe #2',
    type: 'Lathe',
    manufacturer: 'Lokesh',
    model: 'LT-18',
    serialNumber: 'LOK-LT18-2015-156',
    location: 'Shop Floor A',
    department: 'Turning Section',
    status: 'Maintenance',

    purchaseDate: new Date('2015-08-25'),
    purchaseCost: 1500000,
    currentValue: 800000,

    lastMaintenanceDate: new Date('2025-01-12'),
    nextMaintenanceDate: new Date('2025-01-26'),
    maintenanceIntervalDays: 90,

    totalRunHours: 11200,
    currentMonthHours: 45,
    utilizationPercent: 19,

    hourlyRate: 280,
    isActive: true,
    notes: 'Currently undergoing preventive maintenance - spindle bearing replacement',

    createdAt: new Date('2015-08-25'),
    updatedAt: new Date('2025-01-12'),
  },

  {
    machineId: 'MACH-008',
    machineCode: 'WELD-001',
    machineName: 'MIG Welding Station #1',
    type: 'Welding',
    manufacturer: 'Ador Fontech',
    model: 'CHAMP MIG-500',
    serialNumber: 'ADOR-MIG500-2019-234',
    location: 'Shop Floor D',
    department: 'Welding Section',
    status: 'Active',

    purchaseDate: new Date('2019-12-05'),
    purchaseCost: 450000,
    currentValue: 350000,

    lastMaintenanceDate: new Date('2024-11-30'),
    nextMaintenanceDate: new Date('2025-02-28'),
    maintenanceIntervalDays: 90,

    totalRunHours: 4200,
    currentMonthHours: 140,
    utilizationPercent: 58,

    hourlyRate: 180,
    isActive: true,
    notes: 'Primary welding station for fabrication work',

    createdAt: new Date('2019-12-05'),
    updatedAt: new Date('2024-11-30'),
  },

  {
    machineId: 'MACH-009',
    machineCode: 'CUT-001',
    machineName: 'Hydraulic Shearing Machine',
    type: 'Cutting',
    manufacturer: 'Jainson',
    model: 'JS-3010',
    serialNumber: 'JAI-JS3010-2018-067',
    location: 'Shop Floor D',
    department: 'Sheet Metal Section',
    status: 'Breakdown',

    purchaseDate: new Date('2018-07-18'),
    purchaseCost: 1200000,
    currentValue: 850000,

    lastMaintenanceDate: new Date('2024-09-20'),
    nextMaintenanceDate: new Date('2024-12-20'),
    maintenanceIntervalDays: 90,

    totalRunHours: 6500,
    currentMonthHours: 12,
    utilizationPercent: 5,

    hourlyRate: 220,
    isActive: true,
    notes: 'BREAKDOWN: Hydraulic cylinder leak - spare parts ordered',

    createdAt: new Date('2018-07-18'),
    updatedAt: new Date('2025-01-10'),
  },

  {
    machineId: 'MACH-010',
    machineCode: 'BOR-001',
    machineName: 'Horizontal Boring Machine',
    type: 'Boring',
    manufacturer: 'TOS',
    model: 'WHN-13',
    serialNumber: 'TOS-WHN13-2017-023',
    location: 'Shop Floor B',
    department: 'Heavy Machining',
    status: 'Idle',

    purchaseDate: new Date('2017-03-30'),
    purchaseCost: 5500000,
    currentValue: 4000000,

    lastMaintenanceDate: new Date('2024-10-25'),
    nextMaintenanceDate: new Date('2025-01-25'),
    maintenanceIntervalDays: 90,

    totalRunHours: 3800,
    currentMonthHours: 35,
    utilizationPercent: 15,

    hourlyRate: 600,
    isActive: true,
    notes: 'Specialized machine for large bore operations - used occasionally',

    createdAt: new Date('2017-03-30'),
    updatedAt: new Date('2024-10-25'),
  },
]
