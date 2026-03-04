
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
  ALQUILER = 'Alquiler',
  VENTA = 'Venta',
  ALQUILER_TEMPORARIO = 'Alquiler Temporario'
}

export enum UserRole {
  BUYER = 'Buyer',
  ARCHITECT = 'Architect',
  CONTRACTOR = 'Contractor',
  AGENT = 'Agent',
  CLIENT = 'Client'
}

export enum SharePermission {
  VIEW = 'view',
  EDIT = 'edit',
  ADMIN = 'admin'
}

export interface FolderShare {
  id: string;
  folderId: string;
  userEmail: string;
  permission: SharePermission;
  invitedAt: string;
  acceptedAt?: string;
}

// Added missing DocCategory enum for document classification
export enum DocCategory {
  LEGAL = 'Legal',
  TECHNICAL = 'Technical',
  FINANCIAL = 'Financial',
  OTHER = 'Other'
}

export interface SearchFolder {
  id: string;
  name: string;
  description: string;
  color: string;
  status: FolderStatus;
  transactionType?: TransactionType;
  budget?: number;
  startDate?: string;
  statusUpdatedAt?: string;
  createdAt?: string;
  isShared?: boolean;
  permission?: SharePermission;
  welcomeMessage?: string;
}

export interface RenovationItem {
  id: string;
  category: string;
  description: string;
  estimatedCost: number;
}

export enum AcquisitionReason {
  COMPARABLE = 'Comparable',
  CAPTACION = 'Captación',
  BUSQUEDA = 'Búsqueda'
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
  lat?: number;
  lng?: number;
  createdAt?: string;
  acquisitionReason?: AcquisitionReason;
  realEstateAgency?: string;
  agentName?: string;
  agentWhatsapp?: string;
  isPublic?: boolean;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  whatsappNumber?: string;
}

// Added missing PropertyDocument interface for the DocumentVault functionality
export interface PropertyDocument {
  id: string;
  folderId: string;
  propertyId?: string;
  name: string;
  category: DocCategory;
  fileUrl: string;
  fileType: string;
  createdAt?: string;
}

// Added missing Visit types for property inspection scheduling
export interface VisitChecklistItem {
  task: string;
  completed: boolean;
}

export interface ClientChecklistItem {
  id: string;
  label: string;
  response: 'yes' | 'no' | 'maybe' | null;
  comment?: string;
}

export interface FeedbackItem {
  id: string;
  content: string;
  photos: string[];
  createdAt: string;
  updatedAt?: string;
  author: 'client' | 'agent';
}

export interface Visit {
  id: string;
  propertyId: string;
  folderId: string;
  userId: string;
  date: string;
  time: string;
  contactName: string;
  contactPhone: string;
  checklist: VisitChecklistItem[];
  clientChecklist?: ClientChecklistItem[];
  notes: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Pending' | 'Confirmed';
  clientFeedback?: string;
  rating?: number;
  photos?: string[];
  createdAt?: string;
  property?: any;
}

export interface SharedItinerary {
  id: string;
  folderId: string;
  createdBy: string;
  isActive: boolean;
  settings: {
    showPrices: boolean;
    showNotes: boolean;
    showChecklist: boolean;
  };
  createdAt: string;
  expiresAt?: string;
}
