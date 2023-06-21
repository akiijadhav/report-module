import { Dialog } from '@headlessui/react';
import { Dispatch, SetStateAction, useMemo } from 'react';
import Image from 'next/image';
import crossIcon from '../../public/icons/cross-icon.svg';
import { LocalFileDetail } from './models/local-file-detail';
import { useTranslation } from 'react-i18next';

const notoSansFont = 'noto-sans';

export default function DeleteFileModal(props: {
  file: LocalFileDetail;
  deleteFile: (fileId: string) => void;
  show: boolean;
  setShow: Dispatch<SetStateAction<boolean>>;
}) {
  const { file, show, setShow, deleteFile } = props;

  const { t } = useTranslation();

  const isDeletingFile = useMemo(() => !!file?.isDeleting, [file]);

  const fileError = useMemo(
    () =>
      file?.error && file?.toDelete && !file?.isDeleting
        ? String(file.error)
        : '',
    [file],
  );

  return (
    <Dialog
      open={show}
      onClose={() => setShow(false)}
      className="relative z-50 delete-file-modal-wrapper"
    >
      <div className="fixed inset-0 bg-gray-600/40" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className={`${notoSansFont} mx-auto w-[100%] max-w-xl bg-white rounded-lg shadow-md`}
        >
          <div className="custom-modal-header">
            <Dialog.Title>{t('data_sources.remove_file')}</Dialog.Title>
            <div className="close-icon-wrapper" onClick={() => setShow(false)}>
              <Image src={crossIcon} alt="Close remove file modal" />
            </div>
          </div>
          <div className="custom-modal-content">
            <p>{t('data_sources.delete_file_data_source')}</p>
            <p className="text-gray-800 font-medium">
              {t('data_source_mapping.file_name')}: {file?.name || ''}
            </p>
            {fileError && <p className="response-error-content">{fileError}</p>}
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
              onClick={() => {
                if (isDeletingFile) return;
                deleteFile(file.id);
              }}
              disabled={isDeletingFile}
              className={`red-btn ${isDeletingFile ? 'disabled-red-btn' : ''}`}
            >
              {isDeletingFile
                ? t('data_source_mapping.removing')
                : t('data_source_mapping.remove')}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
