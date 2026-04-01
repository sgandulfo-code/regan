
import { supabase } from './supabase';
import { Property, SearchFolder, User, RenovationItem, UserRole, FolderStatus, TransactionType, FolderShare, SharePermission, Activity, ActivityType, CriteriaTemplate } from '../types';

export interface InboxLink {
  id: string;
  url?: string;
  file_url?: string;
  file_type?: string;
  folder_id: string;
  user_id: string;
  created_at: string;
  status?: string;
  added_by_client?: boolean;
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
      role: data.role as UserRole,
      whatsappNumber: data.whatsapp_number,
      googleAuth: data.google_auth,
      status: data.status || 'active'
    } as User;
  },

  async getGoogleAuthUrl(userId: string) {
    const url = `/api/auth/google/url?userId=${userId}`;
    console.log(`Fetching Google Auth URL from: ${window.location.origin}${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Google Auth URL Error:', errorData.error || 'Failed to get Google Auth URL');
      throw new Error(errorData.error || 'Failed to get Google Auth URL');
    }
    return await response.json();
  },

  async createGoogleCalendarEvent(userId: string, event: any) {
    const response = await fetch('/api/calendar/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, event })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create calendar event');
    }
    return await response.json();
  },

  async getGoogleCalendarEvents(userId: string) {
    const response = await fetch(`/api/calendar/events?userId=${userId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch calendar events');
    }
    return await response.json();
  },

  async updateProfile(id: string, updates: Partial<User>) {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: updates.name,
        whatsapp_number: updates.whatsappNumber
      })
      .eq('id', id);
      
    if (error) throw error;
  },

  async createProfile(id: string, name: string, email: string, role: UserRole, whatsappNumber?: string) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ 
        id, 
        full_name: name, 
        email, 
        role,
        whatsapp_number: whatsappNumber,
        status: 'pending'
      }])
      .select()
      .single();
    return data;
  },

  // Admin functions
  async getPendingUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'pending');
    
    if (error) {
      console.error("Error fetching pending users:", error);
      return [];
    }
    return data.map(d => ({
      id: d.id,
      name: d.full_name,
      email: d.email,
      role: d.role as UserRole,
      whatsappNumber: d.whatsapp_number,
      status: d.status
    } as User));
  },

  async updateUserStatus(id: string, status: 'active' | 'rejected') {
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
  },

  // Folders
  async getFolders(userId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email;

    // 1. Get owned folders
    const { data: owned, error: ownedError } = await supabase
      .from('folders')
      .select('*, client:clients(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ownedError) console.error('Error fetching owned folders:', ownedError);

    // 2. Get shared folders
    let shared: any[] = [];
    if (userEmail) {
      const { data: shares, error: sharesError } = await supabase
        .from('folder_shares')
        .select('permission, folder_id, folder:folders(*, client:clients(*))')
        .eq('user_email', userEmail);

      if (sharesError) {
        console.error('Error fetching shared folders:', sharesError);
      } else {
        shared = (shares || [])
          .filter(s => s.folder) // Ensure folder data exists
          .map(s => ({
            ...s.folder,
            isShared: true,
            permission: s.permission
          }));
      }
    }

    const allFolders = [...(owned || []), ...shared];
    const uniqueFolders = Array.from(new Map(allFolders.map(f => [f.id, f])).values());

    return uniqueFolders.map(f => ({
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
      permission: f.permission || SharePermission.ADMIN,
      welcomeMessage: f.welcome_message,
      stageId: f.stage_id,
      imageUrl: f.image_url,
      isImagePublic: f.is_image_public !== false, // Default to true if null
      client_id: f.client_id,
      stage: f.stage,
      budget_min: Number(f.budget_min),
      budget_max: Number(f.budget_max),
      operation_type: f.operation_type,
      client: f.client
    }));
  },

  async uploadFolderImage(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `folder-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('visit-photos') // Using existing bucket for simplicity
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('visit-photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  async uploadInboxFile(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `inbox-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('visit-photos') // Using existing bucket
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('visit-photos')
      .getPublicUrl(filePath);

    return {
      url: data.publicUrl,
      type: file.type
    };
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
        status_updated_at: new Date().toISOString(),
        welcome_message: folder.welcomeMessage,
        stage_id: folder.stageId,
        image_url: folder.imageUrl,
        is_image_public: folder.isImagePublic ?? true,
        client_id: folder.client_id,
        stage: folder.stage || 'Nuevos Leads',
        budget_min: folder.budget_min,
        budget_max: folder.budget_max,
        operation_type: folder.operation_type
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
      start_date: folder.startDate,
      welcome_message: folder.welcomeMessage,
      stage_id: folder.stageId,
      image_url: folder.imageUrl,
      is_image_public: folder.isImagePublic,
      client_id: folder.client_id,
      stage: folder.stage,
      budget_min: folder.budget_min,
      budget_max: folder.budget_max,
      operation_type: folder.operation_type
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

  // Client Methods
  async getClients(userId: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
    return data;
  },

  async createClient(client: any, userId: string) {
    const { data, error } = await supabase
      .from('clients')
      .insert([{ ...client, user_id: userId }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateClient(id: string, client: any) {
    const { data, error } = await supabase
      .from('clients')
      .update({ ...client, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteClient(id: string) {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
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
      code: p.code,
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
      acquisitionReason: p.acquisition_reason,
      images: p.images || [],
      realEstateAgency: p.real_estate_agency,
      agentName: p.agent_name,
      agentWhatsapp: p.agent_whatsapp,
      isPublic: p.is_public !== undefined ? p.is_public : true,
      clientCustomFields: p.client_custom_fields || {},
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
        code: property.code,
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
        acquisition_reason: property.acquisitionReason,
        images: property.images,
        real_estate_agency: property.realEstateAgency,
        agent_name: property.agentName,
        agent_whatsapp: property.agentWhatsapp,
        is_public: property.isPublic ?? true
      }])
      .select()
      .single();
    return data;
  },

  async copyPropertyToFolder(propertyId: string, targetFolderId: string) {
    // 1. Fetch the original property
    const { data: original, error: fetchError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (fetchError) throw fetchError;

    // 2. Remove specific fields and set the new folder_id
    const { id, created_at, updated_at, folder_id, ...propertyData } = original;
    
    const newProperty = {
      ...propertyData,
      folder_id: targetFolderId,
      status: 'Pendiente', // Reset status for the new folder
    };

    // 3. Insert the new property
    const { data: newProp, error: insertError } = await supabase
      .from('properties')
      .insert([newProperty])
      .select()
      .single();

    if (insertError) throw insertError;
    return newProp;
  },

  async updateProperty(id: string, property: Partial<Property>) {
    const { data, error } = await supabase
      .from('properties')
      .update({
        code: property.code,
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
        acquisition_reason: property.acquisitionReason,
        images: property.images,
        real_estate_agency: property.realEstateAgency,
        agent_name: property.agentName,
        agent_whatsapp: property.agentWhatsapp,
        client_custom_fields: property.clientCustomFields,
        is_public: property.isPublic
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

  async togglePropertyVisibility(id: string, isPublic: boolean) {
    await supabase.from('properties').update({ is_public: isPublic }).eq('id', id);
  },

  async updatePropertyCustomFields(id: string, clientCustomFields: Record<string, any>) {
    await supabase.from('properties').update({ client_custom_fields: clientCustomFields }).eq('id', id);
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
    if (folderId) {
      query = query.eq('folder_id', folderId);
    } else {
      query = query.is('folder_id', null);
    }
    
    // Intentamos filtrar por status='enviado' o NULL
    const { data, error } = await query.or('status.eq.enviado,status.is.null').order('created_at', { ascending: false });
    
    if (error && error.code === '42703') {
      // Si la columna status no existe, hacemos la consulta sin el filtro
      let fallbackQuery = supabase.from('link_inbox').select('*').eq('user_id', userId);
      if (folderId) {
        fallbackQuery = fallbackQuery.eq('folder_id', folderId);
      } else {
        fallbackQuery = fallbackQuery.is('folder_id', null);
      }
      const { data: fallbackData } = await fallbackQuery.order('created_at', { ascending: false });
      return (fallbackData || []) as InboxLink[];
    }
    
    return (data || []) as InboxLink[];
  },

  async getAllInboxLinks(userId: string) {
    const query = supabase.from('link_inbox').select('*').eq('user_id', userId);
    const { data, error } = await query.order('created_at', { ascending: false });
    return (data || []) as InboxLink[];
  },

  async addInboxLinks(links: string[], userId: string, folderId: string | null, addedByClient: boolean = false, files?: { url: string, type: string }[]) {
    const linkEntries = links.map(url => ({
      user_id: userId,
      folder_id: folderId,
      url: url,
      status: 'enviado',
      added_by_client: addedByClient
    }));

    const fileEntries = (files || []).map(file => ({
      user_id: userId,
      folder_id: folderId,
      file_url: file.url,
      file_type: file.type,
      status: 'enviado',
      added_by_client: addedByClient
    }));

    const toInsert = [...linkEntries, ...fileEntries];
    const { error } = await supabase.from('link_inbox').insert(toInsert);
    
    if (error && error.code === '42703') {
      // Fallback logic if columns don't exist
      const fallbackInsert = toInsert.map(item => {
        const { added_by_client, file_url, file_type, ...rest } = item as any;
        return rest;
      });
      await supabase.from('link_inbox').insert(fallbackInsert);
    }
  },

  async removeInboxLink(id: string) {
    // Intenta actualizar el estado a 'rechazado'
    const { error } = await supabase.from('link_inbox').update({ status: 'rechazado' }).eq('id', id);
    if (error && error.code === '42703') { // Columna no existe
      // Fallback: eliminar el link
      await supabase.from('link_inbox').delete().eq('id', id);
    }
  },

  async updateInboxLinkStatus(id: string, status: 'enviado' | 'procesado' | 'rechazado') {
    const { error } = await supabase.from('link_inbox').update({ status }).eq('id', id);
    if (error && error.code === '42703') {
      // Si la columna no existe y el estado es procesado o rechazado, eliminamos el link
      if (status === 'procesado' || status === 'rechazado') {
        await supabase.from('link_inbox').delete().eq('id', id);
      }
    }
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
        clientChecklist: v.client_checklist || [],
        clientFeedback: v.client_feedback,
        rating: v.rating,
        photos: v.photos,
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
        status: visit.status || 'Pending',
        checklist: visit.checklist || [],
        client_checklist: visit.clientChecklist || [],
        client_feedback: visit.clientFeedback,
        status_updated_at: new Date().toISOString()
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

    const updates: any = {};
    if (visit.propertyId !== undefined) updates.property_id = visit.propertyId;
    if (visit.folderId !== undefined) updates.folder_id = visit.folderId || null;
    if (visit.date !== undefined) updates.visit_date = visit.date;
    if (formattedTime !== undefined) updates.visit_time = formattedTime;
    if (visit.contactName !== undefined) updates.contact_name = visit.contactName;
    if (visit.contactPhone !== undefined) updates.contact_phone = visit.contactPhone;
    if (visit.notes !== undefined) updates.notes = visit.notes;
    if (visit.status !== undefined) {
      updates.status = visit.status;
      updates.status_updated_at = new Date().toISOString();
    }
    if (visit.checklist !== undefined) updates.checklist = visit.checklist;
    if (visit.clientChecklist !== undefined) updates.client_checklist = visit.clientChecklist;

    const { data, error } = await supabase
      .from('visits')
      .update(updates)
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

  async uploadVisitPhoto(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('visit-photos')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('visit-photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  async updateVisitFeedback(id: string, feedback: string, photos?: string[], rating?: number) {
    const updatePayload: any = { client_feedback: feedback };
    if (photos) updatePayload.photos = photos;
    if (rating !== undefined) updatePayload.rating = rating;

    const { data, error } = await supabase
      .from('visits')
      .update(updatePayload)
      .eq('id', id);
    return { data, error };
  },

  async updateVisitClientChecklist(id: string, checklist: any[]) {
    const { data, error } = await supabase
      .from('visits')
      .update({ client_checklist: checklist })
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
      .select('*, folder:folders(user_id, name, description, color, budget, transaction_type, start_date, status, welcome_message, image_url, is_image_public)')
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

    // Get all properties for this folder (for the property list view)
    const { data: properties } = await supabase
      .from('properties')
      .select('*')
      .eq('folder_id', itinerary.folder_id)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    return {
      itinerary: {
        id: itinerary.id,
        folderId: itinerary.folder_id,
        settings: itinerary.settings,
        folder: {
          ...itinerary.folder,
          userId: itinerary.folder.user_id,
          transactionType: itinerary.folder.transaction_type,
          startDate: itinerary.folder.start_date,
          budget: itinerary.folder.budget,
          status: itinerary.folder.status,
          welcomeMessage: itinerary.folder.welcome_message,
          imageUrl: itinerary.folder.image_url,
          isImagePublic: itinerary.folder.is_image_public
        }
      },
      visits: (visits || []).map(v => ({
        id: v.id,
        date: v.visit_date || v.date,
        time: v.visit_time || v.time,
        status: v.status,
        clientFeedback: v.client_feedback,
        rating: v.rating,
        photos: v.photos,
        propertyId: v.property_id,
        property: v.property ? {
          ...v.property,
          clientCustomFields: v.property.client_custom_fields || {}
        } : undefined,
        checklist: itinerary.settings.showChecklist ? v.checklist : [],
        clientChecklist: v.client_checklist || []
      })),
      properties: (properties || []).map(p => ({
        id: p.id,
        code: p.code,
        title: p.title,
        address: p.address,
        exactAddress: p.exact_address,
        price: p.price,
        images: p.images,
        environments: p.environments,
        rooms: p.rooms,
        bathrooms: p.bathrooms,
        sqft: p.sqft,
        status: p.status,
        url: p.url,
        fees: p.fees,
        toilets: p.toilets,
        parking: p.parking,
        coveredSqft: p.covered_sqft,
        uncoveredSqft: p.uncovered_sqft,
        age: p.age,
        floor: p.floor,
        acquisitionReason: p.acquisition_reason,
        clientCustomFields: p.client_custom_fields || {}
      }))
    };
  },

  async getFolderSharedLinks(folderId: string) {
    const { data, error } = await supabase
      .from('shared_itineraries')
      .select('*, itinerary_views(count)')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false });
    
    return (data || []).map((s: any) => ({
      id: s.id,
      folderId: s.folder_id,
      isActive: s.is_active,
      settings: s.settings,
      createdAt: s.created_at,
      viewCount: s.itinerary_views ? s.itinerary_views[0]?.count : 0
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
  },

  async recordItineraryView(sharedId: string) {
    try {
      await supabase
        .from('itinerary_views')
        .insert([{
          shared_itinerary_id: sharedId,
          viewed_at: new Date().toISOString(),
          user_agent: navigator.userAgent
        }]);
    } catch (error) {
      // Fail silently if table doesn't exist or other error
      console.warn('Could not record view:', error);
    }
  },

  // Valuation Dossiers
  async getValuationDossiers() {
    const { data, error } = await supabase
      .from('valuation_dossiers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(d => ({
      id: d.id,
      folderId: d.folder_id,
      propertyId: d.property_id,
      suggestedPriceMin: d.suggested_price_min,
      suggestedPriceMax: d.suggested_price_max,
      targetPrice: d.target_price,
      estimatedDaysOnMarket: d.estimated_days_on_market,
      comparables: d.comparables || [],
      marketingPlan: d.marketing_plan || [],
      sellerCosts: d.seller_costs || { commissionPercentage: 0, taxPercentage: 0, itiPercentage: 0, notaryFeePercentage: 0, notaryFees: 0, otherCosts: 0, exchangeRate: 1000, isViviendaUnica: false, hasTractoAbreviado: false, boughtBefore2018: false, originalPurchasePrice: 0 },
      notes: d.notes || '',
      isPublished: d.is_published,
      createdAt: d.created_at,
      updatedAt: d.updated_at
    }));
  },

  async createValuationDossier(dossier: any) {
    const { data, error } = await supabase
      .from('valuation_dossiers')
      .insert([{
        folder_id: dossier.folderId,
        property_id: dossier.propertyId,
        suggested_price_min: dossier.suggestedPriceMin,
        suggested_price_max: dossier.suggestedPriceMax,
        target_price: dossier.targetPrice,
        estimated_days_on_market: dossier.estimatedDaysOnMarket,
        comparables: dossier.comparables,
        marketing_plan: dossier.marketingPlan,
        seller_costs: dossier.sellerCosts,
        notes: dossier.notes,
        is_published: dossier.isPublished
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateValuationDossier(id: string, updates: any) {
    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.suggestedPriceMin !== undefined) dbUpdates.suggested_price_min = updates.suggestedPriceMin;
    if (updates.suggestedPriceMax !== undefined) dbUpdates.suggested_price_max = updates.suggestedPriceMax;
    if (updates.targetPrice !== undefined) dbUpdates.target_price = updates.targetPrice;
    if (updates.estimatedDaysOnMarket !== undefined) dbUpdates.estimated_days_on_market = updates.estimatedDaysOnMarket;
    if (updates.comparables !== undefined) dbUpdates.comparables = updates.comparables;
    if (updates.marketingPlan !== undefined) dbUpdates.marketing_plan = updates.marketingPlan;
    if (updates.sellerCosts !== undefined) dbUpdates.seller_costs = updates.sellerCosts;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.isPublished !== undefined) dbUpdates.is_published = updates.isPublished;

    const { error } = await supabase
      .from('valuation_dossiers')
      .update(dbUpdates)
      .eq('id', id);
      
    if (error) throw error;
  },

  async deleteValuationDossier(id: string) {
    const { error } = await supabase
      .from('valuation_dossiers')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  },

  // Activities
  _clientInfo: null as any,

  async getClientInfo() {
    if (this._clientInfo) return this._clientInfo;
    
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      
      this._clientInfo = {
        ip: ipData.ip,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`
      };
      return this._clientInfo;
    } catch (e) {
      return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`
      };
    }
  },

  async logActivity(activity: Omit<Activity, 'id' | 'createdAt'>) {
    const info = await this.getClientInfo();
    const metadata = {
      ...activity.metadata,
      clientInfo: info
    };

    const { error } = await supabase
      .from('activities')
      .insert([{
        folder_id: activity.folderId,
        agent_id: activity.agentId,
        type: activity.type,
        content: activity.content,
        metadata: metadata
      }]);

    if (error) {
      console.error('Error logging activity:', error);
      // Don't throw error to avoid breaking the main flow
      return null;
    }
  },

  async getActivities(agentId: string, limit = 50) {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    return data.map(d => ({
      id: d.id,
      folderId: d.folder_id,
      agentId: d.agent_id,
      type: d.type as ActivityType,
      content: d.content,
      metadata: d.metadata,
      createdAt: d.created_at
    })) as Activity[];
  },

  // Criteria Templates
  async getCriteriaTemplates(agentId: string) {
    const { data, error } = await supabase
      .from('criteria_templates')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data.map(d => ({
      id: d.id,
      agentId: d.agent_id,
      name: d.name,
      description: d.description,
      fields: d.fields,
      createdAt: d.created_at
    })) as CriteriaTemplate[];
  },

  async createCriteriaTemplate(template: Omit<CriteriaTemplate, 'id' | 'createdAt'>) {
    const { data, error } = await supabase
      .from('criteria_templates')
      .insert([{
        agent_id: template.agentId,
        name: template.name,
        description: template.description,
        fields: template.fields
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCriteriaTemplate(id: string, updates: Partial<CriteriaTemplate>) {
    const { error } = await supabase
      .from('criteria_templates')
      .update({
        name: updates.name,
        description: updates.description,
        fields: updates.fields
      })
      .eq('id', id);

    if (error) throw error;
  },

  async deleteCriteriaTemplate(id: string) {
    const { error } = await supabase
      .from('criteria_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
