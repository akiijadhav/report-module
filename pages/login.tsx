import React from 'react';
import { NextPageWithLayout } from './_app';
import RocCircularImage from '../components/ui/circular-image';
import Link from 'next/link';
import { useFormik } from 'formik';
import RocEmailInput from '../components/forms/email-input';
import RocPasswordInput from '../components/forms/password-input';
import RocFormContainer from '../components/ui/form-container';
import { ReactElement, useState } from 'react';
import Layout from '../components/layouts/layout';
import { useRouter } from 'next/router';
import useRequestUtilities from '../components/hooks/use-request-utilities';
import { useTranslation } from 'react-i18next';
import loaderIcon from '../public/icons/loader-gray.svg';
import Image from 'next/image';

const LoginPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [responseError, setResponseError] = useState('');
  const { fetchWrapper } = useRequestUtilities();
  const { t } = useTranslation();

  const submitHandler = async ({ email, password }) => {
    function initiate() {
      setLoading(true);
    }
    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.status === 201) {
        const userInfo = resJson?.user;
        const accessToken = resJson?.tokens?.accessToken;
        const refreshToken = resJson?.tokens?.refreshToken;
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        if (userInfo?.role === 'Admin') {
          router.push('/users');
        } else {
          router.push('/data-sources');
        }
      } else if (response.status === 401) {
        const errorMsg = resJson?.message?.trim();
        if (errorMsg === `There isn't any user with email: ${email}`) {
          setResponseError(t('error.please_enter_correct_password'));
        }
        if (errorMsg === `Wrong password for user with email: ${email}`) {
          setResponseError(t('error.please_enter_correct_password'));
        }
        setLoading(false);
      } else {
        setResponseError(t('error.something_went_wrong'));
        setLoading(false);
      }
    }
    function handleError(error: any) {
      setResponseError(String(error) || t('error.falid_to_fetch'));
      setLoading(false);
    }

    fetchWrapper({
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/account/login`,
      method: 'POST',
      body: {
        Email: email,
        Password: password,
      },
      initiate,
      handleResponse,
      handleError,
    });
  };

  const validEmailDomains: string[] = JSON.parse(
    process.env.NEXT_PUBLIC_VALID_EMAIL_DOMAINS,
  );
  const validationHandler = ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    const errors: { email?: string; password?: string } = {};
    if (!password) {
      errors.password = t('error.please_enter_password');
    }
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

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validate: validationHandler,
    onSubmit: submitHandler,
  });

  return (
    <>
      <form onSubmit={formik.handleSubmit}>
        <RocFormContainer>
          <RocCircularImage
            imgSrc={'/icons/login-form-img.svg'}
            sideLength="80px"
            bgColour="#F0F9FF"
            imgWidth={26.67}
            imgHeight={35}
          />
          <h1 className={`font-semibold text-2xl text-gray-800`}>
            {t('login.login_title')}
          </h1>
          <RocEmailInput
            name="email"
            className="h-12 rounded border border-gray-300 pl-12"
            required={false}
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && !!formik.errors.email}
          />
          {formik.touched.email && formik.errors.email && (
            <p className={`font-normal text-xs text-red-600 pl-4 -mt-5`}>
              {formik.errors.email as string}
            </p>
          )}
          <RocPasswordInput
            name="password"
            className="h-12 rounded border border-gray-300 px-12"
            required={false}
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.password && !!formik.errors.password}
          />
          {formik.touched.password && formik.errors.password && (
            <p className={`font-normal text-xs text-red-600 pl-4 -mt-5`}>
              {formik.errors.password as string}
            </p>
          )}
          {responseError ? (
            <p className="text-sm font-medium text-red-500">{responseError}</p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4   text-white font-semibold text-base leading-7 shadow-sm rounded hover:shadow-none ${
              loading
                ? 'bg-blue-disabled cursor-not-allowed pointer-events-none opacity-50'
                : 'bg-[#0284C7]'
            }`}
          >
            {loading ? (
              <span className="w-full  flex items-center gap-1 justify-center">
                <Image
                  src={loaderIcon}
                  className="brightness-[5] animate-spin"
                  alt="Uploading file"
                />{' '}
                <span>{t('login.login')}</span>
              </span>
            ) : (
              t('login.login')
            )}
          </button>
          <Link
            href="/forgot-password"
            className="self-center font-semibold text-base leading-7 text-[#0284C7]"
          >
            {t('login.forgot_password')}?
          </Link>
        </RocFormContainer>
      </form>
    </>
  );
};

LoginPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default LoginPage;
