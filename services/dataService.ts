
import { supabase } from './supabase';
import { Property, SearchFolder, User, RenovationItem, UserRole, FolderStatus, TransactionType, FolderShare, SharePermission } from '../types';

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
  async getFolders(userId: string, userEmail?: string) {
    // Get owned folders
    const { data: owned, error: ownedError } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    // Get shared folders
    let shared: any[] = [];
    let sharedShares: any[] = [];
    if (userEmail) {
      const { data: shares, error: sharesError } = await supabase
        .from('folder_shares')
        .select('permission, folder_id, folder:folders(*)')
        .eq('user_email', userEmail);
      
      if (shares) {
        shared = shares.map(s => s.folder).filter(Boolean);
        sharedShares = shares;
      }
    }

    const allFolders = [...(owned || []), ...shared];
    // Remove duplicates if any
    const uniqueFolders = Array.from(new Map(allFolders.map(f => [f.id, f])).values());

    return uniqueFolders.map(f => {
      const share = sharedShares?.find(s => s.folder_id === f.id);
      return {
        id: f.id,
        name: f.name,
        description: f.description,
        color: f.color,
        status: f.status as FolderStatus,
        transactionType: f.transaction_type as TransactionType,
        budget: Number(f.budget),
        startDate: f.start_date,
        statusUpdatedAt: f.status_updated_at,
        createdAt: f.created_at,
        isShared: f.user_id !== userId,
        permission: share ? (share.permission as SharePermission) : SharePermission.ADMIN
      };
    });
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
  async getProperties(userId: string, folderId?: string | null) {
    let query = supabase.from('properties').select('*, renovations(*)');
    
    if (folderId) {
      query = query.eq('folder_id', folderId);
    } else {
      // Get all folders the user has access to first
      const folders = await this.getFolders(userId);
      const folderIds = folders.map(f => f.id);
      
      if (folderIds.length > 0) {
        query = query.or(`user_id.eq.${userId},folder_id.in.(${folderIds.join(',')})`);
      } else {
        query = query.eq('user_id', userId);
      }
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching properties:', error);
      return [];
    }

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

  // Sharing
  async shareFolder(folderId: string, userEmail: string, permission: SharePermission) {
    const { data, error } = await supabase
      .from('folder_shares')
      .insert([{
        folder_id: folderId,
        user_email: userEmail,
        permission: permission,
        invited_at: new Date().toISOString()
      }])
      .select()
      .single();
    return data;
  },

  async getFolderShares(folderId: string) {
    const { data, error } = await supabase
      .from('folder_shares')
      .select('*')
      .eq('folder_id', folderId);
    
    return (data || []).map(s => ({
      id: s.id,
      folderId: s.folder_id,
      userEmail: s.user_email,
      permission: s.permission as SharePermission,
      invitedAt: s.invited_at,
      acceptedAt: s.accepted_at
    })) as FolderShare[];
  },

  async removeFolderShare(shareId: string) {
    await supabase.from('folder_shares').delete().eq('id', shareId);
  },

  // Visits
  async getVisits(userId: string, folderId?: string | null) {
    console.log('Fetching visits for user:', userId, 'folder:', folderId);
    let query = supabase
      .from('visits')
      .select('*, property:properties(title, address, images)');
    
    if (folderId) {
      query = query.eq('folder_id', folderId);
    } else {
      // Get all folders the user has access to
      const folders = await this.getFolders(userId);
      const folderIds = folders.map(f => f.id);
      
      if (folderIds.length > 0) {
        query = query.or(`user_id.eq.${userId},folder_id.in.(${folderIds.join(',')})`);
      } else {
        query = query.eq('user_id', userId);
      }
    }

    const { data, error } = await query
      .order('visit_date', { ascending: true })
      .order('visit_time', { ascending: true });
    
    if (error) {
      console.error('Error fetching visits:', error);
      return [];
    }

    console.log('Raw visits from Supabase:', data);

    return (data || []).map(v => {
      const mapped = {
        id: v.id,
        propertyId: v.property_id,
        folderId: v.folder_id,
        userId: v.user_id,
        date: v.visit_date || v.date,
        time: v.visit_time || v.time,
        contactName: v.contact_name,
        contactPhone: v.contact_phone,
        notes: v.notes,
        status: v.status,
        checklist: v.checklist,
        clientFeedback: v.client_feedback,
        createdAt: v.created_at,
        property: v.property
      };
      return mapped;
    });
  },

  async createVisit(visit: Partial<any>, userId: string) {
    // Ensure time has seconds if only HH:MM is provided
    let formattedTime = visit.time;
    if (formattedTime && formattedTime.length === 5) {
      formattedTime += ':00';
    }

    console.log('Attempting to create visit with data:', { 
      property_id: visit.propertyId,
      folder_id: visit.folderId,
      user_id: userId,
      visit_date: visit.date,
      visit_time: formattedTime
    });

    const { data, error } = await supabase
      .from('visits')
      .insert([{
        property_id: visit.propertyId,
        folder_id: visit.folderId || null,
        user_id: userId,
        visit_date: visit.date,
        visit_time: formattedTime,
        contact_name: visit.contactName,
        contact_phone: visit.contactPhone,
        notes: visit.notes,
        status: visit.status || 'Scheduled',
        checklist: visit.checklist || []
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating visit:', error.message, error.details, error.hint);
      return null;
    }
    console.log('Visit created successfully:', data);
    return data;
  },

  async updateVisit(id: string, visit: Partial<any>) {
    // Ensure time has seconds if only HH:MM is provided
    let formattedTime = visit.time;
    if (formattedTime && formattedTime.length === 5) {
      formattedTime += ':00';
    }

    const { data, error } = await supabase
      .from('visits')
      .update({
        property_id: visit.propertyId,
        folder_id: visit.folderId || null,
        visit_date: visit.date,
        visit_time: formattedTime,
        contact_name: visit.contactName,
        contact_phone: visit.contactPhone,
        notes: visit.notes,
        status: visit.status,
        checklist: visit.checklist
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error updating visit:', error.message, error.details, error.hint);
      return null;
    }
    return data;
  },

  async deleteVisit(id: string) {
    await supabase.from('visits').delete().eq('id', id);
  },

  async updateVisitFeedback(id: string, feedback: string) {
    const { data, error } = await supabase
      .from('visits')
      .update({ client_feedback: feedback })
      .eq('id', id);
    return { data, error };
  },

  // Shared Itineraries
  async createSharedItinerary(folderId: string, userId: string, settings?: any) {
    const { data, error } = await supabase
      .from('shared_itineraries')
      .insert([{
        folder_id: folderId,
        created_by: userId,
        settings: settings || { showPrices: true, showNotes: false, showChecklist: false }
      }])
      .select()
      .single();
    return data;
  },

  async getSharedItinerary(id: string) {
    // This is a public method
    const { data: itinerary, error: itinError } = await supabase
      .from('shared_itineraries')
      .select('*, folder:folders(name, description, color)')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (itinError || !itinerary) return null;

    // Get visits and properties for this folder
    const { data: visits } = await supabase
      .from('visits')
      .select('*, property:properties(*)')
      .eq('folder_id', itinerary.folder_id)
      .order('visit_date', { ascending: true })
      .order('visit_time', { ascending: true });

    return {
      itinerary: {
        id: itinerary.id,
        folderId: itinerary.folder_id,
        settings: itinerary.settings,
        folder: itinerary.folder
      },
      visits: (visits || []).map(v => ({
        id: v.id,
        date: v.visit_date || v.date,
        time: v.visit_time || v.time,
        status: v.status,
        clientFeedback: v.client_feedback,
        property: v.property,
        checklist: itinerary.settings.showChecklist ? v.checklist : []
      }))
    };
  },

  async getFolderSharedLinks(folderId: string) {
    const { data, error } = await supabase
      .from('shared_itineraries')
      .select('*')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false });
    
    return (data || []).map(s => ({
      id: s.id,
      folderId: s.folder_id,
      isActive: s.is_active,
      settings: s.settings,
      createdAt: s.created_at
    }));
  },

  async toggleSharedItinerary(id: string, isActive: boolean) {
    await supabase
      .from('shared_itineraries')
      .update({ is_active: isActive })
      .eq('id', id);
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
