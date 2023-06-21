import { useRouter } from 'next/router';
import { useCallback } from 'react';

function useRequestUtilities() {
  const router = useRouter();

  const logoutUser = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
    router.push('/login');
  }, []);

  const fetchWrapper = useCallback(async function (props: {
    url: RequestInfo | URL;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    includeAuthToken?: boolean;
    body?: any;
    contentType?: string;
    applicationIdentifier?: string;
    initiate?: () => any;
    handleResponse: (response: Response) => any;
    handleError: (error: any) => any;
    handleFinally?: () => any;
  }) {
    function proceedAfterNewToken() {
      fetchWrapper(props);
    }
    const {
      url,
      method = 'GET',
      includeAuthToken = false,
      body,
      initiate,
      handleResponse,
      handleError,
      handleFinally,
    } = props;
    const options: RequestInit = {
      method,
    };
    if (includeAuthToken || body) {
      const headersInit: HeadersInit = {};
      options.headers = headersInit;
      if (body) {
        if (body instanceof FormData) {
          options.body = body;
        } else {
          options.headers['Content-Type'] =
            props.contentType || 'application/json';

          if (props.applicationIdentifier) {
            options.headers['application-identifier'] =
              props.applicationIdentifier;
          }
          options.body = props.contentType ? body : JSON.stringify(body);
        }
      }
      if (includeAuthToken) {
        options.headers.Authorization = `Bearer ${localStorage.getItem(
          'accessToken',
        )}`;
      }
    }
    if (initiate) {
      initiate();
    }
    try {
      const response = await fetch(url, options);
      if (includeAuthToken && response.status === 401) {
        verifyRefreshToken(proceedAfterNewToken);
        return;
      }
      handleResponse(response);
    } catch (error) {
      handleError(error);
    } finally {
      if (handleFinally) {
        handleFinally();
      }
    }
  },
  []);

  const verifyRefreshToken = useCallback(
    async (proceedAfterNewToken: () => any) => {
      const RefreshToken = localStorage.getItem('refreshToken');
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/account/refresh-token`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              RefreshToken,
            }),
          },
        );
        const resJson = await response.json();

        if (response.ok) {
          const userInfo = resJson?.user;
          const accessToken = resJson?.tokens?.accessToken;
          const refreshToken = resJson?.tokens?.refreshToken;
          localStorage.setItem('userInfo', JSON.stringify(userInfo));
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          proceedAfterNewToken();
        } else {
          logoutUser();
        }
      } catch {
        logoutUser();
      }
    },
    [],
  );

  return {
    fetchWrapper,
    verifyRefreshToken,
    nextJsRouter: router,
    logoutUser,
  };
}
export default useRequestUtilities;
