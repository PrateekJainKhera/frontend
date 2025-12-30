import { Customer } from '@/types'

export const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'ABC Flexo Packaging Ltd.',
    code: 'ABC001',
    contactPerson: 'Rajesh Kumar',
    email: 'rajesh@abcflexo.com',
    phone: '+91 98765 43210',
    address: 'Plot 45, Industrial Area, Ahmedabad, Gujarat - 380015',
    isActive: true,
    createdAt: new Date('2023-06-15'),
    updatedAt: new Date('2023-06-15')
  },
  {
    id: 'cust-2',
    name: 'XYZ Printing Solutions Pvt. Ltd.',
    code: 'XYZ002',
    contactPerson: 'Priya Sharma',
    email: 'priya@xyzprint.com',
    phone: '+91 98765 43211',
    address: 'B-12, GIDC Estate, Vapi, Gujarat - 396195',
    isActive: true,
    createdAt: new Date('2023-08-20'),
    updatedAt: new Date('2023-08-20')
  },
  {
    id: 'cust-3',
    name: 'PQR Industries Limited',
    code: 'PQR003',
    contactPerson: 'Amit Desai',
    email: 'amit@pqrindustries.com',
    phone: '+91 98765 43212',
    address: '15/A, Phase-2, Vatva GIDC, Ahmedabad, Gujarat - 382445',
    isActive: true,
    createdAt: new Date('2023-09-10'),
    updatedAt: new Date('2023-09-10')
  },
  {
    id: 'cust-4',
    name: 'Modern Packaging Systems',
    code: 'MPS004',
    contactPerson: 'Sanjay Patel',
    email: 'sanjay@modernpack.com',
    phone: '+91 98765 43213',
    address: 'Plot 78, Changodar Industrial Estate, Ahmedabad - 382213',
    isActive: true,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05')
  },
  {
    id: 'cust-5',
    name: 'Global Print Tech India',
    code: 'GPT005',
    contactPerson: 'Neha Shah',
    email: 'neha@globalprinttech.com',
    phone: '+91 98765 43214',
    address: 'Survey No. 234, Sachin GIDC, Surat, Gujarat - 394230',
    isActive: true,
    createdAt: new Date('2024-02-12'),
    updatedAt: new Date('2024-02-12')
  },
  {
    id: 'cust-6',
    name: 'Supreme Flexo Printers',
    code: 'SFP006',
    contactPerson: 'Vikram Mehta',
    email: 'vikram@supremeflexo.com',
    phone: '+91 98765 43215',
    address: 'Unit 5, Odhav Industrial Area, Ahmedabad - 382415',
    isActive: true,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01')
  }
]
