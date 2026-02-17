
import { supabase } from './supabase';
import { Property, SearchFolder, User, RenovationItem, UserRole } from '../types';

export const dataService = {
  // Profiles
  async getProfile(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    
    return {
      id: data.id,
      name: data.full_name,
      email: data.email,
      role: data.role as UserRole
    } as User;
  },

  async createProfile(id: string, name: string, email: string, role: UserRole) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ 
        id, // Usamos el ID de Auth
        full_name: name, 
        email: email, 
        role: role 
      }])
      .select()
      .single();
      
    if (error) {
      console.error("Error creating profile record:", error);
      return null;
    }
    return data;
  },

  // Folders
  async getFolders() {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .order('created_at', { ascending: false });
    return data || [];
  },

  async createFolder(folder: Partial<SearchFolder>) {
    const { data, error } = await supabase
      .from('folders')
      .insert([folder])
      .select()
      .single();
    return data;
  },

  // Properties
  async getProperties(folderId?: string) {
    let query = supabase.from('properties').select('*, renovations(*)');
    
    if (folderId) {
      query = query.eq('folder_id', folderId);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error("Error fetching properties:", error);
      return [];
    }
    return data || [];
  },

  async createProperty(property: Partial<Property>) {
    const { data, error } = await supabase
      .from('properties')
      .insert([{
        folder_id: property.folderId,
        title: property.title,
        url: property.url,
        address: property.address,
        exact_address: property.exactAddress,
        price: property.price,
        fees: property.fees,
        environments: property.environments,
        rooms: property.rooms,
        bathrooms: property.bathrooms,
        toilets: property.toilets,
        parking: property.parking,
        sqft: property.sqft,
        covered_sqft: property.coveredSqft,
        uncovered_sqft: property.uncoveredSqft,
        age: property.age,
        floor: property.floor,
        status: property.status,
        rating: property.rating,
        notes: property.notes,
        images: property.images
      }])
      .select()
      .single();
    return data;
  },

  async updatePropertyStatus(id: string, status: string) {
    await supabase.from('properties').update({ status }).eq('id', id);
  },

  // Renovations
  async getRenovations(propertyId: string) {
    const { data, error } = await supabase
      .from('renovations')
      .select('*')
      .eq('property_id', propertyId);
    return data || [];
  },

  async updateRenovations(propertyId: string, items: RenovationItem[], userId: string) {
    await supabase.from('renovations').delete().eq('property_id', propertyId);
    if (items.length > 0) {
      const toInsert = items.map(item => ({
        property_id: propertyId,
        author_id: userId,
        category: item.category,
        description: item.description,
        estimated_cost: item.estimatedCost
      }));
      await supabase.from('renovations').insert(toInsert);
    }
  }
};
