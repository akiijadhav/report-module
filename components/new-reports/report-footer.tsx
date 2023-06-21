import { useTranslation } from 'react-i18next';
import { ReportWorkflowStep } from './models/new-report-workflow-step';
import { useRouter } from 'next/router';
import Image from 'next/image';
import pdfDownload from '../../public/icons/pdfDownload.svg';
import { ReportDetail } from './models/report-details';
import React, { useState } from 'react';
import NewDeleteReportModal from './new-delete-report-modal';

export default function ReportFooter({
  reportWorkflowSteps,
  handleSubmit,
  isLoading,
  activeStep,
  handlePrevious,
  report,
}: {
  reportWorkflowSteps: ReportWorkflowStep[];
  handleSubmit: () => void | Promise<void>;
  isLoading: boolean;
  activeStep: number;
  handlePrevious?: () => void | Promise<void>;
  report?: ReportDetail;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <>
      <div
        id="edit-report-footer"
        className="w-full sticky bottom-0 flex flex-row justify-between z-10 border-t bg-white border-gray-300 "
      >
        <button
          type="button"
          className="flex flex-row items-center justify-center font-semibold text-base rounded w-auto p-2 h-10 border my-4 ml-7 hover:bg-gray-100"
          onClick={() => {
            if (report?.id) {
              setShowDeleteModal(true);
            } else {
              router.push('/reports');
            }
          }}
        >
          {t('report_edit.cancel')}
        </button>

        <div className="flex flex-row">
          {activeStep > 0 && activeStep < reportWorkflowSteps.length - 1 && (
            <button
              type="button"
              onClick={() => {
                if (handlePrevious) {
                  handlePrevious();
                }
              }}
              className="flex flex-row items-center justify-center font-semibold rounded px-2 text-base mr-7 h-10 mt-4 border mb-4 hover:bg-gray-100"
            >
              {t('report_edit.previous')}
            </button>
          )}
          <button
            disabled={isLoading}
            type="submit"
            className={`flex flex-row items-center justify-center font-semibold rounded text-base mr-7 w-auto shadow-md hover:shadow-none h-10 mt-4 p-3 text-white mb-4 ${
              isLoading
                ? 'cursor-not-allowed pointer-events-none bg-blue-disabled'
                : 'bg-blue-600 hover:bg-blue-800'
            }`}
            onClick={() => {
              handleSubmit();
            }}
          >
            {activeStep === reportWorkflowSteps.length - 1 ? (
              <div className="flex flex-row justify-between">
                <Image src={pdfDownload} alt="" height={15} width={15} />{' '}
                <p className="ml-1">{t('report_edit.download_report')}</p>
              </div>
            ) : (
              `${t('report_edit.next')}`
            )}
          </button>
        </div>
      </div>
      {showDeleteModal && (
        <NewDeleteReportModal
          reportData={report}
          setShow={setShowDeleteModal}
          show={showDeleteModal}
          incomplete={true}
        />
      )}
    </>
  );
}
