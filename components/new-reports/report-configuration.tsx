import RocSelectInput from '../forms/select-input';
import { useFormik } from 'formik';
import { ReportWorkflowStep } from './models/new-report-workflow-step';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import useRequestUtilities from '../hooks/use-request-utilities';
import { useTranslation } from 'react-i18next';
import OutputSettingTextInput from '../forms/reports/output-setting-text-input';
import OutputSettingNumberInput from '../forms/reports/output-setting-number-input';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Image from 'next/image';
import calendarIcon from '../../public/icons/calendarIcon.svg';
import moment from 'moment';
import { NewReportDetail } from './models/new-report-detail';
import ReportFooter from './report-footer';
import { ReportDetail } from './models/report-details';
import TextInput from '../forms/text-input-without-image';

export default function ReportConfiguration(props: {
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
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  const { t } = useTranslation();

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
    const reportConfiguration = {
      name: values.reportName,
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
      },
      engineers: engineerList,
    };
    props.setReport({ ...props.report, ...reportConfiguration });
    props.setReport((reportLocal) => {
      return {
        ...reportLocal,
        ...reportConfiguration,
      };
    });
    props.setActiveStep((activeStep) => activeStep + 1);
  };

  const validationHandler = (values) => {
    const errors: {
      reportName?: string;
      startDate?: string;
      endDate?: string;
      departmentName?: string;
      departmentContactNumber?: string;
      address1?: string;
      address2?: string;
      address3?: string;
      teamName?: string;
      engineer1?: string;
      engineer2?: string;
      engineer3?: string;
      engineer4?: string;
      engineer5?: string;
      fax?: string;
    } = {};

    if (!values.startDate) errors.startDate = t('error.start_date');
    if (!values.endDate) errors.endDate = t('error.end_date');
    if (!values.departmentName)
      errors.departmentName = t('error.department_name');
    if (values.departmentName && values.departmentName.length > 200)
      errors.departmentName = t('error.max_length_department_name');
    if (!values.departmentContactNumber)
      errors.departmentContactNumber = t('error.department_contact_number');
    if (
      values.departmentContactNumber &&
      values.departmentContactNumber.length > 20
    )
      errors.departmentContactNumber = t('error.max_length_contact_number');
    if (!values.address1) errors.address1 = t('error.address_line_1');
    if (values.address1 && values.address1.length > 200)
      errors.address1 = t('error.max_length_address_line_1');
    if (values.address2 && values.address2.length > 200)
      errors.address2 = t('error.max_length_address_line_2');
    if (values.address3 && values.address3.length > 200)
      errors.address3 = t('error.max_length_address_line_3');
    // if (!values.fax) errors.fax = 'This Field is required';
    if (!values.teamName) errors.teamName = t('error.team_name');
    if (values.teamName && values.teamName.length > 200)
      errors.teamName = t('error.max_length_report_name');
    if (!values.engineer1) errors.engineer1 = t('error.engineer_1');
    if (values.engineer1 && values.engineer1.length > 100)
      errors.engineer1 = t('error.max_length_engineer_name');
    if (!values.reportName) errors.reportName = t('error.report_name_required');
    if (values.reportName && values.reportName.length > 200)
      errors.reportName = t('error.max_length_report_name');
    if (values.fax && values.fax.length > 200)
      errors.fax = t('error.max_length_fax');

    return errors;
  };
  const formik = useFormik({
    initialValues: {
      reportName: props.report?.name ? props.report.name : '',
      startDate: props.report?.startDate
        ? moment(props.report.startDate).toDate()
        : '',
      endDate: props.report?.endDate
        ? moment(props.report.endDate).toDate()
        : '',
      departmentName: props.report?.department?.name
        ? props.report.department.name
        : '',
      departmentContactNumber: props.report?.department?.contactNumber
        ? props.report.department.contactNumber
        : '',
      address1: props.report?.department?.addressLine1
        ? props.report.department.addressLine1
        : '',
      address2: props.report?.department?.addressLine2
        ? props.report.department.addressLine2
        : '',
      address3: props.report?.department?.addressLine3
        ? props.report.department.addressLine3
        : '',
      teamName: props.report?.department?.teamName
        ? props.report.department.teamName
        : '',
      engineer1: props.report?.engineers[0] ? props.report.engineers[0] : '',
      engineer2: props.report?.engineers[1] ? props.report.engineers[1] : '',
      engineer3: props.report?.engineers[2] ? props.report.engineers[2] : '',
      engineer4: props.report?.engineers[3] ? props.report.engineers[3] : '',
      engineer5: props.report?.engineers[4] ? props.report.engineers[4] : '',
      fax: props.report?.department?.faxNumber
        ? props.report.department.faxNumber
        : '',
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
          ></div>
        </div>
      )}
      <form onSubmit={formik.handleSubmit}>
        <div className="flex flex-col overflow-y-auto">
          <div className="flex flex-col border border-gray-300 rounded mx-4 mt-6 p-4">
            <div className="text-gray-800 font-semibold text-2xl mb-8">
              <p>{t('report_configuration.generate_report')}</p>
            </div>
            <div>
              <TextInput
                name="reportName"
                label={t('report_configuration.report_name')}
                className="h-12 w-[421px] pl-2 mr-4 rounded border border-gray-300 "
                required={false}
                value={formik.values.reportName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.reportName && !!formik.errors.reportName}
              />
              {formik.touched.reportName && !!formik.errors.reportName && (
                <p className="border-red-500 text-red-500">
                  {formik.errors.reportName as string}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col p-4 border border-gray-300 h-min-screen rounded mb-4 mx-4 mt-6">
            <div className="text-gray-800 font-semibold text-2xl">
              <p>{t('report_configuration.page_cover_data_title')}</p>
            </div>
            <hr className="border border-gray-200 mt-4" />
            <div className="flex flex-col mt-4">
              <p className="font-semibold text-base">
                {t('report_configuration.date')}
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
                      <div className="border rounded flex justify-between items-center px-2">
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
                    className={`font-normal text-base leading-6 text-gray-400 absolute top-3 left-4 pointer-events-none origin-top-left transition-all duration-200 group-focus-within:shrunk-label-without-image group-focus-within:text-gray-600 ${
                      formik.values.startDate
                        ? 'shrunk-label-without-image text-gray-600'
                        : ''
                    } ${
                      formik.touched.startDate &&
                      formik.errors.startDate &&
                      'text-red-500'
                    }`}
                  >
                    {t('report_configuration.start_date')}
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
                    className={`font-normal text-base leading-6 text-gray-400 absolute top-3 left-4 pointer-events-none origin-top-left transition-all duration-200 group-focus-within:shrunk-label-without-image group-focus-within:text-gray-600 ${
                      formik.values.endDate
                        ? 'shrunk-label-without-image text-gray-600'
                        : ''
                    } ${
                      formik.touched.endDate &&
                      formik.errors.endDate &&
                      'text-red-500'
                    }`}
                  >
                    {t('report_configuration.end_date')}
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
                {t('report_configuration.department_title')}
              </p>
              <div className="flex flex-row w-full my-4">
                <div>
                  <TextInput
                    name="departmentName"
                    label={`${t('report_configuration.department_name')}`}
                    className="h-12 w-[421px] mr-4 rounded border border-gray-300 pl-2"
                    required={false}
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
                  <TextInput
                    name="teamName"
                    label={`${t('report_configuration.team_name')}`}
                    className="h-12 w-[421px]  rounded border border-gray-300 pl-2"
                    required={false}
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
              <div>
                <TextInput
                  name="address1"
                  label={`${t('report_configuration.address_line_1')}`}
                  className="h-12 w-[858px]  rounded border border-gray-300 mb-4 pl-2"
                  required={false}
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
                <TextInput
                  name="address2"
                  label={`${t('report_configuration.address_line_2')}`}
                  className="h-12 w-[858px]   rounded border border-gray-300 mb-4 pl-2"
                  required={false}
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
                <TextInput
                  name="address3"
                  label={`${t('report_configuration.address_line_3')}`}
                  className="h-12 w-[858px]  rounded border border-gray-300 pl-2"
                  required={false}
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
                  <TextInput
                    name="departmentContactNumber"
                    label={`${t(
                      'report_configuration.department_contact_number',
                    )}`}
                    className="h-12 w-[421px] mr-4 rounded border border-gray-300 pl-2"
                    required={false}
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
                  <TextInput
                    name="fax"
                    label={`${t('report_configuration.fax')}`}
                    className="h-12 w-[421px]  rounded border border-gray-300 pl-2"
                    required={false}
                    value={formik.values.fax}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.fax && !!formik.errors.fax}
                  />
                  {/* {formik.touched.fax && !!formik.errors.fax && (
                    <p className="border-red-500 text-red-500">
                      {formik.errors.fax as string}
                    </p>
                  )} */}
                </div>
              </div>
            </div>
            <div className="flex flex-col mt-4">
              <p className="font-semibold text-base">
                {t('report_configuration.engineer_title')}
              </p>
              <div className="flex flex-row w-full my-4">
                <div>
                  <TextInput
                    name="engineer1"
                    label={`${t('report_configuration.engineer_name')}`}
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
                <TextInput
                  name="engineer2"
                  label={`${t('report_configuration.engineer_name')} (${t(
                    'report_configuration.optional',
                  )})`}
                  className="h-12 w-[421px]  rounded border border-gray-300 pl-2"
                  required={false}
                  value={formik.values.engineer2}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.engineer2 && !!formik.errors.engineer2}
                />
              </div>

              <div className="flex flex-row w-full my-4">
                <TextInput
                  name="engineer3"
                  label={`${t('report_configuration.engineer_name')} (${t(
                    'report_configuration.optional',
                  )})`}
                  className="h-12 w-[421px] mr-4 rounded border border-gray-300 pl-2"
                  required={false}
                  value={formik.values.engineer3}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.engineer3 && !!formik.errors.engineer3}
                />
                <TextInput
                  name="engineer4"
                  label={`${t('report_configuration.engineer_name')} (${t(
                    'report_configuration.optional',
                  )})`}
                  className="h-12 w-[421px] rounded border border-gray-300 pl-2"
                  required={false}
                  value={formik.values.engineer4}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.engineer4 && !!formik.errors.engineer4}
                />
              </div>
              <div className="flex flex-row w-full my-4">
                <TextInput
                  name="engineer5"
                  label={`${t('report_configuration.engineer_name')} (${t(
                    'report_configuration.optional',
                  )})`}
                  className="h-12 w-[421px] rounded border border-gray-300 pl-2"
                  required={false}
                  value={formik.values.engineer5}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.engineer5 && !!formik.errors.engineer5}
                />
              </div>
            </div>
          </div>
        </div>
        {errorMessage && <p className="text-red-600 ml-4">{errorMessage} </p>}
        <ReportFooter
          reportWorkflowSteps={props.reportWorkflowSteps}
          handleSubmit={() => {
            if (formik.isValid) {
              formSubmitHandler(formik.values);
            } else {
              const fieldsToTouch = {};
              Object.keys(formik.initialValues).forEach((field) => {
                fieldsToTouch[field] = true;
              });
              formik.setTouched(fieldsToTouch);
            }
          }}
          isLoading={isLoading}
          activeStep={props.activeStep}
          handlePrevious={() =>
            props.setActiveStep((activeStep) => activeStep - 1)
          }
          report={props.report}
        />
      </form>
    </>
  );
}
