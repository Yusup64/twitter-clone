// import { useQuery } from '@tanstack/react-query';

// import { verifyToken } from '@/api/user';

// export function useAuth() {
//   return useQuery({
//     queryKey: ['auth'],
//     queryFn: () => verifyToken({}, {}),
//     staleTime: 5 * 60 * 1000, // 数据5分钟内认为是新鲜的
//     cacheTime: 10 * 60 * 1000, // 缓存10分钟
//     retry: false,
//   });
// }
