import { Dialog } from '@headlessui/react';
import { Dispatch, SetStateAction, useCallback } from 'react';
import Image from 'next/image';
import crossIcon from '../../public/icons/cross-icon.svg';
import { TFunction } from 'i18next';

const notoSansFont = 'noto-sans';

export default function MarkerUnavailableModal(props: {
  show: boolean;
  setShow: Dispatch<
    SetStateAction<{
      id: string;
      markers: any[];
    }>
  >;
  markers: string[];
  translate: TFunction<'translation', undefined, 'translation'>;
}) {
  const { show, setShow, markers, translate: t } = props;

  const closeModal = useCallback(
    function () {
      setShow({ id: '', markers: [] });
    },
    [setShow],
  );

  return (
    <Dialog open={show} onClose={closeModal} className="relative z-50">
      <div className="fixed inset-0 bg-gray-600/40" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className={`${notoSansFont} mx-auto w-[100%] max-w-xl bg-white rounded-lg shadow-md marker-unavailable-popup`}
        >
          <div className="custom-modal-header">
            <Dialog.Title>
              {t('data_source_mapping.markers_not_exist')}
            </Dialog.Title>
            <div className="close-icon-wrapper" onClick={closeModal}>
              <Image src={crossIcon} alt="Close popup" />
            </div>
          </div>
          <div className="custom-modal-content">
            <span className="flex flex-col gap-1">
              <span>{t('data_source_mapping.missing_markers_csv')}</span>
              <span className="flex flex-col items-start rounded-sm max-h-32 overflow-y-auto text-gray-800 border border-gray-300">
                {markers?.map((acnCode) => {
                  return (
                    <span
                      key={acnCode + '-unavailable'}
                      className="w-full px-2 py-1 border-b border-gray-200"
                    >
                      {acnCode}
                    </span>
                  );
                })}
              </span>
            </span>
          </div>
          <div className="custom-modal-footer">
            <button type="button" onClick={closeModal} className="blue-btn">
              {t('data_source_mapping.okay')}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
