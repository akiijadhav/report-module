import type { ReactElement, ReactNode } from 'react';
import type { NextPage } from 'next';
import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import Layout from '../components/layouts/layout';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { useRouter } from 'next/router';

// eslint-disable-next-line @typescript-eslint/ban-types
export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('language')) {
      router.push(router.route, router.asPath, {
        locale: localStorage.getItem('language'),
      });
    } else {
      router.push(router.route, router.asPath, {
        locale: 'en',
      });
    }
  }, []);
  useEffect(() => {
    i18n.changeLanguage(router.locale);
  }, [router.locale]);
  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page) => page);
  return getLayout(
    <I18nextProvider i18n={i18n}>
      <Component {...pageProps} />
    </I18nextProvider>,
  );
}
export default App;
