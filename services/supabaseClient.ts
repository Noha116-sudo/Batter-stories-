
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xryoxpjqnjvxllpucztw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeW94cGpxbmp2eGxscHVjenR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMjY3OTksImV4cCI6MjA4MTcwMjc5OX0.dcZs62Ch-MnUlmZDTGUEImZ974L0XXO6iIh1S4-byOo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper for history management
export const saveHistoryItem = async (userId: string, item: any) => {
    const { data, error } = await supabase
        .from('user_history')
        .insert([{ 
            user_id: userId,
            type: item.type,
            summary: item.summary,
            config: item.config,
            timestamp: new Date(item.timestamp).toISOString()
        }]);
    return { data, error };
};

export const fetchUserHistory = async (userId: string) => {
    const { data, error } = await supabase
        .from('user_history')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });
    return { data, error };
};

export const deleteHistoryItem = async (itemId: string) => {
    const { error } = await supabase
        .from('user_history')
        .delete()
        .eq('id', itemId);
    return { error };
};

export const clearUserHistory = async (userId: string) => {
    const { error } = await supabase
        .from('user_history')
        .delete()
        .eq('user_id', userId);
    return { error };
};
