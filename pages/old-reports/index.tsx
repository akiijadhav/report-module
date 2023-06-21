import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import useRequestUtilities from '../../components/hooks/use-request-utilities';
import UserLayout from '../../components/layouts/user-layout';
import { ReportType } from '../../components/reports/table/types';
import PageContainer from '../../components/users/page-container';
import { NextPageWithLayout } from '../_app';
import ReportTable from '../../components/reports/table/report-table';
import ReportTableSkeleton from '../../components/loading/report-table-skeleton';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import generateReportIcon from '../../public/icons/generate-report-icon.svg';
import GenerateReportModal from '../../components/reports/generate-report-modal';

const ReportPage: NextPageWithLayout = function () {
  const {
    fetchWrapper,
    logoutUser,
    nextJsRouter: router,
  } = useRequestUtilities();
  const refetchUsers =
    typeof router.query.refetch === 'string'
      ? router.query.refetch
      : router.query?.refetch?.at(0);
  type viewScreenType =
    | 'loading'
    | 'reportsAbsent'
    | 'reportsPresent'
    | 'responseError';
  const [viewScreen, setViewScreen] = useState<viewScreenType>('loading');
  const [isFetchingReports, setIsFetchingReports] = useState(false);
  const [responseErrorMsg, setResponseErrorMsg] = useState('');
  const [data, setData] = useState<ReportType[]>([]);
  const [totalReports, setTotalReports] = useState(0);
  const [nextPageURL, setNextPageURL] = useState(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports?pageNumber=1`,
  );
  const [generateReportModal, setGenerateReportModal] = useState(false);
  const { t } = useTranslation();

  const fetchReports = useCallback(
    async function (Refetch = false) {
      function initiate() {
        setIsFetchingReports(true);
      }
      async function handleResponse(response: Response) {
        const resJson = await response.json();
        if (response.ok) {
          const headerURL = response.headers.get('x-next-page-url');
          setNextPageURL(headerURL);
          const newReports: ReportType[] = resJson;
          if (newReports.length) {
            const totalReports = response.headers.get('x-total-records');
            setTotalReports(Number(totalReports));
            if (Refetch) {
              setData(newReports);
            } else {
              setData((old) => {
                const uniqueNewReports: ReportType[] = [];
                newReports.forEach((newReport) => {
                  if (
                    old.find((report) => report.Id === newReport.Id) ===
                    undefined
                  ) {
                    uniqueNewReports.push(newReport);
                  }
                });
                return [...old, ...uniqueNewReports];
              });
            }
            setViewScreen('reportsPresent');
          } else if (data.length < 1 && newReports.length < 1) {
            setViewScreen('reportsAbsent');
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
      function handleError(error: any) {
        setResponseErrorMsg(t('error.something_went_wrong'));
        setViewScreen('responseError');
      }
      function handleFinally() {
        setIsFetchingReports(false);
      }

      fetchWrapper({
        url: Refetch
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports?pageNumber=1`
          : nextPageURL,
        includeAuthToken: true,
        initiate,
        handleResponse,
        handleError,
        handleFinally,
      });
    },
    [nextPageURL],
  );

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
      fetchReports(Boolean(refetchUsers));
    }
  }, [refetchUsers]);

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
  if (viewScreen === 'reportsAbsent') {
    return (
      <>
        <div className="py-4 px-6 flex items-center justify-between border-b border-gray-300 font-semibold text-xl text-gray-800">
          {t('reports.report_list_page_title')}
          <button
            type="button"
            className="relative bg-[#0284C7] py-2 px-3 flex items-center gap-2 rounded text-base text-white shadow hover:shadow-none"
            onClick={() => setGenerateReportModal(true)}
          >
            <Image src={generateReportIcon} alt="" />
            {t('reports.generate_report')}
          </button>
        </div>
        <div className="text-center w-full mx-auto pt-16">
          <h1 className="font-medium text-2xl leading-6 text-gray-800 mb-4">
            Looks like you haven&apos;t generated any reports yet
          </h1>
        </div>
        {generateReportModal && (
          <GenerateReportModal
            setGenerateReportModal={setGenerateReportModal}
          />
        )}
      </>
    );
  }
  if (viewScreen === 'responseError') {
    return (
      <>
        <div className="py-4 px-6 flex items-center justify-between border-b border-gray-300 font-semibold text-xl text-gray-800">
          {t('reports.report_list_page_title')}
          <button
            type="button"
            className="relative bg-[#0284C7] py-2 px-3 flex items-center gap-2 rounded text-base text-white shadow hover:shadow-none"
            onClick={() => setGenerateReportModal(true)}
          >
            <Image src={generateReportIcon} alt="" />
            {t('reports.generate_report')}
          </button>
        </div>
        <div className="text-center w-[512px] mx-auto pt-16">
          <h1 className="font-medium text-2xl leading-6 text-gray-800 mb-4">
            {responseErrorMsg}
          </h1>
        </div>
        {generateReportModal && (
          <GenerateReportModal
            setGenerateReportModal={setGenerateReportModal}
          />
        )}
      </>
    );
  }
  return (
    <>
      <div className="py-4 px-6 flex items-center justify-between border-b border-gray-300 font-semibold text-xl text-gray-800">
        {t('reports.report_list_page_title')}
        <button
          type="button"
          className="relative bg-[#0284C7] py-2 px-3 flex items-center gap-2 rounded text-base text-white shadow hover:shadow-none"
          onClick={() => setGenerateReportModal(true)}
        >
          <Image src={generateReportIcon} alt="" />
          {t('reports.generate_report')}
        </button>
      </div>
      <div className="report-table-wrapper">
        <ReportTable data={data} />
        <div className="report-table-footer">
          {totalReports > 0 && (
            <div className="number-of-reports-info">
              {`1-${data.length} of ${totalReports}`}
            </div>
          )}
          {nextPageURL?.includes('/reports') && (
            <button
              type="button"
              onClick={() => fetchReports()}
              disabled={isFetchingReports}
              className={`load-more-btn ${
                isFetchingReports ? 'load-more-btn-disabled' : ''
              }`}
            >
              {t('reports.load_more')}
            </button>
          )}
        </div>
      </div>
      {generateReportModal && (
        <GenerateReportModal setGenerateReportModal={setGenerateReportModal} />
      )}
    </>
  );
};

export default ReportPage;

ReportPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <UserLayout>
      <PageContainer>{page}</PageContainer>
    </UserLayout>
  );
};
