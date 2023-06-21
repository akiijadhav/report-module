import { Dispatch, SetStateAction, useState } from 'react';
import Modal from '../ui/modal';
import { useFormik } from 'formik';
import { useRouter } from 'next/router';
import useRequestUtilities from '../hooks/use-request-utilities';
import TextInput from '../forms/text-input-without-image';
import { useTranslation } from 'react-i18next';

const notoSansFont = 'noto-sans';

export default function CreateModal({
  setCreateDataSourceModal,
}: {
  setCreateDataSourceModal: Dispatch<SetStateAction<boolean>>;
}) {
  const { fetchWrapper } = useRequestUtilities();
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(true);
  const router = useRouter();
  const { t } = useTranslation();

  const dataSourceValidationHandler = ({
    name = '',
    hospitalName,
  }: {
    name: string;
    hospitalName?: string;
  }) => {
    const errors: { name?: string; hospitalName?: string } = {};
    if (name === '') {
      errors.name = t('error.enter_data_source_name');
    }
    if (name && name.length > 200) {
      errors.name = t('error.max_length_data_source_name');
    }
    if (hospitalName && hospitalName.length > 200) {
      errors.hospitalName = t('error.max_length_hospital_name');
    }
    return errors;
  };

  const dataSourceSubmitHandler = async (values) => {
    function initiate() {
      setIsLoading(true);
    }
    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.ok) {
        router.push(`data-sources/${resJson.id}`);
        return;
      } else {
        setErrorMessage(resJson?.message || t('error.something_went_wrong'));
        setIsLoading(false);
      }
    }
    function handleError(_error: any) {
      setErrorMessage(t('error.something_went_wrong'));
      setIsLoading(false);
    }

    fetchWrapper({
      method: 'POST',
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/datasources`,
      includeAuthToken: true,
      body: values,
      handleResponse,
      handleError,
      initiate,
    });
  };

  const dataSourceFormik = useFormik({
    initialValues: {
      name: '',
      hospitalName: '',
    },
    validate: dataSourceValidationHandler,
    onSubmit: dataSourceSubmitHandler,
  });

  return (
    <Modal open={open} setOpen={setOpen}>
      <>
        <form className={notoSansFont} onSubmit={dataSourceFormik.handleSubmit}>
          <p className="font-semibold text-xl text-gray-800">
            {t('generate_dataSource_modal.generate_data_source')}
          </p>
          <div className="py-8">
            <div className="group">
              <TextInput
                name="name"
                label={t('generate_dataSource_modal.name')}
                className="h-12 w-full rounded border border-gray-300 pl-4"
                required={false}
                value={dataSourceFormik.values.name}
                onChange={dataSourceFormik.handleChange}
                onBlur={dataSourceFormik.handleBlur}
                error={
                  dataSourceFormik.touched.name &&
                  !!dataSourceFormik.errors.name
                }
                isImage={false}
              />
              {dataSourceFormik.touched.name &&
                dataSourceFormik.errors.name && (
                  <p className={`font-normal text-xs text-red-600 pl-3 `}>
                    {dataSourceFormik.errors.name as string}
                  </p>
                )}
            </div>
          </div>
          <div className="group relative">
            <TextInput
              name="hospitalName"
              label={t('generate_dataSource_modal.hospital_name')}
              className="h-12 w-full rounded border border-gray-300 pl-3"
              required={false}
              value={dataSourceFormik.values.hospitalName}
              onChange={dataSourceFormik.handleChange}
              onBlur={dataSourceFormik.handleBlur}
              error={
                dataSourceFormik.touched.hospitalName &&
                !!dataSourceFormik.errors.hospitalName
              }
              isImage={false}
            />
            {dataSourceFormik.touched.hospitalName &&
              dataSourceFormik.errors.hospitalName && (
                <p className={`font-normal text-xs text-red-600 pl-4 `}>
                  {dataSourceFormik.errors.hospitalName as string}
                </p>
              )}
          </div>

          <div className="mt-6 flex items-center border-t border-gray-300">
            {errorMessage && (
              <p className="text-red-600 mt-4 mr-1">{errorMessage}</p>
            )}
            <div className="ml-auto flex">
              <button
                type="button"
                className="h-10 w-auto mt-6  px-3 rounded border border-gray-300 hover:bg-gray-100 font-semibold text-base text-gray-800"
                onClick={() => setCreateDataSourceModal(false)}
              >
                {t('generate_dataSource_modal.cancel')}
              </button>
              <button
                type="submit"
                className={`mt-6 px-3 rounded border border-gray-300 ml-4 bg-[#0284C7] hover:bg-[#0270a8] font-semibold text-base text-white ${
                  isLoading
                    ? 'cursor-not-allowed pointer-events-none opacity-50'
                    : 'opacity-100'
                }`}
              >
                {isLoading ? 'Loading' : t('generate_dataSource_modal.save')}
              </button>
            </div>
          </div>
        </form>
      </>
    </Modal>
  );
}
