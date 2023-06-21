import { NextPageWithLayout } from '../_app';
import { useFormik } from 'formik';
import RocCircularImage from '../../components/ui/circular-image';
import RocEmailInput from '../../components/forms/email-input';
import RocPasswordInput from '../../components/forms/password-input';
import RocFormContainer from '../../components/ui/form-container';
import Image from 'next/image';
import untouchedDot from '../../public/icons/bullet.svg';
import greenCheckmark from '../../public/icons/green-checkmark.svg';
import redCross from '../../public/icons/red-cross.svg';
import { useState, useEffect, ReactElement } from 'react';
import Link from 'next/link';
import Layout from '../../components/layouts/layout';
import SetupPasswordSkeleton from '../../components/loading/setup-password-skeleton';
import useRequestUtilities from '../../components/hooks/use-request-utilities';
import { useTranslation } from 'react-i18next';
const robotoFont = 'roboto';

const ResetPasswordPage: NextPageWithLayout = () => {
  const { fetchWrapper, nextJsRouter: router } = useRequestUtilities();
  const token =
    typeof router?.query?.token === 'string'
      ? router.query.token
      : router.query?.token?.at(0);
  let emailParam =
    typeof router?.query?.email === 'string'
      ? router.query.email
      : router.query?.email?.at(0);
  if (typeof window !== 'undefined') {
    emailParam = emailParam?.trim()?.replaceAll(' ', '+');
  }

  type viewStateType = 'set' | 'success' | 'failure' | 'loading';
  const [viewState, setViewState] = useState<viewStateType>('loading');
  const [loading, setLoading] = useState(false);
  const [responseError, setResponseError] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    if (!emailParam) return;
    async function verifyToken(Email: string, Token: string) {
      function handleResponse(response: Response) {
        if (response.ok) {
          setViewState('set');
        } else {
          router.replace(
            `/forgot-password?linkExpiredForEmail=${Email}`,
            `/reset-password/${Token}?email=${Email}`,
          );
        }
      }
      function handleError(_error: any) {
        setViewState('failure');
      }

      fetchWrapper({
        url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/account/verify-reset-password-token`,
        method: 'POST',
        body: {
          Email,
          Token,
        },
        handleResponse,
        handleError,
      });
    }
    verifyToken(emailParam, token);
  }, [emailParam]);

  const [customPswdErrors, setCustomPswdErrors] = useState({
    insufficientLength: false,
    absentUpperLowerCase: false,
    absentDigitOrSymbol: false,
  });

  const submitHandler = async (values: {
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    function initiate() {
      setLoading(true);
    }
    async function handleResponse(response: Response) {
      if (response.ok) {
        setViewState('success');
      } else {
        const resJson = await response.json();
        const errorMsg =
          resJson?.error?.at(0)?.message ||
          `Error ${response.status}: ${response.statusText}`;
        setResponseError(errorMsg);
        setViewState('set');
      }
    }
    function handleError(_error: any) {
      setViewState('failure');
    }
    function handleFinally() {
      setLoading(false);
    }

    fetchWrapper({
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/account/reset-password`,
      method: 'POST',
      body: {
        Password: values.confirmPassword,
        Token: token,
      },
      initiate,
      handleResponse,
      handleError,
      handleFinally,
    });
  };

  const validEmailDomains: string[] = JSON.parse(
    process.env.NEXT_PUBLIC_VALID_EMAIL_DOMAINS,
  );
  const validationHandler = ({
    email,
    password,
    confirmPassword,
  }: {
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    const errors: {
      email?: string;
      password?: boolean;
      confirmPassword?: string | boolean;
    } = {};

    setResponseError('');

    if (!password) {
      errors.password = true;
    }
    if (!validEmailDomains.some((domain) => email.endsWith(domain))) {
      errors.email = t('error.only_roche_email');
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = t('error.please_enter_correct_email');
    }
    if (!email) {
      errors.email = t('error.email_is_required');
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = true;
    }
    if (password.length < 8) {
      errors.password = true;
      setCustomPswdErrors((customPswdErrors) => ({
        ...customPswdErrors,
        insufficientLength: true,
      }));
    } else {
      setCustomPswdErrors((customPswdErrors) => ({
        ...customPswdErrors,
        insufficientLength: false,
      }));
    }
    if (!(/[A-Z]/.test(password) && /[a-z]/.test(password))) {
      errors.password = true;
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
    if (!(/\d/.test(password) || /[-+=_!@#$%^&*.,?]/.test(password))) {
      errors.password = true;
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
      email: emailParam || '',
      password: '',
      confirmPassword: '',
    },
    validate: validationHandler,
    onSubmit: submitHandler,
    enableReinitialize: true,
  });

  if (viewState === 'loading') {
    return <SetupPasswordSkeleton />;
  }

  if (viewState === 'success') {
    return (
      <>
        <RocFormContainer>
          <RocCircularImage
            imgSrc={'/icons/password-success.svg'}
            sideLength="80px"
            bgColour="#F0F9FF"
            imgWidth={40}
            imgHeight={40}
          />
          <h1 className={`font-semibold text-2xl text-gray-800`}>
            {t('error.password_set_successfully')}
          </h1>
          <p className="font-normal text-base text-gray-600">
            <Link href="/login" className="font-semibold text-[#0078C1]">
              {t('error.click_here')}
            </Link>{' '}
            {t('error.login')}.
          </p>
        </RocFormContainer>
      </>
    );
  }

  if (viewState === 'failure') {
    return (
      <>
        <RocFormContainer>
          <RocCircularImage
            imgSrc={'/icons/blue-error.svg'}
            sideLength="80px"
            bgColour="#F0F9FF"
            imgWidth={40}
            imgHeight={40}
          />
          <h1 className={`font-semibold text-2xl text-gray-800`}>
            {t('error.something_went_wrong')}
          </h1>
          <p className="font-normal text-base text-gray-600">
            {t('error.trouble_msg')}
          </p>
          <div
            onClick={() => router.reload()}
            className="w-full flex justify-center gap-2 bg-[#0284C7] py-3 px-4 text-white font-semibold text-base leading-7 shadow-sm rounded hover:shadow-none cursor-pointer"
          >
            <Image
              src="/icons/reload.svg"
              width={24}
              height={24}
              className="h-6"
              alt=""
            />
            {t('error.reload')}
          </div>
        </RocFormContainer>
      </>
    );
  }

  return (
    <>
      <form onSubmit={formik.handleSubmit}>
        <RocFormContainer>
          <RocCircularImage
            imgSrc={'/icons/password-icon-blue.svg'}
            sideLength="80px"
            bgColour="#F0F9FF"
            imgWidth={40}
            imgHeight={40}
          />
          <h1 className={`font-semibold text-2xl text-gray-800`}>
            {t('error.reset_password')}
          </h1>
          <RocEmailInput
            name="email"
            required={true}
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && !!formik.errors.email}
            read_only={true}
            className="h-12 rounded border border-gray-300 bg-gray-100 pl-12 pointer-events-none"
          />
          {formik.touched.email && formik.errors.email && (
            <p className={`font-normal text-xs text-red-600 pl-4 -mt-5`}>
              {formik.errors.email as string}
            </p>
          )}
          <RocPasswordInput
            className="h-12 rounded border border-gray-300 px-12"
            error={formik.touched.password && !!formik.errors.password}
            name="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            onInput={() => formik.setFieldTouched('password')}
            required={true}
            label={t('profile.new_password')}
          />
          <RocPasswordInput
            className="h-12 rounded border border-gray-300 px-12"
            error={
              formik.touched.confirmPassword && !!formik.errors.confirmPassword
            }
            name="confirmPassword"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            onInput={() => formik.setFieldTouched('confirmPassword')}
            required={true}
            label={t('profile.confirm_new_password')}
          />
          <div className={`${robotoFont} text-sm text-[#626C84]`}>
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
                  formik.touched.password
                    ? customPswdErrors.insufficientLength
                      ? redCross
                      : greenCheckmark
                    : untouchedDot
                }
                alt={
                  formik.touched.password
                    ? customPswdErrors.insufficientLength
                      ? 'Insufficient length'
                      : 'Sufficient length'
                    : 'Field untouched yet'
                }
              />
              {t('profile.min_8_character')}
            </div>
            <div className="flex items-center gap-1">
              <Image
                src={
                  formik.touched.password
                    ? customPswdErrors.absentUpperLowerCase
                      ? redCross
                      : greenCheckmark
                    : untouchedDot
                }
                alt={
                  formik.touched.password
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
                  formik.touched.password
                    ? customPswdErrors.absentDigitOrSymbol
                      ? redCross
                      : greenCheckmark
                    : untouchedDot
                }
                alt={
                  formik.touched.password
                    ? customPswdErrors.absentDigitOrSymbol
                      ? t('error.does_not_contain_number_symbol')
                      : t('error.contain_number_symbol')
                    : 'Field untouched yet'
                }
              />
              {t('profile.symbol')}
            </div>
          </div>
          {responseError && (
            <p className="font-medium text-sm text-red-500">{responseError}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 text-white font-semibold text-base leading-7 shadow-sm rounded hover:shadow-none ${
              loading ? 'bg-blue-disabled cursor-default' : 'bg-[#0284C7]'
            }`}
          >
            {t('error.reset_password')}
          </button>
        </RocFormContainer>
      </form>
    </>
  );
};

ResetPasswordPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default ResetPasswordPage;
