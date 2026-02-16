
export const PropertyStatus = {
  WISHLIST: 'Wishlist',
  CONTACTED: 'Contacted',
  VISITED: 'Visited',
  OFFERED: 'Offered',
  DISCARDED: 'Discarded'
} as const;

export type PropertyStatus = typeof PropertyStatus[keyof typeof PropertyStatus];

export const UserRole = {
  BUYER: 'Buyer',
  ARCHITECT: 'Architect',
  CONTRACTOR: 'Contractor'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

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
  price: number;
  rooms: number;
  bathrooms: number;
  sqft: number;
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
