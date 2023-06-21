import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  Fragment,
} from 'react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Image from 'next/image';
import downloadReportIcon from '../../public/icons/download-report.svg';
import loaderIcon from '../../public/icons/loader.svg';
import { Document, Page, pdfjs } from 'react-pdf';
import useRequestUtilities from '../hooks/use-request-utilities';
import ReportFooter from './report-footer';
import { ReportDetail } from './models/report-details';
import BubbleLoader from '../loading/bubble-loader';
import DisplayPdfError from './common/display-pdf-error';
import { ReportWorkflowStep } from './models/new-report-workflow-step';
import { useTranslation } from 'react-i18next';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export default function ReportPdf(props: {
  reportWorkflowSteps: ReportWorkflowStep[];
  activeStep: number;
  setActiveStep: Dispatch<SetStateAction<number>>;
  reportId: string;
  report: ReportDetail;
  setReport: Dispatch<SetStateAction<ReportDetail>>;
}) {
  const [numPages, setNumPages] = useState(null);
  const [reportUrl, setreportUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const { fetchWrapper } = useRequestUtilities();
  const { t } = useTranslation();
  const router = useRouter();
  const reportId =
    typeof router?.query?.newReportId === 'string'
      ? router.query.newReportId
      : router.query?.newReportId?.at(0);

  async function generatePdf() {
    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.ok) {
        setreportUrl(resJson.url);
        console.log(response, 'url');
      } else {
        setErrorMessage(t('error.something_went_wrong'));
      }
    }
    function handleError(_error: any) {
      setErrorMessage(t('error.something_went_wrong'));
    }
    fetchWrapper({
      method: 'GET',
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/reports/${props.report?.id}/download-url`,
      includeAuthToken: true,
      handleResponse,
      handleError,
    });
  }

  const handleSubmit = async () => {
    if (isDownloading) return;
    downloadThroughBlob(reportUrl);
    router.push('/reports');
  };
  useEffect(() => {
    generatePdf();
  }, []);

  useEffect(() => {
    reportId && generatePdf();
  }, [reportId]);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  const downloadThroughBlob = useCallback(function (
    fileUrl: RequestInfo | URL,
  ) {
    function initiate() {
      setIsDownloading(true);
    }
    async function handleResponse(response: Response) {
      if (response.ok) {
        const resBlob = await response.blob();
        const blobUrl = window.URL.createObjectURL(new Blob([resBlob]));
        const downloadButton = document.createElement('a');
        downloadButton.href = blobUrl;
        downloadButton.download = 'generate-report' + '.pdf';
        downloadButton.click();
      } else {
        setErrorMessage(t('error.something_went_wrong'));
      }
    }
    function handleError(_error: any) {
      setErrorMessage(t('error.something_went_wrong'));
    }
    function handleFinally() {
      setIsDownloading(false);
    }

    fetchWrapper({
      url: fileUrl,
      includeAuthToken: false,
      initiate,
      handleResponse,
      handleError,
      handleFinally,
    });
  },
  []);
  return (
    <>
      <div className="flex h-[calc(100vh_-_12.8rem)]">
        <div className="flex justify-center w-full h-[calc(100vh_-_12.8rem)] overflow-y-auto">
          {errorMessage && (
            <p className="text-red-500 text-2xl">{errorMessage}</p>
          )}
          {reportUrl && (
            <Document
              file={{
                url: reportUrl,
              }}
              loading={BubbleLoader}
              className={`w-full h-full flex ${
                numPages ? 'flex-col items-center' : 'justify-center'
              }`}
              error={() => <DisplayPdfError isPage={false} />}
              onLoadSuccess={onDocumentLoadSuccess}
            >
              {numPages
                ? [...Array(numPages)].map((_, i) => (
                    <Fragment key={'Page' + i}>
                      <Page
                        scale={1.5}
                        pageNumber={i + 1}
                        loading={''}
                        error={() => <DisplayPdfError isPage={true} />}
                        className="border border-gray-300"
                      />
                      <br />
                    </Fragment>
                  ))
                : ''}
            </Document>
          )}
        </div>
      </div>

      <ReportFooter
        reportWorkflowSteps={props.reportWorkflowSteps}
        handleSubmit={handleSubmit}
        isLoading={isDownloading}
        activeStep={props.activeStep}
      />
    </>
  );
}
