
import { supabase } from './supabase';
import { Property, SearchFolder, User, RenovationItem } from '../types';

export const dataService = {
  // Profiles
  async getProfileByEmail(email: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();
    if (error) return null;
    return data as User;
  },

  async createProfile(user: User) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ 
        id: user.id, 
        full_name: user.name, 
        email: user.email, 
        role: user.role 
      }])
      .select()
      .single();
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
    const { data, error } = await supabase.from('properties').select('*');
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
    // Primero borramos los anteriores para este property
    await supabase.from('renovations').delete().eq('property_id', propertyId);
    // Luego insertamos los nuevos
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
