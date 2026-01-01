export enum OSPProcessType {
  HEAT_TREATMENT = "Heat Treatment",
  BLACKENING = "Blackening",
  ANODISING = "Anodising",
  CHROME_PLATING = "Chrome Plating",
  POWDER_COATING = "Powder Coating",
  SPECIAL_MACHINING = "Special Machining"
}

export enum OSPStatus {
  SENT = "Sent to Vendor",
  IN_PROCESS = "In Process at Vendor",
  READY = "Ready for Pickup",
  RECEIVED = "Received",
  REJECTED = "Rejected by Vendor"
}

export interface OSPTransaction {
  id: string;
  orderId: string;
  orderNo: string;
  childPartId: string;
  childPartName: string;
  processId: string;
  processName: string;

  // Vendor
  vendorId: string;
  vendorName: string;
  ospProcessType: OSPProcessType;

  // Tracking
  quantitySent: number;
  quantityReceived: number;
  quantityRejected: number;

  // Dates
  sentDate: Date;
  expectedReturnDate: Date;
  actualReturnDate: Date | null;

  // Status
  status: OSPStatus;
  delayDays: number | null;

  // Documents
  challanNumber: string;
  invoiceNumber: string | null;
  invoiceAmount: number | null;

  // Quality
  receivedWithIssues: boolean;
  issueDescription: string | null;
}
