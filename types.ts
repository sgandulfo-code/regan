
// PropertyStatus enum used for tracking the lifecycle of a real estate lead
export enum PropertyStatus {
  WISHLIST = 'Wishlist',
  CONTACTED = 'Contacted',
  VISITED = 'Visited',
  OFFERED = 'Offered',
  DISCARDED = 'Discarded'
}

// UserRole enum defining permissions and views within the application
export enum UserRole {
  BUYER = 'Buyer',
  ARCHITECT = 'Architect',
  CONTRACTOR = 'Contractor'
}

export interface RenovationItem {
  id: string;
  category: string;
  description: string;
  estimatedCost: number;
}

export interface Property {
  id: string;
  title: string;
  url: string;
  address: string;
  exactAddress?: string;
  price: number;
  fees?: number; // Expensas / Community fees
  environments: number; // Ambientes totales
  rooms: number; // Dormitorios/Habitaciones
  bathrooms: number;
  toilets?: number; // Aseos/Toilettes
  parking?: number; // Cocheras/Garajes
  sqft: number; // Total m2
  coveredSqft?: number; // m2 cubiertos
  uncoveredSqft?: number; // m2 descubiertos/terrazas
  age?: number; // Antigüedad en años
  floor?: string; // Planta/Piso
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
