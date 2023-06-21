import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { rowInterface } from './table/types';
import Image from 'next/image';
import crossIcon from '../../public/icons/cross-icon.svg';
import profileImage from '../../public/icons/profile-image.svg';
import copyIcon from '../../public/icons/copy-icon.svg';
import copiedIcon from '../../public/icons/copied-icon.svg';
import infoIcon from '../../public/icons/info-icon.svg';
import RocTextInput from '../forms/text-input';
import { useFormik } from 'formik';
import RocNumberInput from '../forms/number-input';
import RocTooltip from '../ui/tooltip';
import EditUserProfileSkeleton from '../loading/edit-user-profile-skeleton';
import useRequestUtilities from '../hooks/use-request-utilities';
import { responseMsgType } from '../ui/notification';
import { useTranslation } from 'react-i18next';

export default function EditUserProfile({
  setShow,
  userData,
  setUserUpdateMsg,
  setData,
}: {
  setShow: Dispatch<SetStateAction<boolean>>;
  userData: rowInterface;
  setUserUpdateMsg: Dispatch<SetStateAction<responseMsgType>>;
  setData: Dispatch<SetStateAction<rowInterface[]>>;
}) {
  if (typeof window !== 'undefined') {
    const offsetHeight = document.getElementById('user-header')?.offsetHeight;
    if (offsetHeight) {
      document.documentElement.style.setProperty(
        '--calculated-top',
        `${offsetHeight}px`,
      );
    } else {
      document.documentElement.style.setProperty('--calculated-top', '3.5rem');
    }
  }

  type viewScreenType = 'loading' | 'set';
  const [viewScreen, setViewScreen] = useState<viewScreenType>('loading');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isCopied, setIscopied] = useState(false);
  const [responseErrorMsg, setResponseErrorMsg] = useState('');
  const { fetchWrapper } = useRequestUtilities();
  const { t } = useTranslation();

  useEffect(() => {
    async function fetchSingleUser(userId: number | string) {
      function initiate() {
        setViewScreen('loading');
      }
      async function handleResponse(response: Response) {
        const resJson = await response.json();
        if (response.ok) {
          formik.setFieldValue('fullName', resJson.Name);
          formik.setFieldValue('contactNumber', resJson.Contact);
        } else {
          const errorMsg =
            typeof resJson?.message === 'string'
              ? resJson.message
              : resJson?.message?.at(0);
          setResponseErrorMsg(
            errorMsg || `Error ${response.status}: ${response.statusText}`,
          );
        }
      }
      function handleError(error: any) {
        setResponseErrorMsg(t('error.something_went_wrong'));
      }
      function handleFinally() {
        setViewScreen('set');
      }
      fetchWrapper({
        url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${userId}`,
        includeAuthToken: true,
        initiate,
        handleResponse,
        handleError,
        handleFinally,
      });
    }
    fetchSingleUser(userData.Id);
  }, []);

  useEffect(() => {
    if (!isCopied) return;

    setTimeout(() => setIscopied(false), 2000);
  }, [isCopied]);

  const updateProfileHandler = async ({ fullName, contactNumber }) => {
    function initiate() {
      setIsUpdatingProfile(true);
    }
    async function handleResponse(response: Response) {
      if (response.ok) {
        setData((old) =>
          old.map((row) => {
            if (row.Id === userData.Id) {
              return {
                ...row,
                Name: fullName,
                Contact: contactNumber ? String(contactNumber) : null,
              };
            } else {
              return row;
            }
          }),
        );
        setUserUpdateMsg({
          isError: false,
          entityName: fullName,
          msg: ' profile has been updated',
        });
        setShow(false);
      } else {
        const resJson = await response.json();
        const errorMsg =
          typeof resJson?.message === 'string'
            ? resJson.message
            : resJson?.message?.at(0);
        setResponseErrorMsg(
          errorMsg || `Error ${response.status}: ${response.statusText}`,
        );
      }
    }
    function handleError(error: any) {
      setResponseErrorMsg(t('error.something_went_wrong'));
    }
    function handleFinally() {
      setIsUpdatingProfile(false);
    }

    fetchWrapper({
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${userData.Id}`,
      method: 'PUT',
      includeAuthToken: true,
      body: {
        Name: fullName,
        Contact: contactNumber ? String(contactNumber) : null,
      },
      initiate,
      handleResponse,
      handleError,
      handleFinally,
    });
  };
  const validationHandler = ({ fullName, contactNumber }) => {
    setResponseErrorMsg('');

    const errors: {
      fullName?: string | boolean;
      contactNumber?: string | boolean;
    } = {};

    if (!fullName) {
      errors.fullName = t('error.enter_full_name');
    }

    if (
      contactNumber &&
      (String(contactNumber).length < 10 || String(contactNumber).length > 15)
    ) {
      errors.contactNumber = 'Please enter a valid number';
    }

    return errors;
  };
  const formik = useFormik({
    initialValues: {
      fullName: '',
      contactNumber: '',
    },
    validate: validationHandler,
    onSubmit: updateProfileHandler,
    enableReinitialize: true,
  });

  if (viewScreen === 'loading') {
    return <EditUserProfileSkeleton setShow={setShow} />;
  }

  return (
    <>
      <form
        className="z-20 fixed edit-user-profile-calculated right-0 w-[30%] bg-white shadow-xl flex flex-col overflow-auto"
        onSubmit={formik.handleSubmit}
      >
        <div
          id="edit-profile-header"
          className="w-full p-4 flex items-center justify-between border-b border-gray-300 font-semibold text-xl text-gray-800"
        >
          {t('profile.edit_profile')}
          <div
            className="w-10 h-10 flex items-center justify-center cursor-pointer rounded hover:bg-gray-100"
            onClick={() => setShow(false)}
          >
            <Image src={crossIcon} alt="Close edit profile form" />
          </div>
        </div>
        <div
          id="edit-profile-content"
          className="px-4 py-6 flex flex-col gap-6"
        >
          <Image src={profileImage} alt="Profile image" />
          <RocTextInput
            name="fullName"
            label={`${t('profile.full_name')}`}
            className="h-12 w-full rounded border border-gray-300 pl-12"
            required={true}
            value={formik.values.fullName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.fullName && !!formik.errors.fullName}
            isImage={true}
          />
          {formik.touched.fullName && formik.errors.fullName && (
            <p className={`font-normal text-xs text-red-600 pl-4 -mt-5`}>
              {formik.errors.fullName as string}
            </p>
          )}
          <RocNumberInput
            className="h-12 w-full rounded border border-gray-300 pl-12"
            name="contactNumber"
            required={false}
            isImage={true}
            value={formik.values.contactNumber}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.contactNumber && !!formik.errors.contactNumber
            }
            label={`${t('profile.phone_number')}`}
          />
          {formik.touched.contactNumber && formik.errors.contactNumber && (
            <p className={`font-normal text-xs text-red-600 pl-4 -mt-5`}>
              {formik.errors.contactNumber as string}
            </p>
          )}
          <div className="flex flex-col gap-1 font-normal text-sm leading-4 text-gray-600">
            {t('profile.email_id')}
            <div className="text-base text-gray-800">{userData?.Email}</div>
          </div>
          <div className="flex flex-col gap-2 font-normal text-sm leading-4 text-gray-600">
            <div className="flex items-center gap-2">
              {t('profile.application_key')}
              <div className="relative group">
                <Image src={infoIcon} alt="Hover to know more" />
                <RocTooltip
                  width={'250px'}
                  bottom="calc(100% + 0.5rem)"
                  left="-725%"
                >
                  A team member must use the application key to sync the offline
                  data online in order to use the offline application.
                </RocTooltip>
              </div>
            </div>
            <div className="text-base text-gray-800 flex items-center justify-between">
              {userData?.AccessKey}
              <Image
                src={isCopied ? copiedIcon : copyIcon}
                alt="Copy application key"
                className="cursor-pointer"
                onClick={() => {
                  navigator.clipboard
                    .writeText(userData?.AccessKey)
                    .then(() => setIscopied(true));
                }}
              />
            </div>
          </div>
          {responseErrorMsg && (
            <p className="text-sm font-medium text-red-500">
              {responseErrorMsg}
            </p>
          )}
        </div>
        <div
          id="edit-profile-footer"
          className="p-4 mt-auto flex justify-end items-center"
        >
          <button
            type="submit"
            disabled={isUpdatingProfile}
            className={`font-semibold text-base text-white text-center px-3 py-2 rounded shadow-sm ${
              isUpdatingProfile
                ? 'bg-blue-disabled cursor-default pointer-events-none'
                : 'bg-[#0284C7]'
            }`}
          >
            {t('profile.update_profile')}
          </button>
        </div>
      </form>
    </>
  );
}
