import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import useRequestUtilities from '../../components/hooks/use-request-utilities';
import UserLayout from '../../components/layouts/user-layout';
import PageContainer from '../../components/users/page-container';
import { NextPageWithLayout } from '../_app';
import ReportTableSkeleton from '../../components/loading/report-table-skeleton';
import { useTranslation } from 'react-i18next';
import { DataSourceModel } from '../../components/data-sources/models/data-source';
import DataSourceTable from '../../components/data-sources/data-sources-table';
import CreateModal from '../../components/data-sources/create-modal';
import Image from 'next/image';
import generateReportIcon from '../../public/icons/generate-report-icon.svg';

const DataSourcePage: NextPageWithLayout = function () {
  const {
    fetchWrapper,
    logoutUser,
    nextJsRouter: router,
  } = useRequestUtilities();
  const refetchDataSources =
    typeof router.query.refetch === 'string'
      ? router.query.refetch
      : router.query?.refetch?.at(0);
  type viewScreenType =
    | 'loading'
    | 'dataAbsent'
    | 'dataPresent'
    | 'responseError';
  const [viewScreen, setViewScreen] = useState<viewScreenType>('loading');
  const [responseErrorMsg, setResponseErrorMsg] = useState('');
  const [data, setData] = useState<DataSourceModel[]>([]);
  const [createDataSourceModal, setCreateDataSourceModal] = useState(false);
  const { t } = useTranslation();

  const fetchDataSources = useCallback(async function (Refetch = false) {
    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.ok) {
        const newReports: DataSourceModel[] = resJson;
        if (newReports.length) {
          if (Refetch) {
            setData(newReports);
          } else {
            setData((old) => {
              const uniqueNewReports: DataSourceModel[] = [];
              newReports.forEach((newReport) => {
                if (
                  old.find((report) => report.id === newReport.id) === undefined
                ) {
                  uniqueNewReports.push(newReport);
                }
              });
              return [...old, ...uniqueNewReports];
            });
          }
          setViewScreen('dataPresent');
        } else if (data.length < 1 && newReports.length < 1) {
          setViewScreen('dataAbsent');
        }
      } else {
        const errorMsg =
          typeof resJson?.message === 'string'
            ? resJson.message
            : resJson?.message?.at(0);
        setResponseErrorMsg(
          `Error ${response.status}: ${errorMsg || response.statusText}`,
        );
        setViewScreen('responseError');
      }
    }
    function handleError(_error: any) {
      setResponseErrorMsg(t('error.something_went_wrong'));
      setViewScreen('responseError');
    }

    fetchWrapper({
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/datasources`,
      includeAuthToken: true,
      handleResponse,
      handleError,
    });
  }, []);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    if (!accessToken || !refreshToken) {
      logoutUser();
      return;
    } else {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (userInfo?.role !== 'LabEngineer') {
        router.replace('/users');
        return;
      }
      fetchDataSources(Boolean(refetchDataSources));
    }
  }, [refetchDataSources]);

  if (viewScreen === 'loading') {
    return (
      <>
        <div className="py-4 px-6 flex items-center justify-between border-b border-gray-300 font-semibold text-xl text-gray-800">
          <div className="bg-gray-300 rounded-full w-20 h-5 animate-pulse" />
          <div className="bg-gray-300 rounded w-36 h-10 animate-pulse" />
        </div>
        <ReportTableSkeleton />
      </>
    );
  }
  if (viewScreen === 'dataAbsent') {
    return (
      <>
        <div className="flex justify-between py-0 px-6 items-center border-b border-gray-300 font-semibold text-xl text-gray-800 data-source-container">
          <div>
            <div>{t('dataSource.dataSource_list_page_title')}</div>
            {/* Temporarily Disabling Sync text */}
            {/* <span className="flex gap-3">
              <p className="sync-text">Last synced 29th Oct, 4:40PM</p>
              <Image
                src={RefreshIcon}
                alt="Sync Button"
                className="cursor-pointer"
                height={20}
                width={20}
              />
            </span> */}
          </div>
          <button
            type="button"
            className="relative my-4 bg-[#0284C7] py-2 px-3 flex items-center gap-2 rounded text-base text-white shadow hover:shadow-none"
            onClick={() => setCreateDataSourceModal(true)}
          >
            <Image src={generateReportIcon} alt="" />
            {t('dataSource.generate_dataSource')}
          </button>
        </div>
        <div className="text-center w-full mx-auto pt-16">
          <h1 className="font-medium text-2xl leading-6 text-gray-800 mb-4">
            {t('data_sources.data_absent')}
          </h1>
        </div>
        {createDataSourceModal && (
          <CreateModal setCreateDataSourceModal={setCreateDataSourceModal} />
        )}
      </>
    );
  }
  if (viewScreen === 'responseError') {
    return (
      <>
        <div className="flex justify-between py-0 px-6 items-center border-b border-gray-300 font-semibold text-xl text-gray-800 data-source-container">
          <div>
            <div>{t('dataSource.dataSource_list_page_title')}</div>
          </div>
          <button
            type="button"
            className="relative my-4 bg-[#0284C7] py-2 px-3 flex items-center gap-2 rounded text-base text-white shadow hover:shadow-none"
            onClick={() => setCreateDataSourceModal(true)}
          >
            <Image src={generateReportIcon} alt="" />
            {t('dataSource.generate_dataSource')}
          </button>
        </div>
        <div className="text-center w-[512px] mx-auto pt-16">
          <h1 className="font-medium text-2xl leading-6 text-gray-800 mb-4">
            {responseErrorMsg}
          </h1>
        </div>
        {createDataSourceModal && (
          <CreateModal setCreateDataSourceModal={setCreateDataSourceModal} />
        )}
      </>
    );
  }
  return (
    <>
      <div className="flex justify-between py-0 px-6 items-center border-b border-gray-300 font-semibold text-xl text-gray-800">
        <div>
          <div>{t('dataSource.dataSource_list_page_title')}</div>
        </div>
        <button
          type="button"
          className="relative my-4 bg-[#0284C7] py-2 px-3 flex items-center gap-2 rounded text-base text-white shadow hover:shadow-none"
          onClick={() => setCreateDataSourceModal(true)}
        >
          <Image src={generateReportIcon} alt="" />
          {t('dataSource.generate_dataSource')}
        </button>
      </div>
      <DataSourceTable data={data} />
      {createDataSourceModal && (
        <CreateModal setCreateDataSourceModal={setCreateDataSourceModal} />
      )}
    </>
  );
};

export default DataSourcePage;

DataSourcePage.getLayout = function getLayout(page: ReactElement) {
  return (
    <UserLayout>
      <PageContainer>{page}</PageContainer>
    </UserLayout>
  );
};
