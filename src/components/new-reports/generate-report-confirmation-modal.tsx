import { Dispatch, SetStateAction, useState, useTransition } from 'react';
import Modal from '../ui/modal';
import { useFormik } from 'formik';
import axios from 'axios';
import { useRouter } from 'next/router';
import useRequestUtilities from '../hooks/use-request-utilities';
import crossIcon from '../../public/icons/cross-icon.svg';
import Image from 'next/image';
import { ReportDetail } from './models/report-details';
import { useTranslation } from 'react-i18next';

export default function GenerateConfirmationReportModal({
  setGenerateReportModal,
  setActiveStep,
  report,
}: {
  setGenerateReportModal: Dispatch<SetStateAction<boolean>>;
  setActiveStep: Dispatch<SetStateAction<number>>;
  report: ReportDetail;
}) {
  const { fetchWrapper } = useRequestUtilities();
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(true);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const validationHandler = ({ reportName }: { reportName: string }) => {
    const errors: { reportName?: string } = {};
    if (reportName === '') {
      errors.reportName = t('error.enter_report_name');
    }
  };

  const generatePdf = async () => {
    const requestPayload: {
      language: string;
      accuracyImOutput2chMarkerLabels?: string[];
    } = {
      language: router.locale,
    };
    // if (selected2ChMarkers.length > 0) {
    //   requestPayload.accuracyImOutput2chMarkerLabels = selected2ChMarkers;
    // }
    function initiate() {
      setIsLoadingPdf(true);
    }
    async function handleResponse(response: Response) {
      if (response.ok) {
        setActiveStep((activeStep) => activeStep + 1);
      } else {
        if (response.status === 500) {
          setErrorMessage(t('error.something_went_wrong'));
        } else {
          const resJson = await response.json();
          const errorMsg = t('error.something_went_wrong');
          //   setErrorMessage(errorMsg);
          setErrorMessage(t('error.something_went_wrong'));
        }
      }
    }
    function handleError(_error: any) {
      setErrorMessage(t('error.something_went_wrong'));
    }
    function handleFinally() {
      setIsLoadingPdf(false);
    }
    fetchWrapper({
      method: 'POST',
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/reports/${report?.id}/file`,
      includeAuthToken: true,

      handleResponse,
      body: requestPayload,
      handleError,
      initiate,
      handleFinally,
    });
  };
  const submitHandler = async (values) => {
    generatePdf();
  };

  return (
    <Modal open={open} setOpen={setOpen}>
      <>
        <div className="flex flex-col ">
          <div className="flex flex row justify-between">
            <p className="font-semibold text-xl text-gray-800">
              {t('report_pdf.generate_report')}
            </p>
            <div
              className="close-icon-wrapper"
              onClick={() => setGenerateReportModal(false)}
            >
              <Image src={crossIcon} alt="Close delete report modal" />
            </div>
          </div>

          <div className="border-y border-gray-300 py-8">
            <div className="group">
              <p>{t('report_pdf.report_generate_msg')}</p>
            </div>
          </div>

          <div className="flex items-center">
            {errorMessage && (
              <p className="text-red-600 mt-4 mr-1">{errorMessage}</p>
            )}
            <div className="ml-auto flex">
              <button
                type="button"
                className="h-10 w-20 mt-6 rounded border border-gray-300 hover:bg-gray-100 font-semibold text-base text-gray-800"
                onClick={() => setGenerateReportModal(false)}
              >
                {t('report_pdf.cancel')}
              </button>
              <button
                type="submit"
                className={`h-10 w-20 mt-6 rounded border border-gray-300 ml-8 bg-[#0284C7] hover:bg-[#0270a8] font-semibold text-base text-white ${
                  isLoadingPdf
                    ? 'cursor-not-allowed pointer-events-none opacity-50'
                    : 'opacity-100'
                }`}
                onClick={submitHandler}
              >
                {t('report_pdf.confirm')}
              </button>
            </div>
          </div>
        </div>
      </>
    </Modal>
  );
}
