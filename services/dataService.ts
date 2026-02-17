
import { supabase } from './supabase';
import { Property, SearchFolder, User, RenovationItem, UserRole } from '../types';

export interface InboxLink {
  id: string;
  url: string;
  folder_id: string;
  user_id: string;
  created_at: string;
}

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
      .insert([{ id, full_name: name, email, role }])
      .select()
      .single();
    return data;
  },

  // Folders
  async getFolders(userId: string) {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return data || [];
  },

  async createFolder(folder: Partial<SearchFolder>, userId: string) {
    const { data, error } = await supabase
      .from('folders')
      .insert([{
        user_id: userId,
        name: folder.name,
        description: folder.description,
        color: folder.color
      }])
      .select()
      .single();
    return data;
  },

  // Properties
  async getProperties(userId: string, folderId?: string) {
    let query = supabase.from('properties').select('*, renovations(*)').eq('user_id', userId);
    if (folderId) query = query.eq('folder_id', folderId);
    const { data, error } = await query;
    return data || [];
  },

  async createProperty(property: Partial<Property>, userId: string) {
    const { data, error } = await supabase
      .from('properties')
      .insert([{
        user_id: userId,
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
  },

  // Link Inbox
  async getInboxLinks(userId: string, folderId: string | null) {
    let query = supabase.from('link_inbox').select('*').eq('user_id', userId);
    if (folderId) query = query.eq('folder_id', folderId);
    const { data, error } = await query.order('created_at', { ascending: false });
    return (data || []) as InboxLink[];
  },

  async addInboxLinks(links: string[], userId: string, folderId: string | null) {
    const toInsert = links.map(url => ({
      user_id: userId,
      folder_id: folderId,
      url: url
    }));
    await supabase.from('link_inbox').insert(toInsert);
  },

  async removeInboxLink(id: string) {
    await supabase.from('link_inbox').delete().eq('id', id);
  },

  async clearInbox(userId: string, folderId: string | null) {
    let query = supabase.from('link_inbox').delete().eq('user_id', userId);
    if (folderId) query = query.eq('folder_id', folderId);
    await query;
  },

  // External Scraper Simulation (Fetch Metadata via Proxy)
  async fetchExternalMetadata(url: string) {
    try {
      // Usamos un proxy público de metadatos como "fallback" externo
      const response = await fetch(`https://api.peekalink.io/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: url })
      }).catch(() => null);

      // Si falla peekalink, usamos allorigins para parsear el título
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      const html = data.contents;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      return {
        title: doc.querySelector('title')?.innerText || '',
        image: doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || null,
        description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || ''
      };
    } catch (e) {
      console.error("External Metadata Fetch Failed", e);
      return null;
    }
  }
};
