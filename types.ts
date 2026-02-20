
export enum PropertyStatus {
  WISHLIST = 'Wishlist',
  CONTACTED = 'Contacted',
  VISITED = 'Visited',
  OFFERED = 'Offered',
  DISCARDED = 'Discarded'
}

export enum FolderStatus {
  PENDIENTE = 'Pendiente',
  ABIERTA = 'Abierta',
  CERRADA = 'Cerrada'
}

export enum TransactionType {
  COMPRA = 'Compra',
  ALQUILER = 'Alquiler'
}

export enum UserRole {
  BUYER = 'Buyer',
  ARCHITECT = 'Architect',
  CONTRACTOR = 'Contractor'
}

export interface SearchFolder {
  id: string;
  name: string;
  description: string;
  color: string;
  status: FolderStatus;
  // Added missing fields for SearchFolder
  transactionType?: TransactionType;
  budget?: number;
  startDate?: string;
  statusUpdatedAt?: string;
  createdAt?: string;
}

export interface RenovationItem {
  id: string;
  category: string;
  description: string;
  estimatedCost: number;
}

export interface Property {
  id: string;
  folderId: string;
  title: string;
  url: string;
  address: string;
  price: number;
  environments: number;
  rooms: number;
  bathrooms: number;
  sqft: number;
  status: PropertyStatus;
  rating: number;
  notes: string;
  renovationCosts: RenovationItem[];
  images: string[];
  lat?: number;
  lng?: number;
  // Added missing fields for Property
  exactAddress?: string;
  fees?: number;
  toilets?: number;
  parking?: number;
  coveredSqft?: number;
  uncoveredSqft?: number;
  age?: number;
  floor?: string;
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

// Added Visit related types
export interface VisitTask {
  task: string;
  completed: boolean;
}

export interface Visit {
  id: string;
  propertyId: string;
  folderId: string;
  date: string;
  time: string;
  contactName: string;
  contactPhone: string;
  checklist: VisitTask[];
  notes: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

// Added Document related types
export enum DocCategory {
  LEGAL = 'Legal',
  TECHNICAL = 'Technical',
  FINANCIAL = 'Financial',
  OTHER = 'Other'
}

export interface PropertyDocument {
  id: string;
  propertyId: string;
  folderId: string;
  name: string;
  category: DocCategory;
  fileUrl: string;
  fileType: string;
  createdAt: string;
}
