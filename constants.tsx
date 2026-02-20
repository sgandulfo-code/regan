
import React from 'react';
import { Property, SearchFolder, FolderStatus, PropertyStatus, UserRole } from './types';
import { Star, ExternalLink, Calculator } from 'lucide-react';

// Added missing ICONS export
export const ICONS = {
  Star: <Star className="w-3 h-3 text-amber-500 fill-current" />,
  ExternalLink: <ExternalLink className="w-4 h-4" />,
  Calculator: <Calculator className="w-4 h-4" />
};

export const MOCK_FOLDERS: SearchFolder[] = [
  {
    id: 'f1',
    name: 'Madrid Centro',
    description: 'Inversión en apartamentos cerca del Metro',
    color: 'bg-indigo-600',
    status: FolderStatus.ABIERTA
  },
  {
    id: 'f2',
    name: 'Vivienda Familiar',
    description: 'Villas o áticos con terraza en zona norte',
    color: 'bg-rose-600',
    status: FolderStatus.PENDIENTE
  }
];

export const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    folderId: 'f1',
    title: 'Ático Luminoso en Madrid Río',
    url: '#',
    address: 'Paseo de la Chopera, 10, Madrid',
    price: 450000,
    environments: 4,
    rooms: 3,
    bathrooms: 2,
    sqft: 95,
    status: PropertyStatus.VISITED,
    rating: 4,
    notes: 'Excelentes vistas, necesita actualizar baño.',
    renovationCosts: [],
    images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'],
    lat: 40.395,
    lng: -3.698
  },
  {
    id: '2',
    folderId: 'f1',
    title: 'Loft Industrial Malasaña',
    url: '#',
    address: 'Calle de la Palma, 45, Madrid',
    price: 525000,
    environments: 3,
    rooms: 2,
    bathrooms: 1,
    sqft: 110,
    status: PropertyStatus.WISHLIST,
    rating: 5,
    notes: 'Espacio increíble, techos muy altos.',
    renovationCosts: [],
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'],
    lat: 40.426,
    lng: -3.705
  }
];

export const MOCK_USER = {
  id: 'u1',
  name: 'Alejandro Buyer',
  role: UserRole.BUYER,
  email: 'ale@example.com'
};
