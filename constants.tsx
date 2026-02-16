
import React from 'react';
import { 
  Home, 
  Search, 
  Heart, 
  Calendar, 
  Calculator, 
  Users, 
  FileText, 
  Plus, 
  MapPin, 
  ExternalLink,
  MessageSquare,
  Trash2,
  CheckCircle,
  MoreVertical,
  Star
} from 'lucide-react';
import { Property, User, PropertyStatus, UserRole } from './types';

export const ICONS = {
  Home: <Home className="w-5 h-5" />,
  Search: <Search className="w-5 h-5" />,
  Heart: <Heart className="w-5 h-5" />,
  Calendar: <Calendar className="w-5 h-5" />,
  Calculator: <Calculator className="w-5 h-5" />,
  Users: <Users className="w-5 h-5" />,
  FileText: <FileText className="w-5 h-5" />,
  Plus: <Plus className="w-5 h-5" />,
  MapPin: <MapPin className="w-5 h-5" />,
  ExternalLink: <ExternalLink className="w-5 h-5" />,
  MessageSquare: <MessageSquare className="w-5 h-5" />,
  Trash2: <Trash2 className="w-5 h-5" />,
  CheckCircle: <CheckCircle className="w-5 h-5" />,
  MoreVertical: <MoreVertical className="w-5 h-5" />,
  Star: <Star className="w-5 h-5" />
};

export const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Luminous Attic in Madrid Rio',
    url: 'https://example.com/prop1',
    address: 'Paseo de la Chopera, 10, Madrid',
    price: 450000,
    // Fix: Added missing 'environments' property as required by Property interface
    environments: 4,
    rooms: 3,
    bathrooms: 2,
    sqft: 95,
    status: PropertyStatus.VISITED,
    rating: 4,
    notes: 'Great views, needs bathroom updates.',
    renovationCosts: [
      { id: 'r1', category: 'Kitchen', description: 'Modernize appliances and cabinets', estimatedCost: 12000 },
      { id: 'r2', category: 'Bathrooms', description: 'Full retiling and new fixtures', estimatedCost: 8000 }
    ],
    images: ['https://picsum.photos/seed/prop1/800/600'],
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Industrial Loft near Malasaña',
    url: 'https://example.com/prop2',
    address: 'Calle de la Palma, 45, Madrid',
    price: 525000,
    // Fix: Added missing 'environments' property as required by Property interface
    environments: 3,
    rooms: 2,
    bathrooms: 1,
    sqft: 110,
    status: PropertyStatus.WISHLIST,
    rating: 5,
    notes: 'Incredible space but high community fees.',
    renovationCosts: [
      { id: 'r3', category: 'Flooring', description: 'Polished concrete', estimatedCost: 6500 }
    ],
    images: ['https://picsum.photos/seed/prop2/800/600'],
    createdAt: new Date().toISOString()
  }
];

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Alejandro Buyer',
  role: UserRole.BUYER,
  email: 'ale@example.com'
};
