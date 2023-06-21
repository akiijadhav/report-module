import { ReactElement, useEffect, useState } from 'react';
import Image from 'next/image';
import { useFormik } from 'formik';
import untouchedDot from '../../public/icons/bullet.svg';
import greenCheckmark from '../../public/icons/green-checkmark.svg';
import redCross from '../../public/icons/red-cross.svg';
import { useRouter } from 'next/router';
import axios from 'axios';
import useRequestUtilities from '../hooks/use-request-utilities';
import { useTranslation } from 'react-i18next';

export default function ChangePassword({
  children,
}: {
  children?: ReactElement;
}) {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const [customPswdErrors, setCustomPswdErrors] = useState({
    insufficientLength: false,
    absentUpperLowerCase: false,
    absentDigitOrSymbol: false,
  });
  const [errormessage, setErrorMessage] = useState({
    currPswdErrorMessage: '',
    updatePswdErrorMsg: '',
  });
  const [isShowingCurrentPassword, setIsShowingCurrentPassword] =
    useState(false);
  const [isShowingNewPassword, setIsShowingNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { fetchWrapper } = useRequestUtilities();
  const submitHandler = async (values) => {
    function initiate() {
      setIsLoading(true);
    }
    async function handleResponse(response: Response) {
      if (response.ok) {
        setIsLoading(false);
        setIsSuccess(true);

        setErrorMessage({
          currPswdErrorMessage: '',
          updatePswdErrorMsg: '',
        });
      } else if (response.status === 401) {
        const resJson = await response.json();
        const errorMsg = resJson?.error[0]?.message?.trim();
        setErrorMessage({
          ...errormessage,
          updatePswdErrorMsg: errorMsg,
        });
      } else {
        const resJson = await response.json();

        const errorMsg = resJson?.error[0]?.message?.trim();

        setErrorMessage({
          ...errormessage,
          currPswdErrorMessage: errorMsg,
        });
      }
    }
    function handleError(error: any) {
      setErrorMessage({
        ...errormessage,
        updatePswdErrorMsg: t('error.something_went_wrong'),
      });
    }
    function handleFinally() {
      setIsLoading(false);
    }

    fetchWrapper({
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/account/change-password`,
      method: 'POST',
      body: {
        NewPassword: values.newPassword,
        CurrentPassword: values.currentPassword,
      },
      includeAuthToken: true,
      initiate,
      handleResponse,
      handleError,
      handleFinally,
    });
  };
  useEffect(() => {
    if (isSuccess) {
      router.push('/login');
    }
  }, [isSuccess]);

  const validationHandler = ({
    currentPassword,
    newPassword,
    confirmPassword,
  }: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    const errors: {
      currentPassword?: string | boolean;
      newPassword?: string | boolean;
      confirmPassword?: string | boolean;
    } = {};
    if (!currentPassword) {
      errors.currentPassword = t('error.enter_current_password');
    }
    if (!newPassword) {
      errors.newPassword = t('error.enter_new_password');
    }
    if (!confirmPassword) {
      errors.confirmPassword = t('error.enter_confirm_password');
    }
    if (currentPassword === newPassword) {
      errors.newPassword = t('error.password_different_previous_msg');
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = true;
    }
    if (newPassword.length < 8) {
      // errors.newPassword = true;
      setCustomPswdErrors((customPswdErrors) => ({
        ...customPswdErrors,
        insufficientLength: true,
      }));
    } else {
      setCustomPswdErrors((customPswdErrors) => ({
        ...customPswdErrors,
        insufficientLength: false,
      }));
      setErrorMessage({
        currPswdErrorMessage: '',
        updatePswdErrorMsg: '',
      });
    }
    if (!(/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword))) {
      // errors.newPassword = true;
      setCustomPswdErrors((customPswdErrors) => ({
        ...customPswdErrors,
        absentUpperLowerCase: true,
      }));
    } else {
      setCustomPswdErrors((customPswdErrors) => ({
        ...customPswdErrors,
        absentUpperLowerCase: false,
      }));
    }
    if (!(/\d/.test(newPassword) || /[-+=_!@#$%^&*.,?]/.test(newPassword))) {
      // errors.newPassword = true;
      setCustomPswdErrors((customPswdErrors) => ({
        ...customPswdErrors,
        absentDigitOrSymbol: true,
      }));
    } else {
      setCustomPswdErrors((customPswdErrors) => ({
        ...customPswdErrors,
        absentDigitOrSymbol: false,
      }));
    }
    return errors;
  };

  const formik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: validationHandler,
    onSubmit: submitHandler,
  });

  const resetPassword = () => {
    // if (isSuccess) {
    // }
  };
  const isError = Object.values(customPswdErrors).some((item) => item === true);

  return (
    <>
      <div className="flex flex-col">
        <p className="text-2xl font-semibold text-gray-800">
          {t('profile.change_password')}
        </p>
        <p className="font-normal text-base text-gray-600 mt-4">
          {t('profile.new_password_rule_heading')}
        </p>
        <form onSubmit={formik.handleSubmit}>
          <div className=" mt-6 relative w-full flex flex-col group">
            <input
              type={isShowingCurrentPassword ? 'text' : 'password'}
              className={`border ${
                formik.touched.currentPassword && formik.errors.currentPassword
                  ? 'border-red-600'
                  : 'border-gray-300'
              } rounded h-12  w-[501px] pl-8`}
              // placeholder="Current Password"
              value={formik.values.currentPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              name="currentPassword"
            />
            <label
              className={`font-normal text-base leading-6 text-gray-600 absolute top-3 left-12 pointer-events-none origin-top-left transition-all duration-200 group-focus-within:shrunk-label ${
                formik.values.currentPassword ? 'shrunk-label' : ''
              } ${
                formik.touched.currentPassword && formik.errors.currentPassword
                  ? 'text-red-500'
                  : ''
              }`}
            >
              {t('profile.current_password')}
            </label>
            {formik.touched.currentPassword && formik.errors.currentPassword ? (
              <p className="text-red-600">
                {formik.errors.currentPassword as string}
              </p>
            ) : null}
            {errormessage.currPswdErrorMessage && (
              <p className="text-red-600">
                {errormessage.currPswdErrorMessage}
              </p>
            )}
            <Image
              src="/icons/password-icon.svg"
              alt="Profile icon"
              width={18}
              height={20}
              className="absolute top-4 left-3 pointer-events-none"
            />
            <Image
              src="/icons/show-password-icon.svg"
              alt="Show password icon"
              width={24}
              height={24}
              className={`absolute top-3 right-7 cursor-pointer ${
                isShowingCurrentPassword ? 'opacity-100' : 'opacity-50'
              }`}
              onClick={() =>
                setIsShowingCurrentPassword(
                  (isShowingCurrentPassword) => !isShowingCurrentPassword,
                )
              }
            />
          </div>
          <div className="mt-8 relative w-full flex flex-col group">
            <input
              type={isShowingNewPassword ? 'text' : 'password'}
              className={`border ${
                formik.touched.newPassword && formik.errors.newPassword
                  ? 'border-red-600'
                  : 'border-gray-300'
              } rounded h-12  w-[501px] pl-8`}
              // placeholder="New Password"
              value={formik.values.newPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              name="newPassword"
            />
            <label
              className={`font-normal text-base leading-6 text-gray-600 absolute top-3 left-12 pointer-events-none origin-top-left transition-all duration-200 group-focus-within:shrunk-label ${
                formik.values.newPassword ? 'shrunk-label' : ''
              } ${
                formik.touched.newPassword && formik.errors.newPassword
                  ? 'text-red-500'
                  : ''
              }`}
            >
              {t('profile.new_password')}
            </label>
            {formik.touched.newPassword && formik.errors.newPassword ? (
              <p className="text-red-600">
                {formik.errors.newPassword as string}
              </p>
            ) : null}
            <Image
              src="/icons/password-icon.svg"
              alt="Profile icon"
              width={18}
              height={20}
              className="absolute top-4 left-3 pointer-events-none"
            />
            <Image
              src="/icons/show-password-icon.svg"
              alt="Show password icon"
              width={24}
              height={24}
              className={`absolute top-3 right-7 cursor-pointer ${
                isShowingNewPassword ? 'opacity-100' : 'opacity-50'
              }`}
              onClick={() =>
                setIsShowingNewPassword(
                  (isShowingNewPassword) => !isShowingNewPassword,
                )
              }
            />
          </div>
          <div className="mt-8 relative w-full flex flex-col group">
            <input
              type="password"
              className={`border ${
                formik.touched.confirmPassword && formik.errors.confirmPassword
                  ? 'border-red-600'
                  : 'border-gray-300'
              } rounded h-12  w-[501px] pl-8`}
              // placeholder="Confirm New Password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              name="confirmPassword"
            />
            <label
              className={`font-normal text-base leading-6 text-gray-600 absolute top-3 left-12 pointer-events-none origin-top-left transition-all duration-200 group-focus-within:shrunk-label ${
                formik.values.confirmPassword ? 'shrunk-label' : ''
              } ${
                formik.touched.confirmPassword && formik.errors.confirmPassword
                  ? 'text-red-500'
                  : ''
              }`}
            >
              {t('profile.confirm_new_password')}
              {/* Confirm New Password */}
            </label>
            {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
              <p className="text-red-600">
                {formik.errors.confirmPassword as string}
              </p>
            ) : null}
            <Image
              src="/icons/password-icon.svg"
              alt="Profile icon"
              width={18}
              height={20}
              className="absolute top-4 left-3 pointer-events-none"
            />
          </div>
          <div className={`mt-7 text-sm text-[#626C84]`}>
            <div className="flex items-center gap-1">
              <Image
                src={
                  formik.touched.confirmPassword
                    ? formik.errors.confirmPassword
                      ? redCross
                      : greenCheckmark
                    : untouchedDot
                }
                alt={
                  formik.touched.confirmPassword
                    ? formik.errors.confirmPassword
                      ? t('error.password_not_matched')
                      : t('error.password_match')
                    : 'Field untouched yet'
                }
              />
              {t('profile.password_match')}
            </div>
            <div className="flex items-center gap-1">
              <Image
                src={
                  formik.touched.newPassword
                    ? customPswdErrors.insufficientLength
                      ? redCross
                      : greenCheckmark
                    : untouchedDot
                }
                alt={
                  formik.touched.newPassword
                    ? customPswdErrors.insufficientLength
                      ? t('error.do_not_contain_atleast_8')
                      : t('error.contain_atleast_8')
                    : 'Field untouched yet'
                }
              />
              {t('profile.min_8_character')}
            </div>
            <div className="flex items-center gap-1">
              <Image
                src={
                  formik.touched.newPassword
                    ? customPswdErrors.absentUpperLowerCase
                      ? redCross
                      : greenCheckmark
                    : untouchedDot
                }
                alt={
                  formik.touched.newPassword
                    ? customPswdErrors.absentUpperLowerCase
                      ? t('error.does_not_contain_upper_lower')
                      : t('error.contain_lower_upper')
                    : 'Field untouched yet'
                }
              />
              {t('profile.case_letter')}
            </div>
            <div className="flex items-center gap-1">
              <Image
                src={
                  formik.touched.newPassword
                    ? customPswdErrors.absentDigitOrSymbol
                      ? redCross
                      : greenCheckmark
                    : untouchedDot
                }
                alt={
                  formik.touched.newPassword
                    ? customPswdErrors.absentDigitOrSymbol
                      ? t('error.does_not_contain_number_symbol')
                      : t('error.contain_number_symbol')
                    : 'Field untouched yet'
                }
              />
              {t('profile.symbol')}
            </div>
          </div>
          <button
            type="submit"
            className={`bg-[#0284C7] w-[501px] h-[52px] font-semibold text-base mt-4 text-white rounded ${
              isError || formik.errors.confirmPassword || isLoading
                ? 'cursor-not-allowed pointer-events-none opacity-50'
                : 'opacity-100'
            }`}
            onClick={resetPassword}
          >
            Reset Password
          </button>
          {errormessage.updatePswdErrorMsg && (
            <p className="text-red-600">{errormessage.updatePswdErrorMsg}</p>
          )}
        </form>
      </div>
    </>
  );
}
