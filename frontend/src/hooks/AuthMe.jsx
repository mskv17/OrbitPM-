import { useQuery } from '@tanstack/react-query'
import { get } from '../services/api/api';

export const AuthMe = () => useQuery({
  queryKey: ['auth-me'],
    queryFn: async () => {
        const res = await get('/auth/me');
        return res;
    },
    
    refetchOnWindowFocus:false,
  retry: false,
});
