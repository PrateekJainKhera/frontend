// All enums used across the application

export enum RollerType {
  MAGNETIC = 'Magnetic',
  RUBBER = 'Rubber',
  ANILOX = 'Anilox',
  IDLER = 'Idler',
  PRINTING = 'Printing',
  EMBOSSING = 'Embossing'
}

export enum MaterialGrade {
  EN8 = 'EN8',
  EN19 = 'EN19',
  SS304 = 'SS304',
  SS316 = 'SS316',
  ALLOY_STEEL = 'Alloy Steel'
}

export enum MaterialShape {
  ROD = 'Rod',
  PIPE = 'Pipe',
  FORGED = 'Forged'
}

export enum ProcessCategory {
  MACHINING = 'Machining',
  HEAT_TREATMENT = 'Heat Treatment',
  FINISHING = 'Finishing',
  ASSEMBLY = 'Assembly',
  INSPECTION = 'Inspection',
  DISPATCH = 'Dispatch'
}

export enum SkillLevel {
  BASIC = 'Basic',
  INTERMEDIATE = 'Intermediate',
  EXPERT = 'Expert'
}

export enum OrderStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  REJECTED = 'Rejected',
  ON_HOLD = 'On Hold',
  CANCELLED = 'Cancelled'
}

export enum PlanningStatus {
  NOT_PLANNED = 'Not Planned',
  PLANNED = 'Planned',
  RELEASED = 'Released'
}

export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent'
}

export enum DelayReason {
  OEM_DELAY = 'OEM Delay',
  MATERIAL_SHORTAGE = 'Material Shortage',
  MACHINE_BREAKDOWN = 'Machine Breakdown',
  QUALITY_ISSUE = 'Quality Issue',
  POWER_OUTAGE = 'Power Outage'
}

export enum ProcessStatus {
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  REJECTED = 'Rejected',
  ON_HOLD = 'On Hold'
}

export enum UserRole {
  ADMIN = 'Admin',
  MANAGEMENT = 'Management',
  PRODUCTION_PLANNER = 'Production Planner',
  SALES = 'Sales',
  CNC_OPERATOR = 'CNC Operator',
  VMC_OPERATOR = 'VMC Operator',
  GRINDING_OPERATOR = 'Grinding Operator',
  INSPECTOR = 'Inspector',
  INVENTORY_MANAGER = 'Inventory Manager'
}

export enum Department {
  ADMIN = 'Admin',
  SALES = 'Sales',
  PRODUCTION = 'Production',
  PLANNING = 'Planning',
  QC = 'QC',
  INVENTORY = 'Inventory',
  MAINTENANCE = 'Maintenance'
}

export enum MachineType {
  CNC = 'CNC',
  VMC = 'VMC',
  GRINDING = 'Grinding',
  BALANCING = 'Balancing',
  ASSEMBLY = 'Assembly'
}

export enum ModuleName {
  ORDERS = 'Orders',
  PRODUCTION = 'Production',
  MASTERS = 'Masters',
  MIS_DASHBOARD = 'MIS Dashboard',
  PRICING = 'Pricing',
  QUOTATIONS = 'Quotations',
  INVENTORY = 'Inventory',
  REPORTS = 'Reports'
}

export enum CustomerType {
  DIRECT = 'Direct Customer',
  AGENT = 'Agent/Distributor',
  DEALER = 'Dealer'
}

export enum OrderSource {
  DIRECT = 'Direct',
  AGENT = 'Through Agent',
  REPEAT = 'Repeat Order'
}

export enum SchedulingStrategy {
  DUE_DATE = 'Due Date Priority',
  PRIORITY_FLAG = 'Priority Flag',
  CUSTOMER_IMPORTANCE = 'Customer Importance',
  RESOURCE_AVAILABILITY = 'Resource Availability'
}
