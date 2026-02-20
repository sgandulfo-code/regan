
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
  folderId: string; // Relación con la carpeta de búsqueda
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
  date: string;
  time: string;
  contactName: string;
  contactPhone: string;
  notes: string;
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
