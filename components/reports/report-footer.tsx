import { useState } from 'react';
import ConfirmationModal from './confirmation-modal';
import { ReportWorkflowStep } from './models/report-workflow-step';
import { useTranslation } from 'react-i18next';

export default function ReportFooter({
  reportWorkflowSteps,
  handleSubmit,
  isLoading,
  activeStep,
  handlePrevious,
}: {
  reportWorkflowSteps: ReportWorkflowStep[];
  handleSubmit: () => void | Promise<void>;
  isLoading: boolean;
  activeStep: number;
  handlePrevious?: () => void | Promise<void>;
}) {
  const [confirmationModal, setConfirmationModal] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      {confirmationModal && (
        <ConfirmationModal setConfirmationModal={setConfirmationModal} />
      )}
      <div
        id="edit-report-footer"
        className="w-full sticky bottom-0 flex flex-row justify-between z-10 border-t bg-white border-gray-300 "
      >
        <button
          type="button"
          className="flex flex-row items-center justify-center font-semibold text-base rounded w-auto p-2 h-10 border my-4 ml-7 hover:bg-gray-100"
          onClick={() => setConfirmationModal(true)}
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
            className={`flex flex-row items-center justify-center font-semibold rounded text-base mr-7 w-auto shadow-md hover:shadow-none h-10 mt-4 p-3 text-white mb-4 ${
              isLoading
                ? 'cursor-not-allowed pointer-events-none bg-blue-disabled'
                : 'bg-blue-600 hover:bg-blue-800'
            }`}
            onClick={() => {
              handleSubmit();
            }}
          >
            {activeStep === reportWorkflowSteps.length - 1
              ? `${t('report_edit.done')}`
              : activeStep === reportWorkflowSteps.length - 2
              ? `${t('report_edit.generate_report')}`
              : `${t('report_edit.next')}`}
          </button>
        </div>
      </div>
    </>
  );
}
