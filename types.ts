
// PropertyStatus enum used for tracking the lifecycle of a real estate lead
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

export enum DocCategory {
  LEGAL = 'Legal',
  TECHNICAL = 'Técnico',
  FINANCIAL = 'Financiero',
  OTHER = 'Otro'
}

// UserRole enum defining permissions and views within the application
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
  transactionType: TransactionType;
  budget: number;
  startDate: string;
  statusUpdatedAt: string;
  createdAt: string;
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
  exactAddress?: string;
  price: number;
  fees?: number; 
  environments: number; 
  rooms: number; 
  bathrooms: number;
  toilets?: number; 
  parking?: number; 
  sqft: number; 
  coveredSqft?: number; 
  uncoveredSqft?: number; 
  age?: number; 
  floor?: string; 
  status: PropertyStatus;
  rating: number;
  notes: string;
  renovationCosts: RenovationItem[];
  images: string[];
  createdAt: string;
}

export interface Visit {
  id: string;
  propertyId: string;
  folderId: string;
  date: string;
  time: string;
  contactName: string;
  contactPhone: string;
  checklist: { task: string; completed: boolean }[];
  notes: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

export interface PropertyDocument {
  id: string;
  propertyId?: string; // Optional if it's folder-level
  folderId: string;
  name: string;
  category: DocCategory;
  fileUrl: string;
  fileType: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  propertyId: string;
  senderId: string;
  senderName: string;
  role: UserRole;
  text: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}
