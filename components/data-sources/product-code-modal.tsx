import { Dialog } from '@headlessui/react';
import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Image from 'next/image';
import crossIcon from '../../public/icons/cross-icon.svg';
import blueCheckmark from '../../public/icons/blue-checkmark.svg';
import useRequestUtilities from '../hooks/use-request-utilities';
import moment from 'moment';
import { unifiedProductCodeDetails } from './models/productCodeDetails';
import { DataReducerAction } from './models/dataset-records-detail';
import { ProductDetail } from './models/product-detail';
import { useTranslation } from 'react-i18next';
const notoSansFont = 'noto-sans';

export default function ProductCodeModal(props: {
  details: unifiedProductCodeDetails;
  dispatch: Dispatch<DataReducerAction>;
  datasetId: string;
  setUnifiedProductCodeObj: Dispatch<SetStateAction<unifiedProductCodeDetails>>;
}) {
  const { fetchWrapper } = useRequestUtilities();
  const [responseError, setResponseError] = useState('');
  const [productInfo, setProductInfo] = useState<ProductDetail>();
  const [loading, setLoading] = useState(true);
  const [isCodeValid, setIsCodeValid] = useState(true);
  const [touched, setTouched] = useState(false);
  const [selectedLotID, setSelectedLotID] = useState('');
  const { t } = useTranslation();

  function getPickListData() {
    function initiate() {
      setLoading(true);
      setProductInfo(null);
      setIsCodeValid(true);
      setTouched(false);
      setSelectedLotID('');
      setResponseError('');
    }
    async function handleResponse(response: Response) {
      const resJson = await response.json();

      if (response.ok) {
        setProductInfo({
          ...resJson,
          productLots:
            resJson?.productLots?.map((lotItem) => ({
              ...lotItem,
              id: crypto.randomUUID(),
            })) || [],
        });
        setResponseError('');
      } else {
        if (response.status === 404) {
          setIsCodeValid(false);
        }
        setResponseError(t('error.something_went_wrong'));
      }
    }
    function handleError(_error: any) {
      setResponseError(t('error.something_went_wrong'));
    }
    function handleFinally() {
      setLoading(false);
    }

    fetchWrapper({
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL_V2}/product-lots?productCode=${props.details.productCode}`,
      includeAuthToken: true,
      initiate,
      handleResponse,
      handleError,
      handleFinally,
    });
  }

  useEffect(() => {
    if (!props.details.productCode) return;
    getPickListData();
  }, [props.details.productCode]);

  const productLots = useMemo(
    () => productInfo?.productLots || [],
    [productInfo],
  );

  const selectedLot = useMemo(
    () => productLots?.find((lotItem) => lotItem?.id === selectedLotID) || null,
    [productLots, selectedLotID],
  );

  const closePopup = useCallback(
    function () {
      props.setUnifiedProductCodeObj({
        recordId: '',
        productCode: '',
        groupName: '',
        dependentAttributes: [],
        open: false,
      });
    },
    [props.setUnifiedProductCodeObj],
  );

  const handleSelect = useCallback(
    function () {
      setTouched(true);
      if (isCodeValid) {
        if (!selectedLotID) return;

        props.details.dependentAttributes.forEach((attribute) => {
          let setValue = '';
          if (attribute.toLowerCase().includes('lot')) {
            setValue = selectedLot.lotNo;
          } else if (attribute.toLowerCase().includes('date')) {
            setValue = selectedLot.expiryDate;
          } else {
            setValue = productInfo?.product?.name || '';
          }
          props.dispatch({
            type: 'UPDATE',
            groupName: props.details.groupName,
            markerRecordId: props.details.recordId,
            columnId: `${props.details.groupName}.${attribute}`,
            value: setValue,
          });
        });
      }
      closePopup();
    },
    [
      setTouched,
      isCodeValid,
      selectedLotID,
      props.details,
      selectedLot,
      productInfo,
      props.dispatch,
      closePopup,
    ],
  );

  return (
    <Dialog
      open={props.details.open}
      onClose={() => closePopup()}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-gray-600/40" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className={`${notoSansFont} mx-auto w-[100%] max-w-xl bg-white rounded-lg shadow-md product-code-popup`}
        >
          <div className="custom-modal-header">
            <Dialog.Title>
              {isCodeValid
                ? t('error.please_select_entry')
                : t('error.invalid')}
            </Dialog.Title>
            <div className="close-icon-wrapper" onClick={() => closePopup()}>
              <Image src={crossIcon} alt="Close delete data source modal" />
            </div>
          </div>
          {loading ? (
            <>
              <div className="custom-modal-content animate-pulse">
                <span className="rounded bg-gray-100 h-6 w-[30rem]" />
                <span className="rounded bg-gray-100 h-[5.1rem] w-[30rem]" />
              </div>
            </>
          ) : (
            <>
              {isCodeValid ? (
                <div className="custom-modal-content">
                  <span>
                    <p>
                      Unified Product code -
                      <span className="font-semibold">
                        {' '}
                        {props.details.productCode}
                      </span>{' '}
                    </p>
                    <p>
                      Product Name -{' '}
                      <span className="font-semibold">
                        {productInfo?.product?.name || ''}
                      </span>
                    </p>
                    <span>
                      {t('error.please_select_lot_no_and_product_code')}
                    </span>
                  </span>
                  <div className="w-full max-h-[15rem] overflow-y-auto">
                    <table className="w-full border border-gray-200 text-left">
                      <thead className="border-b border-gray-300">
                        <tr className="bg-gray-100 text-gray-400 font-medium leading-[22px]">
                          <th className="py-3 px-4 w-1/2">Lot No.</th>
                          <th className="py-3 px-4">Expiry Date</th>
                          <th className="py-3 px-4"></th>
                        </tr>
                      </thead>
                      <tbody className="break-all leading-[22px] text-gray-800">
                        {productLots.map((lotItem) => {
                          const selected = selectedLotID === lotItem.id;
                          return (
                            <tr
                              key={lotItem.id}
                              onClick={() =>
                                setSelectedLotID((selectedLotID) =>
                                  selectedLotID === lotItem.id
                                    ? ''
                                    : lotItem.id,
                                )
                              }
                              className={`cursor-pointer ${
                                selected
                                  ? 'bg-light-blue-50'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <td className="py-2 px-4">{lotItem.lotNo}</td>
                              <td className="py-2 px-4">
                                {moment(lotItem.expiryDate).format(
                                  'YYYY-MM-DD',
                                )}
                              </td>
                              <td className="py-2 px-4">
                                {selected ? (
                                  <Image
                                    src={blueCheckmark}
                                    alt="Selected lot number checkmark"
                                  />
                                ) : (
                                  ''
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {responseError && (
                    <p className="response-error-content">{responseError}</p>
                  )}

                  {touched && !selectedLotID && (
                    <p className="response-error-content">
                      Please select a Lot No.
                    </p>
                  )}
                </div>
              ) : (
                <div className="custom-modal-content">
                  Please enter the valid Unified Product Code.
                </div>
              )}
            </>
          )}
          <div className="custom-modal-footer">
            {loading ? (
              <span className="rounded bg-gray-100 w-16 h-[2.4rem] animate-pulse" />
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSelect()}
                className="blue-btn"
              >
                {isCodeValid ? 'Select' : t('data_source_mapping.okay')}
              </button>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
