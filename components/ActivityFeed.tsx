
import React, { useEffect, useState } from 'react';
import { Activity, ActivityType, User } from '../types';
import { dataService } from '../services/dataService';
import { 
  Eye, 
  MessageSquare, 
  Star, 
  PlusCircle, 
  Calendar, 
  Clock, 
  ChevronRight,
  User as UserIcon,
  Home,
  ExternalLink,
  Activity as ActivityIcon
} from 'lucide-react';

interface ActivityFeedProps {
  user: User;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ user }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await dataService.getActivities(user.id);
        setActivities(data);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, [user.id]);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.ITINERARY_VIEWED:
        return <Eye className="w-4 h-4 text-blue-500" />;
      case ActivityType.VISIT_FEEDBACK:
        return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case ActivityType.PROPERTY_CRITERIA:
        return <Star className="w-4 h-4 text-amber-500" />;
      case ActivityType.NEW_LEAD:
        return <PlusCircle className="w-4 h-4 text-indigo-500" />;
      case ActivityType.VISIT_REQUESTED:
        return <Calendar className="w-4 h-4 text-rose-500" />;
      default:
        return <ActivityIcon className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays === 1) return 'Ayer';
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Feed de Actividad</h2>
          <p className="text-slate-500 font-medium">Monitorea las interacciones de tus clientes en tiempo real.</p>
        </div>
        <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider border border-indigo-100">
          En Vivo
        </div>
      </div>

      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div 
              key={activity.id} 
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  activity.type === ActivityType.ITINERARY_VIEWED ? 'bg-blue-50' :
                  activity.type === ActivityType.VISIT_FEEDBACK ? 'bg-emerald-50' :
                  activity.type === ActivityType.PROPERTY_CRITERIA ? 'bg-amber-50' :
                  activity.type === ActivityType.NEW_LEAD ? 'bg-indigo-50' :
                  'bg-rose-50'
                }`}>
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatTime(activity.createdAt)}
                    </span>
                    <button className="text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <p className="text-slate-800 font-bold text-lg leading-snug mb-2">
                    {activity.content}
                  </p>

                  {activity.metadata && (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      {activity.type === ActivityType.VISIT_FEEDBACK && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex text-amber-400">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < (activity.metadata?.rating || 0) ? 'fill-current' : 'text-slate-200'}`} />
                              ))}
                            </div>
                            <span className="text-xs font-bold text-slate-500">{activity.metadata.rating} / 5</span>
                          </div>
                          {activity.metadata.feedback && (
                            <p className="text-sm text-slate-600 italic">"{activity.metadata.feedback}"</p>
                          )}
                        </div>
                      )}

                      {activity.type === ActivityType.PROPERTY_CRITERIA && (
                        <div className="flex items-center gap-2">
                          <span className="bg-white px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold text-indigo-600">
                            {activity.metadata.fieldName}
                          </span>
                          <ChevronRight className="w-3 h-3 text-slate-300" />
                          <span className="text-xs font-bold text-slate-700">{activity.metadata.fieldValue}</span>
                        </div>
                      )}

                      {activity.type === ActivityType.NEW_LEAD && activity.metadata.links && (
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                          <ExternalLink className="w-3 h-3" />
                          <span className="truncate">
                            {Array.isArray(activity.metadata.links) ? activity.metadata.links[0] : activity.metadata.links}
                          </span>
                        </div>
                      )}

                      {activity.type === ActivityType.VISIT_REQUESTED && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-rose-500">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <p className="text-xs font-bold text-slate-600 truncate">{activity.metadata.message}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100">
            <ActivityIcon className="w-16 h-16 text-slate-100 mx-auto mb-6" />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">No hay actividad reciente.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
