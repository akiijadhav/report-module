import { Dialog } from '@headlessui/react';
import crossIcon from '../../public/icons/cross-icon.svg';
import Image from 'next/image';
import React, { Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/router';
const notoSansFont = 'noto-sans';

export default function ConfirmationModal(props: {
  setConfirmationModal: Dispatch<SetStateAction<boolean>>;
}) {
  const router = useRouter();
  return (
    <Dialog open={true} onClose={() => null} className="relative z-50">
      <div className="fixed inset-0 bg-gray-600/40" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className={`${notoSansFont} mx-auto w-[100%] max-w-xl bg-white rounded-lg shadow-md`}
        >
          <div
            id="deactivate-modal-header"
            className="px-6 py-4 flex items-center justify-between font-semibold text-xl text-gray-800 border-b border-gray-300"
          >
            <Dialog.Title>Unsaved changes</Dialog.Title>
            <div
              className="w-10 h-10 flex items-center justify-center cursor-pointer rounded hover:bg-gray-100"
              onClick={() => {
                props.setConfirmationModal(false);
              }}
            >
              <Image src={crossIcon} alt="Close edit profile form" />
            </div>
          </div>
          <div
            id="deactivate-modal-content"
            className="p-6 flex flex-col items-start gap-8 font-normal text-base leading-7 text-gray-600"
          >
            You have unsaved changes in your report, the data will be lost if
            you leave without saving. Kindly click on ‘Save as draft’ to
            continue the progress later.
          </div>
          <div
            id="deactivate-modal-footer"
            className="py-4 px-6 flex items-center justify-end gap-4 font-semibold text-base text-gray-800 border-t border-gray-300"
          >
            <button
              type="button"
              className="py-2 px-3 rounded border border-gray-300 cancel-btn hover:bg-gray-100"
              onClick={() => router.push('/old-reports')}
            >
              Discard
            </button>
            <button
              type="button"
              className={`py-2 px-3 rounded text-white deactivate-btn bg-blue-600 hover:bg-blue-800`}
              onClick={() => router.push('/old-reports')}
            >
              Save as draft
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
