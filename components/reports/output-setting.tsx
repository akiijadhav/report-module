import RocSelectInput from '../forms/select-input';
import { useFormik } from 'formik';
import { ReportWorkflowStep } from './models/report-workflow-step';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import ReportFooter from './report-footer';
import useRequestUtilities from '../hooks/use-request-utilities';
import { ReportDetail } from '../reports/models/report-detail';
import { useTranslation } from 'react-i18next';
import OutputSettingTextInput from '../forms/reports/output-setting-text-input';
import OutputSettingNumberInput from '../forms/reports/output-setting-number-input';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Image from 'next/image';
import calendarIcon from '../../public/icons/calendarIcon.svg';
import moment from 'moment';
import { ValidationTestsCode } from './enums/validation-tests-code';
import SelectMarkersModal from './select-markers-modal';

export default function OutputSetting({
  reportWorkflowSteps,
  activeStep,
  setActiveStep,
  reportId,
  report,
  setReport,
}: {
  reportWorkflowSteps: ReportWorkflowStep[];
  activeStep: number;
  setActiveStep: Dispatch<SetStateAction<number>>;
  reportId: string;
  report: ReportDetail;
  setReport: Dispatch<SetStateAction<ReportDetail>>;
}) {
  const { fetchWrapper } = useRequestUtilities();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pickList, setPickList] = useState<any>({});
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [show2ChModal, setShow2ChModal] = useState(false);
  const [duplicateMarkers, setDuplicateMarkers] = useState<string[]>([]);
  const [selected2ChMarkers, setSelected2ChMarkers] = useState<string[]>([]);

  const { t } = useTranslation();

  const generatePdf = async () => {
    const requestPayload: {
      language: string;
      accuracyImOutput2chMarkerLabels?: string[];
    } = {
      language: 'en',
    };
    if (selected2ChMarkers.length > 0) {
      requestPayload.accuracyImOutput2chMarkerLabels = selected2ChMarkers;
    }
    function initiate() {
      setIsLoadingPdf(true);
    }
    async function handleResponse(response: Response) {
      if (response.ok) {
        setActiveStep((activeStep) => activeStep + 1);
      } else {
        if (response.status === 500) {
          setErrorMessage('Failed to generate report');
        } else {
          const resJson = await response.json();
          const errorMsg = resJson?.message || 'Failed to generate report';
          setErrorMessage(errorMsg);
        }
      }
    }
    function handleError(_error: any) {
      setErrorMessage('Something went wrong');
    }
    function handleFinally() {
      setIsLoadingPdf(false);
    }
    fetchWrapper({
      method: 'POST',
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/${reportId}/pdf`,
      includeAuthToken: true,

      handleResponse,
      body: requestPayload,
      handleError,
      initiate,
      handleFinally,
    });
  };

  const formSubmitHandler = (values) => {
    const engineerList = [values.engineer1];
    if (values.engineer2) {
      engineerList.push(values.engineer2);
    }
    if (values.engineer3) {
      engineerList.push(values.engineer3);
    }
    if (values.engineer4) {
      engineerList.push(values.engineer4);
    }
    if (values.engineer5) {
      engineerList.push(values.engineer5);
    }
    const dataOutputSettingList = {
      name: report?.name || '',
      hospitalName: values?.hospitalName,
      labName: values?.labName,
      startDate: moment(formik.values.startDate).format('YYYY-MM-DD'),
      endDate: moment(formik.values.endDate).format('YYYY-MM-DD'),
      department: {
        name: values?.departmentName,
        contactNumber: values?.departmentContactNumber,
        teamName: values?.teamName,
        addressLine1: values?.address1,
        addressLine2: values?.address2,
        addressLine3: values?.address3,
        faxNumber: values?.fax,
        postalCode: values?.postalCode,
      },
      engineerNames: engineerList,
    };
    function initiate() {
      setIsLoading(true);
    }
    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.ok) {
        setReport(resJson);
        generatePdf();
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
      method: 'PUT',
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/${reportId}/output-settings`,
      includeAuthToken: true,
      body: dataOutputSettingList,
      handleResponse,
      handleError,
      initiate,
      handleFinally,
    });
  };

  const validationHandler = (values) => {
    const errors: {
      contactNumber?: string;
      unit?: string;
      hospitalName?: string;
      labName?: string;
      startDate?: string;
      endDate?: string;
      departmentName?: string;
      departmentContactNumber?: string;
      address1?: string;
      address2?: string;
      address3?: string;
      fax?: string;
      postalCode?: string;
      teamName?: string;
      engineer1?: string;
      engineer2?: string;
      engineer3?: string;
      engineer4?: string;
      engineer5?: string;
    } = {};

    if (!values.hospitalName)
      errors.hospitalName = t('error.field_is_required');
    if (!values.startDate) errors.startDate = t('error.field_is_required');
    if (!values.endDate) errors.endDate = t('error.field_is_required');
    if (!values.departmentName)
      errors.departmentName = t('error.field_is_required');
    if (!values.departmentContactNumber)
      errors.departmentContactNumber = t('error.field_is_required');
    if (!values.address1) errors.address1 = t('error.field_is_required');
    if (!values.fax) errors.fax = t('error.field_is_required');
    if (!values.postalCode) errors.postalCode = t('error.field_is_required');
    if (!values.teamName) errors.teamName = t('error.field_is_required');
    if (!values.engineer1) errors.engineer1 = t('error.field_is_required');

    return errors;
  };
  const formik = useFormik({
    initialValues: {
      type: 'predefinedList',
      contactNumber: '',
      unit: '',
      hospitalName: '',
      labName: '',
      startDate: '',
      endDate: '',
      departmentName: '',
      departmentContactNumber: '',
      address1: '',
      address2: '',
      address3: '',
      fax: '',
      postalCode: '',
      teamName: '',
      engineer1: '',
      engineer2: '',
      engineer3: '',
      engineer4: '',
      engineer5: '',
    },
    validate: validationHandler,
    onSubmit: () => null,
  });

  return (
    <>
      {isLoadingPdf && (
        <div className="fixed top-0 left-0 w-screen h-screen bg-gray-700 bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full"
            role="status"
          >
            {/* <span className="visually-hidden">Loading...</span> */}
          </div>
        </div>
      )}
      <form onSubmit={formik.handleSubmit}>
        <div className="flex flex-col overflow-y-auto">
          <div className="flex flex-col p-4 border border-gray-300 h-min-screen rounded mb-4 mx-4 mt-6">
            <div className="text-gray-800 font-semibold text-2xl">
              <p>{t('output_setting.page_cover_data_title')}</p>
            </div>
            <hr className="border border-gray-200 mt-4" />
            <div className="flex flex-col mt-4">
              <p className="font-semibold text-base">
                {t('output_setting.customer_data')}
              </p>
              <div className="flex flex-row w-full my-4">
                <div>
                  <OutputSettingTextInput
                    name="hospitalName"
                    label={t('output_setting.hospital_name')}
                    className="h-12 w-[421px] pl-2 mr-4 rounded border border-gray-300 "
                    required={false}
                    value={formik.values.hospitalName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.hospitalName &&
                      !!formik.errors.hospitalName
                    }
                  />
                  {formik.touched.hospitalName &&
                    !!formik.errors.hospitalName && (
                      <p className="border-red-500 text-red-500">
                        {formik.errors.hospitalName as string}
                      </p>
                    )}
                </div>
                <div>
                  <OutputSettingTextInput
                    name="labName"
                    label={`${t('output_setting.lab_name')}(${t(
                      'output_setting.optional',
                    )})`}
                    className="h-12 w-[421px]  pl-2 rounded border border-gray-300 "
                    required={false}
                    value={formik.values.labName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.labName && !!formik.errors.labName}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col mt-4">
              <p className="font-semibold text-base">
                {t('output_setting.roche_title')}
              </p>
              <div className="flex flex-row  my-4">
                <div className="w-[421px] mr-4 relative">
                  <DatePicker
                    selected={formik.values.startDate}
                    onChange={(date) => formik.setFieldValue('startDate', date)}
                    dateFormat="dd/MM/yyyy"
                    className="h-12 w-[421px] rounded border border-gray-300 pl-2"
                    maxDate={formik.values.endDate}
                    customInput={
                      <div className="border rounded flex justify-between items-center  px-2">
                        <div className="font-muli pr-6">
                          {formik.values.startDate
                            ? moment(formik.values.startDate).format(
                                'DD/MM/YYYY',
                              )
                            : ''}
                        </div>
                        <div>
                          <Image
                            src={calendarIcon}
                            alt=""
                            width={13}
                            height={13}
                            className="mr-4 absolute top-4 left-96"
                          />
                        </div>
                      </div>
                    }
                  />

                  <label
                    className={`font-normal text-base leading-6 text-gray-600 absolute top-3 left-12 pointer-events-none origin-top-left transition-all duration-200 group-focus-within:shrunk-label ${
                      formik.values.startDate ? 'shrunk-label' : ''
                    } ${
                      formik.touched.startDate &&
                      formik.errors.startDate &&
                      'text-red-500'
                    }`}
                  >
                    {t('output_setting.start_date')}
                  </label>
                  {formik.touched.startDate && !!formik.errors.startDate && (
                    <p className="border-red-500 text-red-500">
                      {formik.errors.startDate as string}
                    </p>
                  )}
                </div>
                <div className="w-[421px]  relative">
                  <DatePicker
                    selected={formik.values.endDate}
                    onChange={(date) => formik.setFieldValue('endDate', date)}
                    dateFormat="dd/MM/yyyy"
                    className="h-12 w-[421px] rounded border border-gray-300 pl-2"
                    startDate={formik.values.startDate}
                    endDate={formik.values.endDate}
                    minDate={formik.values.startDate}
                    customInput={
                      <div className="border rounded flex justify-between items-center  px-2">
                        <div className="font-muli pr-6">
                          {formik.values.endDate
                            ? moment(formik.values.endDate).format('DD/MM/YYYY')
                            : ''}
                        </div>
                        <div>
                          <Image
                            src={calendarIcon}
                            alt=""
                            width={13}
                            height={13}
                            className="mr-4 absolute top-4 left-96"
                          />
                        </div>
                      </div>
                    }
                  />

                  <label
                    className={`font-normal text-base leading-6 text-gray-600 absolute top-3 left-12 pointer-events-none origin-top-left transition-all duration-200 group-focus-within:shrunk-label ${
                      formik.values.endDate ? 'shrunk-label' : ''
                    } ${
                      formik.touched.endDate &&
                      formik.errors.endDate &&
                      'text-red-500'
                    }`}
                  >
                    {t('output_setting.end_date')}
                  </label>
                  {formik.touched.endDate && !!formik.errors.endDate && (
                    <p className="border-red-500 text-red-500">
                      {formik.errors.endDate as string}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col mt-4">
              <p className="font-semibold text-base">
                {t('output_setting.department_title')}
              </p>
              <div className="flex flex-row w-full my-4">
                <div>
                  <OutputSettingTextInput
                    name="departmentName"
                    label={`${t('output_setting.department_name')}`}
                    className="h-12 w-[421px] mr-4 rounded border border-gray-300 pl-2"
                    required={true}
                    value={formik.values.departmentName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.departmentName &&
                      !!formik.errors.departmentName
                    }
                  />
                  {formik.touched.departmentName &&
                    !!formik.errors.departmentName && (
                      <p className="border-red-500 text-red-500">
                        {formik.errors.departmentName as string}
                      </p>
                    )}
                </div>
                <div>
                  <OutputSettingTextInput
                    name="postalCode"
                    label={`${t('output_setting.postal_code')}`}
                    className="h-12 w-[421px]  rounded border border-gray-300 pl-2"
                    required={true}
                    value={formik.values.postalCode}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.postalCode && !!formik.errors.postalCode
                    }
                  />
                  {formik.touched.postalCode && !!formik.errors.postalCode && (
                    <p className="border-red-500 text-red-500">
                      {formik.errors.postalCode as string}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <OutputSettingTextInput
                  name="address1"
                  label={`${t('output_setting.address_line_1')}`}
                  className="h-12 w-[858px]  rounded border border-gray-300 mb-4 pl-2"
                  required={true}
                  value={formik.values.address1}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.address1 && !!formik.errors.address1}
                />
                {formik.touched.address1 && !!formik.errors.address1 && (
                  <p className="border-red-500 text-red-500">
                    {formik.errors.address1 as string}
                  </p>
                )}
              </div>
              <div>
                <OutputSettingTextInput
                  name="address2"
                  label={`${t('output_setting.address_line_2')}`}
                  className="h-12 w-[858px]   rounded border border-gray-300 mb-4 pl-2"
                  required={true}
                  value={formik.values.address2}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.address2 && !!formik.errors.address2}
                />
                {formik.touched.address2 && !!formik.errors.address2 && (
                  <p className="border-red-500 text-red-500">
                    {formik.errors.address2 as string}
                  </p>
                )}
              </div>
              <div>
                <OutputSettingTextInput
                  name="address3"
                  label={`${t('output_setting.address_line_3')}`}
                  className="h-12 w-[858px]  rounded border border-gray-300 pl-2"
                  required={true}
                  value={formik.values.address3}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.address3 && !!formik.errors.address3}
                />
                {formik.touched.address3 && !!formik.errors.address3 && (
                  <p className="border-red-500 text-red-500">
                    {formik.errors.address3 as string}
                  </p>
                )}
              </div>

              <div className="flex flex-row w-full my-4">
                <div>
                  <OutputSettingNumberInput
                    name="departmentContactNumber"
                    label={`${t('output_setting.department_contact_number')}`}
                    className="h-12 w-[421px] mr-4 rounded border border-gray-300 pl-2"
                    required={true}
                    value={formik.values.departmentContactNumber}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.departmentContactNumber &&
                      !!formik.errors.departmentContactNumber
                    }
                  />
                  {formik.touched.departmentContactNumber &&
                    !!formik.errors.departmentContactNumber && (
                      <p className="border-red-500 text-red-500">
                        {formik.errors.departmentContactNumber as string}
                      </p>
                    )}
                </div>{' '}
                <div>
                  <OutputSettingTextInput
                    name="fax"
                    label={`${t('output_setting.fax')}`}
                    className="h-12 w-[421px]  rounded border border-gray-300 pl-2"
                    required={true}
                    value={formik.values.fax}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.fax && !!formik.errors.fax}
                  />
                  {formik.touched.fax && !!formik.errors.fax && (
                    <p className="border-red-500 text-red-500">
                      {formik.errors.fax as string}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col mt-4">
              <p className="font-semibold text-base">
                {t('output_setting.engineer_title')}
              </p>
              <div className="flex flex-row w-full my-4">
                <div>
                  <OutputSettingTextInput
                    name="engineer1"
                    label={`${t('output_setting.engineer_name')}`}
                    className="h-12 w-[421px] mr-4 rounded border border-gray-300 pl-2"
                    required={false}
                    value={formik.values.engineer1}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.engineer1 && !!formik.errors.engineer1
                    }
                  />
                  {formik.touched.engineer1 && !!formik.errors.engineer1 && (
                    <p className="border-red-500 text-red-500">
                      {formik.errors.engineer1 as string}
                    </p>
                  )}
                </div>
                <OutputSettingTextInput
                  name="engineer2"
                  label={`${t('output_setting.engineer_name')} ${t(
                    'output_setting.optional',
                  )}`}
                  className="h-12 w-[421px]  rounded border border-gray-300 pl-2"
                  required={false}
                  value={formik.values.engineer2}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.engineer2 && !!formik.errors.engineer2}
                />
              </div>

              <div className="flex flex-row w-full my-4">
                <OutputSettingTextInput
                  name="engineer3"
                  label={`${t('output_setting.engineer_name')} ${t(
                    'output_setting.optional',
                  )}`}
                  className="h-12 w-[421px] mr-4 rounded border border-gray-300 pl-2"
                  required={false}
                  value={formik.values.engineer3}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.engineer3 && !!formik.errors.engineer3}
                />
                <OutputSettingTextInput
                  name="engineer4"
                  label={`${t('output_setting.engineer_name')} ${t(
                    'output_setting.optional',
                  )}`}
                  className="h-12 w-[421px] rounded border border-gray-300 pl-2"
                  required={false}
                  value={formik.values.engineer4}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.engineer4 && !!formik.errors.engineer4}
                />
              </div>
              <div className="flex flex-row w-full my-4">
                <OutputSettingTextInput
                  name="engineer5"
                  label={`${t('output_setting.engineer_name')} ${t(
                    'output_setting.optional',
                  )}`}
                  className="h-12 w-[421px] rounded border border-gray-300 pl-2"
                  required={false}
                  value={formik.values.engineer5}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.engineer5 && !!formik.errors.engineer5}
                />
              </div>
            </div>
            <div className="flex flex-col mt-4">
              <p className="font-semibold text-base">
                {t('output_setting.team_title')}
              </p>
              <div className="flex flex-row w-full my-4">
                <div>
                  <OutputSettingTextInput
                    name="teamName"
                    label={`${t('output_setting.team_name')}`}
                    className="h-12 w-[421px]  rounded border border-gray-300 pl-2"
                    required={true}
                    value={formik.values.teamName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.teamName && !!formik.errors.teamName}
                  />
                  {formik.touched.teamName && !!formik.errors.teamName && (
                    <p className="border-red-500 text-red-500">
                      {formik.errors.teamName as string}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {errorMessage && <p className="text-red-600 ml-4">{errorMessage} </p>}
        <ReportFooter
          reportWorkflowSteps={reportWorkflowSteps}
          handleSubmit={() => {
            if (formik.isValid && formik.dirty) {
              const markerLabels = report.testDataInput.items
                ?.filter(
                  (item) =>
                    report.conditionalInputData?.items
                      ?.filter(
                        (conditionalInputItem) =>
                          conditionalInputItem?.acn === item?.acn,
                      )
                      ?.at(0)?.category === 'IM' &&
                    (!!item?.accuracy?.calibrationResultsDataInput?.s1?.values?.at(
                      0,
                    ) ||
                      item?.accuracy?.calibrationResultsDataInput?.s1?.values?.at(
                        0,
                      ) === 0),
                )
                ?.map((item) => item.markerLabel);
              const alreadySeenMarkers = {};
              const duplicateMarkersLocal = [];

              markerLabels?.forEach((marker) => {
                if (
                  alreadySeenMarkers[marker] &&
                  !duplicateMarkersLocal.includes(marker)
                ) {
                  duplicateMarkersLocal.push(marker);
                } else {
                  alreadySeenMarkers[marker] = true;
                }
              });
              if (
                report?.validationTests?.includes(
                  ValidationTestsCode.Accuracy,
                ) &&
                duplicateMarkersLocal.length > 0
              ) {
                setDuplicateMarkers(duplicateMarkersLocal);
                setShow2ChModal(true);
              } else {
                formSubmitHandler(formik.values);
              }
            } else {
              const fieldsToTouch = {};
              Object.keys(formik.initialValues).forEach((field) => {
                fieldsToTouch[field] = true;
              });
              formik.setTouched(fieldsToTouch);
            }
          }}
          isLoading={isLoading}
          activeStep={activeStep}
          handlePrevious={() => setActiveStep((activeStep) => activeStep - 1)}
        />
      </form>
      {show2ChModal && (
        <SelectMarkersModal
          show={show2ChModal}
          setShow={setShow2ChModal}
          duplicateMarkers={duplicateMarkers}
          selected2ChMarkers={selected2ChMarkers}
          setSelected2ChMarkers={setSelected2ChMarkers}
          translator={t}
          formSubmitHandler={formSubmitHandler}
          formValues={formik.values}
        />
      )}
    </>
  );
}
