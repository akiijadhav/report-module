import { Dialog } from '@headlessui/react';
import React, { Dispatch, SetStateAction, useCallback, useState } from 'react';
import Image from 'next/image';
import crossIcon from '../../public/icons/cross-icon.svg';
import { ReportType } from './table/types';
import useRequestUtilities from '../hooks/use-request-utilities';
import { useTranslation } from 'react-i18next';

const notoSansFont = 'noto-sans';

export default function DeleteReportModal(props: {
  reportData: ReportType;
  show: boolean;
  setShow: Dispatch<SetStateAction<boolean>>;
}) {
  const { reportData, show, setShow } = props;
  const { fetchWrapper, nextJsRouter: router } = useRequestUtilities();
  const [isDeletingReport, setIsDeletingReport] = useState(false);
  const [responseError, setResponseError] = useState('');
  const { t } = useTranslation();

  const deleteReport = useCallback(
    function () {
      function initiate() {
        setIsDeletingReport(true);
      }
      function handleFinally() {
        setIsDeletingReport(false);
      }
      async function handleResponse(response: Response) {
        if (response.ok) {
          const randomRefetchToggle = String(Math.random()).slice(0, 5);
          setShow(false);
          router.replace(
            `/old-reports?refetch=${randomRefetchToggle}`,
            '/old-reports',
          );
        } else {
          const resJson = await response.json();
          setResponseError(
            resJson.message ||
              `Error ${response.status}: ${response.statusText}`,
          );
        }
      }
      function handleError(error: any) {
        setResponseError(String(t('error.something_went_wrong')));
      }

      fetchWrapper({
        url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/${reportData.Id}`,
        method: 'DELETE',
        includeAuthToken: true,
        initiate,
        handleResponse,
        handleError,
        handleFinally,
      });
    },
    [reportData],
  );

  return (
    <Dialog
      open={show}
      onClose={() => setShow(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-gray-600/40" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className={`${notoSansFont} mx-auto w-[100%] max-w-xl bg-white rounded-lg shadow-md`}
        >
          <div className="custom-modal-header">
            <Dialog.Title>Delete Report</Dialog.Title>
            <div className="close-icon-wrapper" onClick={() => setShow(false)}>
              <Image src={crossIcon} alt="Close delete report modal" />
            </div>
          </div>
          <div className="custom-modal-content">
            <p>
              {t('error.are_you_sure_delete')}{' '}
              <span className="font-semibold">{reportData.Name}</span> from the
              portal?
            </p>
            {responseError && (
              <p className="response-error-content">{responseError}</p>
            )}
          </div>
          <div className="custom-modal-footer">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => setShow(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={deleteReport}
              disabled={isDeletingReport}
              className={`red-btn ${
                isDeletingReport ? 'disabled-red-btn' : ''
              }`}
            >
              Delete
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
