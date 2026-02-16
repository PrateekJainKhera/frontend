export interface ProcessCategory {
  id: number;
  categoryCode: string;
  categoryName: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface CreateProcessCategoryRequest {
  categoryName: string;
  description?: string;
  createdBy?: string;
}

export interface UpdateProcessCategoryRequest {
  id: number;
  categoryCode: string;
  categoryName: string;
  description?: string;
  isActive: boolean;
  updatedBy?: string;
}
