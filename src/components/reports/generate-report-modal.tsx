import { Dispatch, SetStateAction, useState } from 'react';
import Modal from '../ui/modal';
import { useFormik } from 'formik';
import axios from 'axios';
import { useRouter } from 'next/router';
import useRequestUtilities from '../hooks/use-request-utilities';

export default function GenerateReportModal({
  setGenerateReportModal,
}: {
  setGenerateReportModal: Dispatch<SetStateAction<boolean>>;
}) {
  const { fetchWrapper } = useRequestUtilities();
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(true);
  const router = useRouter();
  const validationHandler = ({ reportName }: { reportName: string }) => {
    const errors: { reportName?: string } = {};
    if (reportName === '') {
      errors.reportName = 'Please enter report name';
    }
  };
  const submitHandler = async (values) => {
    function initiate() {
      setIsLoading(true);
    }
    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.ok) {
        router.push(`old-reports/${resJson.id}`);
      } else {
        setErrorMessage(resJson?.message || 'Something went wrong');
      }
    }
    function handleError(_error: any) {
      setErrorMessage('Something went wrong');
    }
    function handleFinally() {
      setIsLoading(false);
    }

    fetchWrapper({
      method: 'POST',
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports`,

      includeAuthToken: true,
      body: {
        name: values.reportName,
      },

      handleResponse,
      handleError,
      initiate,
      handleFinally,
    });
  };

  const formik = useFormik({
    initialValues: {
      reportName: '',
    },
    validate: validationHandler,
    onSubmit: submitHandler,
  });
  return (
    <Modal open={open} setOpen={setOpen}>
      <>
        <form onSubmit={formik.handleSubmit}>
          <div className="flex flex-col ">
            <p className="font-semibold text-xl text-gray-800">
              Generate Report
            </p>
            <div className="border-y border-gray-300 py-8">
              <div className="group">
                <input
                  type="text"
                  className="border border-gray-300 rounded h-12 w-[501px]  pl-3 outline-none"
                  name="reportName"
                  value={formik.values.reportName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  autoComplete="off"
                />
                <label
                  className={`font-normal text-base leading-6 text-gray-600 absolute top-[96px] left-16 pointer-events-none origin-top-left transition-all duration-200 group-focus-within:shrunk-label ${
                    formik.values.reportName ? 'shrunk-label left-16 ' : ''
                  } ${
                    formik.touched.reportName && formik.errors.reportName
                      ? 'text-red-500'
                      : ''
                  }`}
                >
                  Report Name
                </label>
                {formik.errors.reportName && (
                  <p className="text-red-600">
                    {formik.errors.reportName as string}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center">
              {errorMessage && (
                <p className="text-red-600 mt-4 mr-1">{errorMessage}</p>
              )}
              <div className="ml-auto flex">
                <button
                  type="button"
                  className="h-10 w-20 mt-6 rounded border border-gray-300 hover:bg-gray-100 font-semibold text-base text-gray-800"
                  onClick={() => setGenerateReportModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`h-10 w-20 mt-6 rounded border border-gray-300 ml-8 bg-[#0284C7] hover:bg-[#0270a8] font-semibold text-base text-white ${
                    isLoading
                      ? 'cursor-not-allowed pointer-events-none opacity-50'
                      : 'opacity-100'
                  }`}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </form>
      </>
    </Modal>
  );
}
