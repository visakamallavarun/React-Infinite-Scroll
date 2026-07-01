import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { PaginatedResponse } from '../components/InfiniteScrollTable';
import { DEFAULT_MAX_PAGES } from '../App';

interface UseGenericInfiniteQueryParams<TData> {
    queryKey: unknown[]; // include all reactive parts: filters, IDs, etc.
    fetchFn: (pageParam: number, signal: AbortSignal) => Promise<PaginatedResponse<TData>>;
    enabled?: boolean;
}

export function useGenericInfiniteQuery<TData>({
    queryKey,
    fetchFn,
    enabled = true,
}: UseGenericInfiniteQueryParams<TData>) {
    const queryClient = useQueryClient();
    const query = useInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam, signal }) => fetchFn(pageParam, signal),
        initialPageParam: 1,
        getPreviousPageParam: (firstPage) =>
            firstPage.hasPreviousPage ? firstPage.page - 1 : undefined,
        getNextPageParam: (lastPage) =>
            lastPage.hasNextPage ? lastPage.page + 1 : undefined,
        maxPages: DEFAULT_MAX_PAGES,
        enabled: enabled,
    });

    const { refetch } = query;

    const hasRunMap = useRef<Record<string, boolean>>({});

    useEffect(() => {
        const key = JSON.stringify(queryKey);

        // reset all other keys to false so they can run again if mounted later
        Object.keys(hasRunMap.current).forEach(k => {
            if (k !== key) hasRunMap.current[k] = false;
        });

        if (hasRunMap.current[key]) return; // already executed for this queryKey

        hasRunMap.current[key] = true; // mark current key as executed

        const cached = queryClient.getQueryData<{ pageParams: number[]; pages: TData[] }>(queryKey);

        if (cached && cached.pageParams.length > 0 && cached.pageParams[0] !== 1) {
            queryClient.removeQueries({ queryKey });
            refetch();
        }
    }, [queryKey, queryClient, refetch]);

    return query;
}