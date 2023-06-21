import { useFormik } from 'formik';
import Image from 'next/image';
import React, { Dispatch, SetStateAction, useState } from 'react';
import uploadFileIcon from '../../public/icons/upload-file.svg';
import useRequestUtilities from '../hooks/use-request-utilities';
import { ReportDetail } from './models/report-detail';
import { ReportWorkflowStep } from './models/report-workflow-step';
import ReportFooter from './report-footer';
import { useTranslation } from 'react-i18next';

export default function InputDataSelector(props: {
  reportId: string;
  reportWorkflowSteps: ReportWorkflowStep[];
  activeStep: number;
  setActiveStep: Dispatch<SetStateAction<number>>;
  report: ReportDetail;
  setReport: Dispatch<SetStateAction<ReportDetail>>;
}) {
  const {
    reportId,
    activeStep,
    setActiveStep,
    reportWorkflowSteps,
    report,
    setReport,
  } = props;
  const [isCsvOptionSelected, setIsCsvOptionSelected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [responseError, setResponseError] = useState('');
  const { fetchWrapper } = useRequestUtilities();
  const { t } = useTranslation();

  const uploadCsvFile = function (file: File) {
    if (report?.inputFile?.name && !file && formik.isValid) {
      setActiveStep((activeStep) => activeStep + 1);
      return;
    }

    if (!formik.isValid || !formik.dirty) {
      formik.setFieldTouched('fileCsv', true, true);
      return;
    }

    function initiate() {
      setIsLoading(true);
    }
    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.ok) {
        setReport(resJson);
        setActiveStep((activeStep) => activeStep + 1);
      } else {
        if (response.status === 500) {
          setResponseError(t('error.something_went_wrong'));
        } else {
          setResponseError(
            resJson?.message ||
              `Error ${response.status}: ${response.statusText}`,
          );
        }
      }
    }
    function handleError(_error: any) {
      setResponseError(t('error.something_went_wrong'));
    }
    function handleFinally() {
      setIsLoading(false);
    }

    const formData = new FormData();
    formData.append('file', file);

    fetchWrapper({
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/${reportId}/instrument-data/import`,
      method: 'POST',
      body: formData,
      includeAuthToken: true,
      initiate,
      handleResponse,
      handleError,
      handleFinally,
    });
  };

  const formik = useFormik({
    initialValues: {
      fileCsv: null,
    },
    validate: ({ fileCsv }) => {
      const errors: {
        fileCsv?: string;
      } = {};
      if (!fileCsv) {
        errors.fileCsv = 'No file selected';
      }
      if (fileCsv && fileCsv?.type !== 'text/csv') {
        errors.fileCsv =
          'File format not supported. Please upload in CSV format.';
      }
      return errors;
    },
    onSubmit: () => null,
  });

  return (
    <>
      <div className="min-h-[calc(100vh_-_12.6rem)] flex">
        <aside className="p-4 min-w-max border-r border-gray-200 space-y-4 font-normal text-gray-600 text-lg leading-[25px]">
          <div className="flex gap-2 items-center">
            <input
              type="radio"
              id="radio-csv"
              name="input-method"
              value="csv"
              defaultChecked={isCsvOptionSelected}
              onClick={() => setIsCsvOptionSelected(true)}
              className="w-5 h-5 cursor-pointer"
            />
            <label
              htmlFor="radio-csv"
              className={`${
                isCsvOptionSelected && 'text-light-blue-600'
              } cursor-pointer`}
            >
              {t('report_edit.upload_csv_file')}
            </label>
          </div>
          <div className="flex gap-2 items-center">
            <input
              disabled={true}
              type="radio"
              id="radio-manual"
              name="input-method"
              value="manual"
              defaultChecked={!isCsvOptionSelected}
              onClick={() => setIsCsvOptionSelected(false)}
              className="w-5 h-5 cursor-pointer"
            />
            <label
              htmlFor="radio-manual"
              className={`${
                !isCsvOptionSelected && 'text-light-blue-600'
              } cursor-pointer`}
            >
              {t('report_edit.enter_manually')}
            </label>
          </div>
        </aside>
        {isCsvOptionSelected && (
          <section className="w-full bg-white p-6">
            <input
              type="file"
              id="fileCsv"
              name="fileCsv"
              onChange={(event) =>
                formik.setFieldValue('fileCsv', event.target.files[0])
              }
              onBlur={formik.handleBlur}
              hidden
            />
            <label
              htmlFor="fileCsv"
              onClick={() => formik.setFieldTouched('fileCsv', true)}
              className="bg-gray-50 cursor-pointer py-12 border border-dashed border-gray-200 rounded-lg text-center flex flex-col gap-2 items-center"
            >
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 flex items-center justify-center">
                  <Image src={uploadFileIcon} alt="" />
                </div>
                <p className="font-medium text-gray-800">
                  {formik.isValid && formik.touched.fileCsv ? (
                    formik.values.fileCsv?.name
                  ) : report?.inputFile?.name && !formik.touched.fileCsv ? (
                    'You have already uploaded a CSV file'
                  ) : (
                    <div className="flex flex-col">
                      <p>{t('report_edit.csv_upload')}</p>
                    </div>
                  )}
                </p>
              </div>
              <p className="font-normal text-sm leading-8 text-gray-400">
                {formik.isValid && formik.touched.fileCsv
                  ? 'Reselect file'
                  : report?.inputFile?.name && !formik.touched.fileCsv
                  ? 'Reselect file'
                  : `${t('report_edit.csv_format')}`}
              </p>
            </label>
            {formik.touched.fileCsv && formik.errors.fileCsv && (
              <p className="mt-4 font-normal text-base text-red-500">
                {String(formik.errors.fileCsv)}
              </p>
            )}
            {!!responseError && (
              <p className="mt-4 font-normal text-base text-red-500">
                {responseError}
              </p>
            )}
          </section>
        )}
      </div>
      <ReportFooter
        activeStep={activeStep}
        reportWorkflowSteps={reportWorkflowSteps}
        handleSubmit={() => uploadCsvFile(formik.values.fileCsv)}
        isLoading={isLoading}
        handlePrevious={() => setActiveStep((activeStep) => activeStep - 1)}
      />
    </>
  );
}
