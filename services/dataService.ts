
import { supabase } from './supabase';
import { Property, SearchFolder, User, RenovationItem, UserRole, FolderStatus, TransactionType } from '../types';

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
    
    return (data || []).map(f => ({
      id: f.id,
      name: f.name,
      description: f.description,
      color: f.color,
      status: f.status as FolderStatus,
      transactionType: f.transaction_type as TransactionType,
      budget: Number(f.budget),
      startDate: f.start_date,
      statusUpdatedAt: f.status_updated_at,
      createdAt: f.created_at
    }));
  },

  async createFolder(folder: Partial<SearchFolder>, userId: string) {
    const { data, error } = await supabase
      .from('folders')
      .insert([{
        user_id: userId,
        name: folder.name,
        description: folder.description,
        color: folder.color,
        status: folder.status || FolderStatus.PENDIENTE,
        transaction_type: folder.transactionType || TransactionType.COMPRA,
        budget: folder.budget || 0,
        start_date: folder.startDate || new Date().toISOString(),
        status_updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    return data;
  },

  async updateFolder(id: string, folder: Partial<SearchFolder>) {
    const { data: currentFolder } = await supabase.from('folders').select('status').eq('id', id).single();

    const updatePayload: any = {
      name: folder.name,
      description: folder.description,
      status: folder.status,
      transaction_type: folder.transactionType,
      budget: folder.budget,
      start_date: folder.startDate
    };

    if (folder.status && currentFolder && folder.status !== currentFolder.status) {
      updatePayload.status_updated_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('folders')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();
    return data;
  },

  async deleteFolder(id: string) {
    await supabase.from('folders').delete().eq('id', id);
  },

  // Properties
  async getProperties(userId: string, folderId?: string) {
    let query = supabase.from('properties').select('*, renovations(*)').eq('user_id', userId);
    if (folderId) query = query.eq('folder_id', folderId);
    const { data, error } = await query;
    return (data || []).map((p: any) => ({
      id: p.id,
      folderId: p.folder_id,
      title: p.title,
      url: p.url,
      address: p.address,
      exactAddress: p.exact_address,
      price: Number(p.price),
      fees: Number(p.fees),
      environments: p.environments,
      rooms: p.rooms,
      bathrooms: p.bathrooms,
      toilets: p.toilets,
      parking: p.parking,
      sqft: Number(p.sqft),
      coveredSqft: Number(p.covered_sqft),
      uncoveredSqft: Number(p.uncovered_sqft),
      age: p.age,
      floor: p.floor,
      status: p.status as any,
      rating: p.rating,
      notes: p.notes,
      images: p.images || [],
      renovationCosts: (p.renovations || []).map((r: any) => ({
        id: r.id,
        category: r.category,
        description: r.description,
        estimatedCost: Number(r.estimated_cost)
      })),
      createdAt: p.created_at
    }));
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

  async updateProperty(id: string, property: Partial<Property>) {
    const { data, error } = await supabase
      .from('properties')
      .update({
        title: property.title,
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
        notes: property.notes,
        rating: property.rating,
        images: property.images 
      })
      .eq('id', id)
      .select()
      .single();
    return data;
  },

  async deleteProperty(id: string) {
    await supabase.from('properties').delete().eq('id', id);
  },

  async updatePropertyStatus(id: string, status: string) {
    await supabase.from('properties').update({ status }).eq('id', id);
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
  },

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

  async fetchExternalMetadata(url: string) {
    const mshotsFallback = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=1280`;
    try {
      const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true`;
      const response = await fetch(microlinkUrl);
      if (!response.ok) return { title: '', screenshot: mshotsFallback };
      const result = await response.json();
      if (result.status === 'success') {
        const { data } = result;
        return {
          title: data.title || '',
          image: data.screenshot?.url || data.image?.url || mshotsFallback,
          description: data.description || '',
          screenshot: data.screenshot?.url || mshotsFallback,
          publisher: data.publisher || ''
        };
      }
      return { title: '', screenshot: mshotsFallback };
    } catch (e) {
      return { title: '', screenshot: mshotsFallback };
    }
  }
};
