
export enum PropertyStatus {
  WISHLIST = 'Wishlist',
  CONTACTED = 'Contacted',
  VISITED = 'Visited',
  OFFERED = 'Offered',
  DISCARDED = 'Discarded',
  SOLD = 'Vendida',
  SOLD_BY_OTHER = 'Vendida por otra inmobiliaria',
  CANCELLED = 'Cancelada'
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

export enum FunnelStage {
  SEARCH = 'Búsqueda',
  VISITS = 'Visitas',
  RESERVATION = 'Reserva',
  AGREEMENT = 'Boleto',
  DEED = 'Escritura'
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  lead_source?: string;
  timeframe?: string;
  client_type?: string;
  needs_to_sell?: boolean;
  financial_status?: string;
  family_composition?: string;
  pets?: string;
  occupation?: string;
  birthdate?: string;
  last_contact_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
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
  funnelStage?: FunnelStage;
  stageId?: string;
  imageUrl?: string;
  isImagePublic?: boolean;
  client_id?: string;
  stage?: string;
  budget_min?: number;
  budget_max?: number;
  operation_type?: string;
  client?: Client;
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

export enum ActivityType {
  ITINERARY_VIEWED = 'itinerary_viewed',
  VISIT_FEEDBACK = 'visit_feedback',
  PROPERTY_CRITERIA = 'property_criteria',
  NEW_LEAD = 'new_lead',
  VISIT_REQUESTED = 'visit_requested'
}

export interface Activity {
  id: string;
  folderId: string;
  agentId: string;
  type: ActivityType;
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CriteriaField {
  id: string;
  label: string;
  type: 'boolean' | 'text' | 'number' | 'select' | 'rating';
  options?: string[]; // for select
  required?: boolean;
}

export interface CriteriaTemplate {
  id: string;
  agentId: string;
  name: string;
  description?: string;
  fields: CriteriaField[];
  createdAt: string;
}

export interface Property {
  id: string;
  folderId: string;
  code?: string;
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
  clientCustomFields?: Record<string, any>;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  whatsappNumber?: string;
  googleAuth?: any;
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
  photos?: string[];
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
  clientName?: string;
  clientPhone?: string;
  checklist: VisitChecklistItem[];
  clientChecklist?: ClientChecklistItem[];
  notes: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Pending' | 'Confirmed' | 'Requested';
  clientFeedback?: string;
  rating?: number;
  photos?: string[];
  createdAt?: string;
  property?: any;
  syncToGoogle?: boolean;
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

export interface ValuationComparable {
  id: string;
  propertyId: string;
  type: 'active' | 'sold';
  soldPrice?: number;
  soldDate?: string;
  daysOnMarket?: number;
}

export interface MarketingAction {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate?: string;
}

export interface ValuationDossier {
  id: string;
  folderId: string;
  propertyId: string; // The subject property being valued
  suggestedPriceMin: number;
  suggestedPriceMax: number;
  targetPrice: number;
  estimatedDaysOnMarket: number;
  comparables: ValuationComparable[];
  marketingPlan: MarketingAction[];
  sellerCosts: {
    commissionPercentage: number;
    taxPercentage: number;
    notaryFees: number;
    notaryFeePercentage?: number;
    itiPercentage?: number;
    otherCosts: number;
    exchangeRate?: number;
    isViviendaUnica?: boolean;
    hasTractoAbreviado?: boolean;
    boughtBefore2018?: boolean;
    originalPurchasePrice?: number;
  };
  notes: string;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
}
