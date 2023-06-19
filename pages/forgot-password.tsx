import { NextPageWithLayout } from './_app';
import { useFormik } from 'formik';
import RocFormContainer from '../components/ui/form-container';
import RocCircularImage from '../components/ui/circular-image';
import RocEmailInput from '../components/forms/email-input';
import Link from 'next/link';
import { ReactElement, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layouts/layout';
import axios from 'axios';
import useRequestUtilities from '../components/hooks/use-request-utilities';
import { useTranslation } from 'react-i18next';

const ForgotPasswordPage: NextPageWithLayout = () => {
  const router = useRouter();
  const isLinkExpired = !!router?.query?.linkExpiredForEmail;
  const [areInstructionsSent, setAreInstructionsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { fetchWrapper } = useRequestUtilities();
  const { t } = useTranslation();
  let emailParam =
    typeof router?.query?.linkExpiredForEmail === 'string'
      ? router.query.linkExpiredForEmail
      : router.query?.linkExpiredForEmail?.at(0);
  if (typeof window !== 'undefined') {
    emailParam = emailParam?.trim()?.replaceAll(' ', '+');
  }

  const validEmailDomains: string[] = JSON.parse(
    process.env.NEXT_PUBLIC_VALID_EMAIL_DOMAINS,
  );
  const validationHandler = ({ email }: { email: string }) => {
    const errors: {
      email?: string;
    } = {};
    setErrorMessage('');
    if (!validEmailDomains.some((domain) => email.endsWith(domain))) {
      errors.email = t('error.only_roche_email');
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = t('error.please_enter_correct_email');
    }
    if (!email) {
      errors.email = t('error.please_enter_email');
    }
    return errors;
  };
  const submitHandler = async ({ email }: { email: string }) => {
    function initiate() {
      setIsLoading(true);
    }
    async function handleResponse(response: Response) {
      if (response.status === 201) {
        setAreInstructionsSent(true);
      } else if (response.status === 401) {
        setErrorMessage(t('error.email_not_exist'));
      } else {
        setErrorMessage(t('error.email_not_exist'));
      }
    }
    function handleError(error: any) {
      setErrorMessage(t('error.something_went_wrong'));
    }
    function handleFinally() {
      setIsLoading(false);
    }

    fetchWrapper({
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/account/forgot-password`,
      method: 'POST',
      body: {
        Email: email,
      },
      initiate,
      handleResponse,
      handleError,
      handleFinally,
    });
  };
  const formik = useFormik({
    initialValues: {
      email: emailParam || '',
    },
    validate: validationHandler,
    onSubmit: submitHandler,
    enableReinitialize: true,
  });

  if (areInstructionsSent) {
    return (
      <>
        <RocFormContainer>
          <RocCircularImage
            imgSrc={'/icons/email-sent.svg'}
            sideLength="80px"
            bgColour="#F0F9FF"
            imgWidth={40}
            imgHeight={40}
          />
          <h1 className={`font-semibold text-2xl text-gray-800`}>
            {t('forgot_password.password_instruction')}
          </h1>
          <p className="font-normal text-base text-gray-600">
            {t('forgot_password.email_sent')}{' '}
            <span className="font-semibold text-[#0078C1]">
              {formik.values.email}
            </span>
            . {t('forgot_password.please_check_email')}
          </p>
          <div className={`font-semibold text-gray-600`}>
            {t('forgot_password.not_received_email')}:
            <ul className={`list-disc font-normal ml-6`}>
              <li>{t('forgot_password.recheck_email')}</li>
              <li>{t('forgot_password.spam_folder')}</li>
            </ul>
          </div>
          <div className="text-base leading-5 space-y-4">
            <div className="font-semibold text-gray-400 uppercase">
              {t('forgot_password.or')}
            </div>
            <div className="font-normal text-gray-600">
              {t('forgot_password.go_back_to')}{' '}
              <Link
                onClick={() => setAreInstructionsSent(false)}
                href="/forgot-password"
                className="font-semibold text-[#0284C7] cursor-pointer"
              >
                {t('forgot_password.change_email_id')}
              </Link>
            </div>
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
            imgSrc={
              isLinkExpired ? '/icons/link-expired.svg' : '/icons/blue-key.svg'
            }
            sideLength="80px"
            bgColour="#F0F9FF"
            imgWidth={40}
            imgHeight={40}
          />
          <h1 className={`font-semibold text-2xl text-gray-800`}>
            {isLinkExpired
              ? t('forgot_password.reset_link_expired')
              : t('forgot_password.forgot_password')}
          </h1>
          <p className="font-normal text-base text-gray-600">
            {isLinkExpired
              ? t('forgot_password.start_password_reset_process')
              : t('forgot_password.forgot_password_msg')}
          </p>
          <RocEmailInput
            name="email"
            className="h-12 rounded border border-gray-300 pl-12"
            required={false}
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={!!formik.errors.email && formik.touched.email}
          />
          {formik.touched.email && formik.errors.email && (
            <p className={`font-normal text-xs text-red-600 pl-4 -mt-5`}>
              {formik.errors.email as string}
            </p>
          )}
          {errorMessage && (
            <p className="font-normal text-xs text-red-600">{errorMessage}</p>
          )}
          <button
            type="submit"
            className={`w-full bg-[#0284C7] py-3 px-4 text-white font-semibold text-base leading-7 shadow-sm rounded hover:shadow-none ${
              isLoading
                ? 'cursor-not-allowed pointer-events-none opacity-50'
                : 'opacity-100'
            }`}
          >
            {isLinkExpired
              ? t('forgot_password.send_email')
              : t('forgot_password.password_reset_link')}
          </button>
          {isLinkExpired ? (
            <div className="self-center text-base leading-7 text-gray-600">
              {t('forgot_password.remember_password')}?{' '}
              <Link
                href="/login"
                className="self-center font-semibold text-base leading-7 text-[#0284C7]"
              >
                {t('login.login')}
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="self-center font-semibold text-base leading-7 text-[#0284C7]"
            >
              {t('forgot_password.back_to_login')}
            </Link>
          )}
        </RocFormContainer>
      </form>
    </>
  );
};

ForgotPasswordPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default ForgotPasswordPage;
