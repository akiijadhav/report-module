import { Dialog } from '@headlessui/react';
import React, { Dispatch, SetStateAction, useCallback, useState } from 'react';
import Image from 'next/image';
import crossIcon from '../../public/icons/cross-icon.svg';
import { DataSourceModel } from './models/data-source';
import useRequestUtilities from '../hooks/use-request-utilities';
import { TFunction } from 'i18next';

const notoSansFont = 'noto-sans';

export default function DeleteDataSourceModal(props: {
  dataSource: DataSourceModel;
  show: boolean;
  setShow: Dispatch<SetStateAction<boolean>>;
  translator?: TFunction<'translation', undefined, 'translation'>;
}) {
  const { dataSource, show, setShow, translator: t } = props;
  const { fetchWrapper, nextJsRouter: router } = useRequestUtilities();
  const [isDeletingDataSource, setIsDeletingDataSource] = useState(false);
  const [responseError, setResponseError] = useState('');

  const deleteDataSource = useCallback(
    function () {
      function initiate() {
        setIsDeletingDataSource(true);
      }
      function handleFinally() {
        setIsDeletingDataSource(false);
      }
      async function handleResponse(response: Response) {
        if (response.ok) {
          const randomRefetchToggle = String(Math.random()).slice(0, 5);
          setShow(false);
          router.replace(
            `/data-sources?refetch=${randomRefetchToggle}`,
            '/data-sources',
          );
        } else {
          const resJson = await response.json();
          setResponseError(
            resJson?.error ||
              resJson?.message ||
              `Error ${response.status}: ${response.statusText}`,
          );
        }
      }
      function handleError(error: any) {
        setResponseError(String(t('error.something_went_wrong')));
      }

      fetchWrapper({
        url: `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/datasources/${dataSource.id}`,
        method: 'DELETE',
        includeAuthToken: true,
        initiate,
        handleResponse,
        handleError,
        handleFinally,
      });
    },
    [dataSource],
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
            <Dialog.Title>Delete Data Source</Dialog.Title>
            <div className="close-icon-wrapper" onClick={() => setShow(false)}>
              <Image src={crossIcon} alt="Close delete data source modal" />
            </div>
          </div>
          <div className="custom-modal-content">
            <p>
              Are you sure you want to delete{' '}
              <span className="font-semibold">{dataSource.name}</span> from the
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
              {t('data_sources.cancel')}
            </button>
            <button
              type="button"
              onClick={deleteDataSource}
              disabled={isDeletingDataSource}
              className={`red-btn ${
                isDeletingDataSource ? 'disabled-red-btn' : ''
              }`}
            >
              {t('data_sources.delete')}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
