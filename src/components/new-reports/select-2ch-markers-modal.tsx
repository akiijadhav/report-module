import { Dialog, Listbox } from '@headlessui/react';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import Image from 'next/image';
import crossIcon from '../../public/icons/cross-icon.svg';
import { TFunction } from 'i18next';
import useRequestUtilities from '../hooks/use-request-utilities';

const notoSansFont = 'noto-sans';

export default function Select2CHMarkersModal(props: {
  show: boolean;
  setShow: Dispatch<SetStateAction<boolean>>;
  duplicateMarkers: string[];
  selected2ChMarkers: string[];
  setSelected2ChMarkers: Dispatch<SetStateAction<string[]>>;
  translator: TFunction<'translation', undefined, 'translation'>;
  setActiveStep: Dispatch<SetStateAction<number>>;
  reportID: string;
}) {
  const {
    show,
    setShow,
    duplicateMarkers,
    selected2ChMarkers,
    setSelected2ChMarkers,
    translator: t,
    setActiveStep,
    reportID,
  } = props;

  const { fetchWrapper, nextJsRouter: router } = useRequestUtilities();
  const [loading, setLoading] = useState(false);
  const [responseError, setResponseError] = useState('');

  const generatePDF = useCallback(
    function () {
      const requestPayload: {
        language: string;
        accuracyImOutput2chMarkerLabels?: string[];
      } = {
        language: router.locale,
      };
      if (selected2ChMarkers.length > 0) {
        requestPayload.accuracyImOutput2chMarkerLabels = selected2ChMarkers;
      }

      function initiate() {
        setLoading(true);
        setResponseError('');
      }
      async function handleResponse(response: Response) {
        if (response.ok) {
          setActiveStep((activeStep) => activeStep + 1);
          setShow(false);
        } else {
          if (response.status === 500) {
            setResponseError(t('error.something_went_wrong'));
          } else {
            const errorMsg = `Error ${response.status}: ${t(
              'error.something_went_wrong',
            )}`;
            setResponseError(errorMsg);
          }
          setLoading(false);
        }
      }
      function handleError(_error: any) {
        setResponseError(t('error.something_went_wrong'));
        setLoading(false);
      }
      fetchWrapper({
        url: `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/reports/${reportID}/file`,
        method: 'POST',
        body: requestPayload,
        includeAuthToken: true,
        initiate,
        handleResponse,
        handleError,
      });
    },
    [
      router.locale,
      selected2ChMarkers,
      setLoading,
      setResponseError,
      setActiveStep,
      setShow,
      fetchWrapper,
      reportID,
    ],
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
          className={`${notoSansFont} mx-auto w-[100%] max-w-[35rem] bg-white rounded-lg shadow-md marker-2ch-modal`}
        >
          <div className="custom-modal-header">
            {t('select_markers_modal.accuracy_select_markers')}
            <div className="close-icon-wrapper" onClick={() => setShow(false)}>
              <Image src={crossIcon} alt="Close select markers modal" />
            </div>
          </div>
          <div className="custom-modal-content">
            <div className="flex flex-col w-full gap-4 rounded">
              <Listbox
                name="twoChValues"
                value={selected2ChMarkers}
                onChange={setSelected2ChMarkers}
                multiple
              >
                <Listbox.Options
                  static
                  className="max-h-56 rounded overflow-y-auto border border-gray-300 text-sm"
                >
                  {duplicateMarkers?.map((marker, index, array) => (
                    <Listbox.Option
                      key={marker}
                      className={`px-3 py-2 cursor-pointer flex items-center gap-4 hover:bg-gray-100 ${
                        index === array.length - 1
                          ? ''
                          : 'border-b border-gray-200'
                      }`}
                      value={marker}
                    >
                      <input
                        type="checkbox"
                        checked={selected2ChMarkers.includes(marker)}
                        className="w-[18px] h-[18px]"
                        readOnly
                      />
                      {marker}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Listbox>
            </div>
            {!!responseError && (
              <p className="response-error-content">{responseError}</p>
            )}
          </div>
          <div className="custom-modal-footer">
            <button
              type="button"
              className="flex flex-row items-center justify-center font-normal rounded px-2 text-base h-10 border hover:bg-gray-100"
              onClick={() => setShow(false)}
            >
              {t('report_edit.cancel')}
            </button>
            <button
              type="button"
              disabled={loading}
              className={`flex flex-row items-center justify-center font-semibold rounded text-base w-auto h-10 p-3 ${
                loading
                  ? 'text-gray-400 bg-light-blue-100 pointer-events-none'
                  : 'text-white bg-light-blue-600 hover:bg-blue-600 shadow-md hover:shadow-none'
              }`}
              onClick={() => generatePDF()}
            >
              {t(
                loading
                  ? 'report_edit.generating_report'
                  : 'report_edit.generate_report',
              )}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
