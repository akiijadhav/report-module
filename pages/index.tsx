import React, { ReactElement, useEffect } from 'react';
import useRequestUtilities from '../components/hooks/use-request-utilities';
import UserLayout from '../components/layouts/user-layout';
import PageHeaderSkeleton from '../components/loading/page-header-skeleton';
import UserTableSkeleton from '../components/loading/user-table-skeleton';
import { NextPageWithLayout } from './_app';

const HomePage: NextPageWithLayout = (props) => {
  const { logoutUser, nextJsRouter: router } = useRequestUtilities();

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    if (!accessToken || !refreshToken) {
      logoutUser();
    } else {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (userInfo?.role === 'Admin') {
        router.push('/users');
      } else {
        router.push('/data-sources');
      }
    }
  }, []);

  return (
    <>
      <PageHeaderSkeleton />
      <UserTableSkeleton />
    </>
  );
};

export default HomePage;
HomePage.getLayout = function getLayout(page: ReactElement) {
  return <UserLayout>{page}</UserLayout>;
};
