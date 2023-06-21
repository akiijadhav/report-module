import React, { useCallback, useState } from 'react';
import ConfirmationModal from './data-source-confirmation-modal';
import { useTranslation } from 'react-i18next';
import { DataSourcetWorkflowStep } from '../data-sources/models/data-source-workflow';
import { useRouter } from 'next/router';
import Notification, { responseMsgType } from '../ui/notification';

export default function DataSourceFooter({
  workflowSteps,
  handleSubmit,
  isLoading,
  activeStep,
  handlePrevious,
  handleDraft,
  readOnly,
}: {
  workflowSteps: DataSourcetWorkflowStep[];
  handleSubmit: () => void | Promise<void>;
  isLoading: boolean;
  activeStep: number;
  handlePrevious?: () => void | Promise<void>;
  handleDraft?: (
    saveDraft?: boolean,
    handleDraftSuccess?: () => void,
    handleDraftFailure?: () => void,
    initiateDraft?: () => void,
  ) => void;
  readOnly?: boolean;
}) {
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [clickedPrevious, setClickedPrevious] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();
  const [notificationMsg, setNotificationMsg] = useState<responseMsgType>({
    entityName: '',
    isError: false,
    msg: '',
  });

  const initiateDraft = useCallback(
    function () {
      setIsSavingDraft(true);
    },
    [setIsSavingDraft],
  );

  const handleDraftSuccess = useCallback(
    function () {
      setNotificationMsg({
        entityName: '',
        isError: false,
        msg: t('error.draft_save_successfully'),
      });
      if (clickedPrevious) {
        handlePrevious();
        setIsSavingDraft(false);
        setConfirmationModal(false);
      } else {
        router.push('/data-sources');
      }
    },
    [
      setNotificationMsg,
      router.push,
      clickedPrevious,
      handlePrevious,
      setIsSavingDraft,
      setConfirmationModal,
    ],
  );

  const handleDraftFailure = useCallback(
    function () {
      setNotificationMsg({
        entityName: '',
        isError: true,
        msg: t('error.something_went_wrong'),
      });
      setIsSavingDraft(false);
      setConfirmationModal(false);
    },
    [setNotificationMsg, setIsSavingDraft, setConfirmationModal],
  );

  return (
    <>
      {confirmationModal && (
        <ConfirmationModal
          setConfirmationModal={setConfirmationModal}
          handleSaveDraft={() =>
            handleDraft(
              true,
              handleDraftSuccess,
              handleDraftFailure,
              initiateDraft,
            )
          }
          clickedPrevious={clickedPrevious}
          handlePrevious={handlePrevious}
          isSavingDraft={isSavingDraft}
        />
      )}
      <div
        id="edit-data-source-footer"
        className={`w-full py-2 px-4 sticky bottom-0 flex flex-row ${
          readOnly ? 'justify-end' : 'justify-between'
        } z-10 border-t bg-white border-gray-300`}
      >
        {!readOnly && (
          <button
            type="button"
            className="py-2 px-3 font-semibold text-base rounded border hover:bg-gray-100"
            onClick={() => {
              setClickedPrevious(false);
              setConfirmationModal(true);
            }}
          >
            {t('report_edit.cancel')}
          </button>
        )}

        <div className="flex flex-row gap-4">
          {activeStep > 0 && (
            <button
              type="button"
              onClick={() => {
                if (handlePrevious) {
                  setClickedPrevious(true);
                  if (readOnly) {
                    handlePrevious();
                  } else {
                    setConfirmationModal(true);
                  }
                }
              }}
              className="py-2 px-3 font-semibold rounded text-base border hover:bg-gray-100"
            >
              {t('report_edit.previous')}
            </button>
          )}
          {readOnly && activeStep === workflowSteps.length - 1 ? (
            <button
              type="button"
              className="py-2 px-3 font-semibold text-base rounded border hover:bg-gray-100"
              onClick={() => router.push('/data-sources')}
            >
              {t('data_source_workflow.close')}
            </button>
          ) : (
            <button
              disabled={isLoading}
              className={`py-2 px-3 font-semibold rounded text-base shadow-md hover:shadow-none text-white ${
                isLoading
                  ? 'cursor-not-allowed pointer-events-none bg-blue-disabled'
                  : 'bg-light-blue-600 hover:bg-blue-600'
              }`}
              onClick={() => {
                handleSubmit();
              }}
            >
              {activeStep === workflowSteps.length - 1
                ? `${t('data_source_workflow.mark_completed')}`
                : `${t('report_edit.next')}`}
            </button>
          )}
        </div>
      </div>

      {notificationMsg?.msg && (
        <Notification
          entityUpdateMsg={notificationMsg}
          setEntityUpdateMsg={setNotificationMsg}
        />
      )}
    </>
  );
}
