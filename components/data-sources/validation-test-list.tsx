import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import useRequestUtilities from '../hooks/use-request-utilities';
import EditReportSkeleton from '../loading/edit-report-skeleton';
import { DataSourcetWorkflowStep } from './models/data-source-workflow';
import { ValidationTestViewModel } from './models/validation-test-view-model';
import DataSourceFooter from './data-source-footer';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import { DataSourceDetail } from './models/data-source-detail';
import TextInput from '../forms/text-input-without-image';

export default function ValidationTestList(props: {
  dataSourceWorkflowSteps: DataSourcetWorkflowStep[];
  activeStep: number;
  setActiveStep: Dispatch<SetStateAction<number>>;
  DataSourceId: string;
  dataSource: DataSourceDetail;
  setDataSource: Dispatch<SetStateAction<DataSourceDetail>>;
  readOnly: boolean;
}) {
  const { fetchWrapper } = useRequestUtilities();
  type viewScreenType = 'loading' | 'set';
  const [viewScreen, setViewScreen] = useState<viewScreenType>('loading');
  const [validationList, setValidationList] = useState<
    ValidationTestViewModel[]
  >([]);
  const selectedTestsList = useMemo(
    () => validationList.filter((validationTest) => validationTest.selected),
    [validationList],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectAll, setSelectAll] = useState<boolean | null>(null);

  const { t } = useTranslation();
  const router = useRouter();

  const validationHandler = (values) => {
    const {
      dataSourceName,
      hospitalName,
      labName,
      instrumentName,
      unitForInstrument,
    } = values;

    const errors: {
      dataSourceName?: string;
      hospitalName?: string;
      labName?: string;
      instrumentName?: string;
      unitForInstrument?: string;
    } = {};

    if (!dataSourceName) {
      errors.dataSourceName = t('error.enter_data_source_name');
    } else if (dataSourceName && dataSourceName.length > 200) {
      errors.dataSourceName = t('error.max_length_data_source_name');
    }

    if (!hospitalName) {
      errors.hospitalName = t('error.enter_hospital_name');
    } else if (hospitalName && hospitalName.length > 200) {
      errors.hospitalName = t('error.max_length_hospital_name');
    }

    if (labName && labName.length > 200) {
      errors.labName = t('error.max_length_lab_name');
    }

    if (!instrumentName) {
      errors.instrumentName = t('error.enter_instrument_name');
    } else if (instrumentName && instrumentName.length > 100) {
      errors.instrumentName = t('error.max_length_instrument_name');
    }

    if (!unitForInstrument) {
      errors.unitForInstrument = t('error.enter_unit_instrument');
    } else if (unitForInstrument && unitForInstrument.length > 20) {
      errors.unitForInstrument = t('error.max_length_unit_instrument');
    }

    return errors;
  };

  const formik = useFormik({
    initialValues: {
      dataSourceName: props.dataSource?.name || '',
      hospitalName: props.dataSource?.hospitalName || '',
      labName: props.dataSource?.labName || '',
      instrumentName: props.dataSource?.instrumentName || '',
      unitForInstrument: props.dataSource?.unitOfInstrument || '',
    },
    enableReinitialize: true,
    validate: validationHandler,
    onSubmit: () => null,
  });

  async function getValidationList() {
    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.ok) {
        const validationViewList = resJson.map((item) => {
          return {
            ...item,
            selected: Boolean(
              props.dataSource?.validationTests?.includes(item?.code),
            ),
          };
        });
        setValidationList(validationViewList);
      } else {
        setErrorMessage(resJson?.message || t('error.something_went_wrong'));
      }
    }
    function handleError(_error: any) {
      setErrorMessage(t('error.something_went_wrong'));
    }
    function handleFinally() {
      setViewScreen('set');
    }

    fetchWrapper({
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/validationtests?language=${router.locale}`,
      includeAuthToken: true,
      handleResponse,
      handleError,
      handleFinally,
    });
  }

  const checkAllSelected = (e) => {
    const checked = e.target.checked;

    setSelectAll(checked);
    setValidationList((previous) =>
      previous.map((data) => ({ ...data, selected: checked })),
    );
  };

  const handleCheckbox = (item: ValidationTestViewModel) => {
    setValidationList((previous) => {
      return previous.map((data) => {
        if (data.id === item.id) {
          return {
            ...data,
            selected: !data.selected,
          };
        } else {
          return data;
        }
      });
    });
  };

  useEffect(() => {
    setErrorMessage('');
  }, [selectedTestsList]);

  useEffect(() => {
    const allSelected =
      validationList.length > 0 &&
      validationList.every((item) => item.selected === true);

    if (allSelected) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [validationList]);

  useEffect(() => {
    if (!formik?.validateForm) return;
    formik.validateForm();
  }, [formik?.validateForm]);

  useEffect(() => {
    getValidationList();
  }, [router.locale]);

  const validationTest = (selectedValidationTestList) => {
    if (selectedValidationTestList.length === 0) {
      return false;
    } else {
      return true;
    }
  };

  const handleSubmit = async (
    saveDraft = false,
    handleDraftSuccess?: () => void,
    handleDraftFailure?: () => void,
    initiateDraft?: () => void,
  ) => {
    setErrorMessage('');
    const selectedValidationTestList = validationList
      .filter((item) => item.selected)
      .map((item) => item.code);

    function initiate() {
      if (saveDraft) {
        initiateDraft();
      } else {
        setIsLoading(true);
      }
    }
    async function handleResponse(response: Response) {
      if (response.ok) {
        if (saveDraft && handleDraftSuccess) {
          handleDraftSuccess();
        } else {
          props.setActiveStep((activeStep) => activeStep + 1);
        }
      } else {
        if (saveDraft) {
          handleDraftFailure();
        } else {
          const resJson = await response.json();
          setErrorMessage(resJson?.message || t('error.something_went_wrong'));
        }
      }
    }
    function handleError(_error: any) {
      if (saveDraft) {
        handleDraftFailure();
      } else {
        setErrorMessage(t('error.something_went_wrong'));
      }
    }
    function handleFinally() {
      setIsLoading(false);
    }

    fetchWrapper({
      method: 'PUT',
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/datasources/${props.DataSourceId}`,
      includeAuthToken: true,
      body: {
        name: formik.values.dataSourceName || '',
        hospitalName: formik.values.hospitalName || '',
        labName: formik.values.labName,
        instrument: formik.values.instrumentName,
        unitOfInstrument: formik.values.unitForInstrument,
        validationTests: selectedValidationTestList,
        dataSets: props.dataSource?.dataSets || [],
      },
      handleResponse,
      handleError,
      initiate,
      handleFinally,
    });
  };

  if (viewScreen === 'loading') {
    return <EditReportSkeleton />;
  }

  return (
    <>
      <div className="flex flex-col p-4 border border-gray-300 h-min-screen rounded mb-4 mx-4 mt-6">
        <div className="flex flex-col">
          <form onSubmit={formik.handleSubmit}>
            <div className="flex flex-row w-full my-4">
              <div>
                <TextInput
                  name="dataSourceName"
                  label={t('dataSource_validation_test.data_source_name')}
                  className="h-12 w-[390px] pl-4 mr-4 rounded border border-gray-300"
                  required={true}
                  value={formik.values.dataSourceName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.dataSourceName &&
                    !!formik.errors.dataSourceName
                  }
                  read_only={props.readOnly}
                />
                {formik.touched.dataSourceName &&
                  !!formik.errors.dataSourceName && (
                    <p className="border-red-500 text-red-500 pl-4 text-xs pt-1">
                      {formik.errors.dataSourceName as string}
                    </p>
                  )}
              </div>
              <div className="">
                <TextInput
                  name="hospitalName"
                  label={t('dataSource_validation_test.hospital_name')}
                  className="h-12 w-[390px] pl-4 mr-4 rounded border border-gray-300"
                  required={true}
                  value={formik.values.hospitalName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.hospitalName && !!formik.errors.hospitalName
                  }
                  read_only={props.readOnly}
                />
                {formik.touched.hospitalName &&
                  !!formik.errors.hospitalName && (
                    <p className="border-red-500 text-red-500 pl-4 text-xs pt-1">
                      {formik.errors.hospitalName as string}
                    </p>
                  )}
              </div>
              <div>
                <TextInput
                  name="labName"
                  label={`${t('dataSource_validation_test.lab_name')} ${t(
                    'dataSource_validation_test.optional',
                  )}`}
                  className="h-12 w-[390px] pl-4 mr-4 rounded border border-gray-300"
                  required={false}
                  value={formik.values.labName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.labName && !!formik.errors.labName}
                  read_only={props.readOnly}
                />
                {formik.touched.labName && !!formik.errors.labName && (
                  <p className="border-red-500 text-red-500 pl-4 text-xs pt-1">
                    {formik.errors.labName as string}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-row w-full my-4">
              <div className="">
                <TextInput
                  name="instrumentName"
                  label={t('dataSource_validation_test.instrument_name')}
                  className="h-12 w-[390px] pl-4 mr-4 rounded border border-gray-300"
                  required={true}
                  value={formik.values.instrumentName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.instrumentName &&
                    !!formik.errors.instrumentName
                  }
                  read_only={props.readOnly}
                />
                {formik.touched.instrumentName &&
                  !!formik.errors.instrumentName && (
                    <p className="border-red-500 text-red-500 pl-4 text-xs pt-1">
                      {formik.errors.instrumentName as string}
                    </p>
                  )}
              </div>
              <div>
                <TextInput
                  name="unitForInstrument"
                  label={`${t(
                    'dataSource_validation_test.unit_for_instrument',
                  )}`}
                  className="h-12 w-[390px] pl-4 rounded border border-gray-300 "
                  required={true}
                  value={formik.values.unitForInstrument}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.unitForInstrument &&
                    !!formik.errors.unitForInstrument
                  }
                  read_only={props.readOnly}
                />
                {formik.touched.unitForInstrument &&
                  !!formik.errors.unitForInstrument && (
                    <p className="border-red-500 text-red-500 pl-4 text-xs pt-1">
                      {formik.errors.unitForInstrument as string}
                    </p>
                  )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {errorMessage && <p className="text-red-600 ml-4">{errorMessage}</p>}

      <div className=" flex flex-row mt-4">
        <div className="border border-gray-300 w-1/2 ml-4 h-[calc(100vh_-_24.5rem)] overflow-y-auto  shadow-md rounded">
          <div className="flex items-center border-b border-gray-300 p-4 bg-gray-200  text-gray-800 text-base font-semibold">
            <input
              type="checkbox"
              id="all-tests"
              className="mr-4 rounded-none w-[18px] h-[18px] cursor-pointer"
              onChange={(e) => {
                if (props.readOnly) return;
                checkAllSelected(e);
              }}
              checked={selectAll}
              readOnly={props.readOnly}
            />
            <label htmlFor={`all-tests`}>
              {t('report_edit.validation_test')}
            </label>
          </div>

          {validationList.map((item) => (
            <div
              key={item.id}
              className="flex items-center border-b border-gray-300 py-2 px-4"
            >
              <input
                id={item.code + '-checkbox'}
                type="checkbox"
                className="mr-4 rounded-none w-[18px] h-[18px] cursor-pointer"
                onChange={() => {
                  if (props.readOnly) return;
                  handleCheckbox(item);
                }}
                checked={item.selected}
                readOnly={props.readOnly}
              />
              <label
                htmlFor={item.code + '-checkbox'}
                className={`cursor-pointer ${
                  item.selected ? 'line-through text-gray-400' : ''
                }`}
              >
                {item.name}
              </label>
            </div>
          ))}
        </div>
        <div className="border border-gray-300 w-1/2 ml-8 mr-4 shadow-md rounded bg-white h-[calc(100vh_-_24.5rem)] overflow-y-auto ">
          <div className="">
            <div className="border-b border-gray-300 p-4 bg-gray-200 text-gray-800 text-base font-semibold">
              <label>{`${t('report_edit.selected_validation_test')} (${
                selectedTestsList.length
              })`}</label>
            </div>
            {selectedTestsList.length ? (
              validationList
                .filter((item) => item.selected)
                .map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-gray-300 px-4 py-2"
                  >
                    <label htmlFor={`${item.name}`}>{item.name}</label>
                  </div>
                ))
            ) : (
              <p className="text-gray-600 font-normal text-base pl-6 my-4">
                {t('report_validation_test.your_selected_test')}
              </p>
            )}
          </div>
        </div>
      </div>

      <DataSourceFooter
        workflowSteps={props.dataSourceWorkflowSteps}
        handleSubmit={() => {
          if (props.readOnly) {
            props.setActiveStep((activeStep) => activeStep + 1);
          } else {
            if (formik.isValid) {
              const validate = validationTest(
                validationList?.filter((item) => item?.selected) || [],
              );
              if (!validate) {
                setErrorMessage(t('error.select_atleast_one_validation'));
                return;
              }
              handleSubmit();
            } else {
              const fieldsToTouch = {};
              Object.keys(formik.initialValues).forEach((field) => {
                fieldsToTouch[field] = true;
              });
              formik.setTouched(fieldsToTouch);
            }
          }
        }}
        handleDraft={handleSubmit}
        isLoading={isLoading}
        activeStep={props.activeStep}
        readOnly={props.readOnly}
      />
    </>
  );
}
