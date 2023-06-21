import { Dialog } from '@headlessui/react';
import { Dispatch, SetStateAction, useState } from 'react';
import { rowInterface } from './table/types';
import Image from 'next/image';
import crossIcon from '../../public/icons/cross-icon.svg';
import useRequestUtilities from '../hooks/use-request-utilities';
import { useTranslation } from 'react-i18next';

const notoSansFont = 'noto-sans';

export default function DeactivateUserModal(props: {
  userData: rowInterface;
  show: boolean;
  setShow: Dispatch<SetStateAction<boolean>>;
  setData: Dispatch<SetStateAction<rowInterface[]>>;
}) {
  const { userData, show, setShow, setData } = props;
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [responseError, setResponseError] = useState('');
  const { fetchWrapper } = useRequestUtilities();
  const { t } = useTranslation();

  async function deactivateUser() {
    function initiate() {
      setIsSubmittingStatus(true);
    }
    async function handleResponse(response: Response) {
      if (response.ok) {
        setData((old) =>
          old.map((user) => {
            if (user.Id === userData.Id) {
              return {
                ...user,
                Status: 'Inactive',
              };
            } else {
              return user;
            }
          }),
        );
        setShow(false);
      } else {
        const resJson = await response.json();
        const errorMsg =
          typeof resJson?.message === 'string'
            ? resJson.message
            : resJson?.message?.at(0);
        setResponseError(t('error.something_went_wrong'));
      }
    }
    function handleError(error: any) {
      setResponseError(t('error.something_went_wrong'));
    }
    function handleFinally() {
      setIsSubmittingStatus(false);
    }

    fetchWrapper({
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${userData.Id}/status`,
      method: 'PUT',
      includeAuthToken: true,
      body: {
        Status: 'Inactive',
      },
      initiate,
      handleResponse,
      handleError,
      handleFinally,
    });
  }

  return (
    <Dialog
      open={show}
      onClose={() => setShow(false)}
      className="relative z-50"
    >
      {/* The backdrop, rendered as a fixed sibling to the panel container */}
      <div className="fixed inset-0 bg-gray-600/40" aria-hidden="true" />

      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {/* The actual dialog panel  */}
        <Dialog.Panel
          className={`${notoSansFont} mx-auto w-[100%] max-w-xl bg-white rounded-lg shadow-md`}
        >
          <div
            id="deactivate-modal-header"
            className="px-6 py-4 flex items-center justify-between font-semibold text-xl text-gray-800 border-b border-gray-300"
          >
            <Dialog.Title>Deactivate User</Dialog.Title>
            <div
              className="w-10 h-10 flex items-center justify-center cursor-pointer rounded hover:bg-gray-100"
              onClick={() => setShow(false)}
            >
              <Image src={crossIcon} alt="Close edit profile form" />
            </div>
          </div>
          <div
            id="deactivate-modal-content"
            className="p-6 flex flex-col items-start gap-8 font-normal text-base leading-7 text-gray-600"
          >
            Once you take the action, this user will be permanently removed from
            the system and will no longer be able to access the Roche Portal.
            <table className="w-full border border-gray-200 text-left">
              <thead>
                <tr className="bg-gray-100 text-gray-400 font-medium leading-[22px]">
                  <th className="py-3 px-4 w-1/2">Name</th>
                  <th className="py-3 px-4">Email</th>
                </tr>
              </thead>
              <tbody className="break-all">
                <tr className="leading-[22px] text-gray-800">
                  <td className="py-2 px-4 font-semibold">{userData.Name}</td>
                  <td className="py-2 px-4">{userData.Email}</td>
                </tr>
              </tbody>
            </table>
            {responseError && (
              <p className="-mt-2 text-sm font-medium text-red-500">
                {responseError}
              </p>
            )}
          </div>
          <div
            id="deactivate-modal-footer"
            className="py-4 px-6 flex items-center justify-end gap-4 font-semibold text-base text-gray-800 border-t border-gray-300"
          >
            <button
              type="button"
              className="py-2 px-3 rounded border border-gray-300 cancel-btn"
              onClick={() => setShow(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmittingStatus}
              className={`py-2 px-3 rounded text-white deactivate-btn ${
                isSubmittingStatus
                  ? 'bg-red-200 cursor-default pointer-events-none'
                  : 'bg-red-500'
              }`}
              onClick={deactivateUser}
            >
              Deactivate
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
