import { useState, useCallback } from 'react';
import { AxiosError, AxiosResponse } from 'axios';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(apiCall: () => Promise<AxiosResponse<T>>) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await apiCall();
      setState({ data: response.data, loading: false, error: null });
      return response.data;
    } catch (err) {
      const error = err as AxiosError<{ error?: string; message?: string }>;
      const message = error.response?.data?.error || error.response?.data?.message || error.message || 'An error occurred';
      setState({ data: null, loading: false, error: String(message) });
      throw err;
    }
  }, [apiCall]);

  return { ...state, execute };
}
