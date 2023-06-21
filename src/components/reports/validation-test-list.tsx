import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import useRequestUtilities from '../hooks/use-request-utilities';
import EditReportSkeleton from '../loading/edit-report-skeleton';
import { ReportDetail } from './models/report-detail';
import { ReportWorkflowStep } from './models/report-workflow-step';
import { ValidationTestViewModel } from './models/validation-test-view-model';
import ReportFooter from './report-footer';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import checkbox from '../../public/icons/checkbox.svg';
import checkboxTick from '../../public/icons/checkbox-tick.svg';
import { useFormik } from 'formik';
import RocSelectInput from '../forms/select-input';
import OutputSettingTextInput from '../forms/reports/output-setting-text-input';
import { Listbox } from '@headlessui/react';
import dropDown from '../../public/icons/dropDown.svg';

export default function ValidationTestList(props: {
  reportWorkflowSteps: ReportWorkflowStep[];
  activeStep: number;
  setActiveStep: Dispatch<SetStateAction<number>>;
  reportId: string;
  report: ReportDetail;
  setReport: Dispatch<SetStateAction<ReportDetail>>;
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
  const [moduleErrorMessage, setModuleErrorMessage] = useState('');
  const [pickList, setPickList] = useState<any>({});
  const [selectModule, setSelectModule] = useState(
    props.report?.module || [],
    // props.report?.props.report?.module ? props.report.module : [],
  );
  const { t } = useTranslation();

  const router = useRouter();

  async function getPickListData() {
    async function handleResponse(response: Response) {
      const resJson = await response.json();

      if (response.ok) {
        setPickList(resJson);
      } else {
        setErrorMessage(resJson?.message || 'SomeThing went Wrong');
      }
    }
    function handleError(_error: any) {
      setErrorMessage('SomeThing went Wrong');
    }

    fetchWrapper({
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/picklist?type=instrument&type=module&language=en`,
      includeAuthToken: true,
      handleResponse,
      handleError,
    });
  }

  useEffect(() => {
    getPickListData();
  }, []);

  async function getValidationList() {
    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.ok) {
        const validationViewList = resJson.map((item) => {
          return {
            ...item,
            selected: Boolean(
              props.report?.validationTests?.includes(item?.code),
            ),
          };
        });
        setValidationList(validationViewList);
      } else {
        setErrorMessage(resJson?.message || 'Something went wrong');
      }
    }
    function handleError(_error: any) {
      setErrorMessage('Something went wrong');
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

  useEffect(() => {
    getValidationList();
  }, []);

  const handleCheckbox = (item: ValidationTestViewModel) => {
    const checkedItem = validationList.filter((data) => data.selected);
    if (checkedItem.length > 0) {
      if (checkedItem[0].id === item.id) {
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
      } else {
        setErrorMessage('You can select only one validation test at a time');
      }
    } else {
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
    }
  };

  useEffect(() => {
    setErrorMessage('');
  }, [selectedTestsList]);

  const validationTest = (selectedValidationTestList) => {
    if (selectedValidationTestList.length === 0) {
      return false;
    } else {
      return true;
    }
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    const selectedValidationTestList = validationList
      .filter((item) => item.selected)
      .map((item) => item.code);
    const validate = validationTest(selectedValidationTestList);
    if (!selectModule.length) {
      setModuleErrorMessage(t('error.field_is_required'));
      return;
    }

    if (!validate) {
      setErrorMessage('Please select one validation test');
      return;
    }
    function initiate() {
      setIsLoading(true);
    }
    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.ok) {
        props.setReport(resJson);
        props.setActiveStep((activeStep) => activeStep + 1);
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
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/${props.reportId}/validation-tests`,
      includeAuthToken: true,
      body: {
        validationTests: selectedValidationTestList,
        instrument: formik.values.instrument,
        module: selectModule,
        moduleNumber: formik.values.moduleNumber,
        unitOfInstrument: formik.values.unitOfInstrument,
      },
      handleResponse,
      handleError,
      initiate,
      handleFinally,
    });
  };

  const validationHandler = (values) => {
    const errors: {
      instrument?: string;
      module?: string;
      moduleNumber?: string;
      unitOfInstrument?: string;
    } = {};
    if (!values.instrument) errors.instrument = t('error.field_is_required');
    if (!values.moduleNumber)
      errors.moduleNumber = t('error.field_is_required');
    if (!values.unitOfInstrument)
      errors.unitOfInstrument = t('error.field_is_required');
    return errors;
  };

  const formik = useFormik({
    initialValues: {
      instrument: props.report?.instrument || '',
      module: '',
      moduleNumber: props.report?.moduleNumber || '',
      unitOfInstrument: props.report?.unitOfInstrument || '',
    },
    validate: validationHandler,
    onSubmit: handleSubmit,
  });

  if (viewScreen === 'loading') {
    return <EditReportSkeleton />;
  }

  return (
    <>
      <form onSubmit={formik.handleSubmit}>
        <div className="flex flex-row m-4 justify-between ">
          <div className="relative mr-4">
            <RocSelectInput
              name="instrument"
              label="Select Instrument"
              className="h-12 rounded border border-gray-300 "
              required={true}
              value={formik.values.instrument}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.instrument && !!formik.errors.instrument}
              options={pickList?.instrument}
            />
            {formik.touched.instrument && !!formik.errors.instrument && (
              <p className="border-red-500 text-red-500">
                {formik.errors.instrument as string}
              </p>
            )}
          </div>

          <div className="relative mr-4">
            <Listbox
              name="twoChValues"
              value={selectModule}
              onChange={setSelectModule}
              multiple
            >
              <div className="w-[282px] min-h-[3rem] rounded px-2 border border-gray-300 relative">
                <div className="flex gap-1  flex-wrap items-center">
                  {selectModule.map((item) => (
                    <p className="px-2 rounded-sm py-2 bg-gray-100 flex items-center cursor-default">
                      {item}
                      <span
                        onClick={() =>
                          setSelectModule((selectModule) =>
                            selectModule.filter(
                              (oldModule) => oldModule !== item,
                            ),
                          )
                        }
                        className="ml-2 text-xl px-2 rounded-full border border-gray-200 cursor-pointer hover:bg-gray-200"
                      >
                        &#215;
                      </span>
                    </p>
                  ))}
                  <Listbox.Button className="py-4 flex absolute left-[16.5rem] top-1  items-center  gap-2 text-gray-600">
                    <Image
                      src={dropDown}
                      alt="Dropdown icon"
                      width={10}
                      height={10}
                    />
                  </Listbox.Button>
                </div>
              </div>
              <Listbox.Options className="absolute rounded border border-gray-300 w-full bg-white">
                {pickList?.module?.map((item) => (
                  <Listbox.Option
                    key={item.Name}
                    value={item.Name}
                    className="hover:bg-[#0284C7] pl-2"
                  >
                    {item.Name}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Listbox>

            <label
              className={`font-normal text-base leading-6 text-gray-600 absolute top-3 left-9 pointer-events-none origin-top-left transition-all duration-200 group-focus-within:shrunk-label ${
                selectModule.length ? 'shrunk-label' : ''
              } ${moduleErrorMessage && 'text-red-500'}`}
            >
              Select Module
            </label>

            {moduleErrorMessage && (
              <p className="border-red-500 text-red-500">
                {moduleErrorMessage as string}
              </p>
            )}
          </div>
          <div className="relative ">
            <OutputSettingTextInput
              name="moduleNumber"
              label={t('report_edit.enter_module_number')}
              className="h-12 w-[282px] pl-2 mr-4 rounded border border-gray-300 "
              required={false}
              value={formik.values.moduleNumber}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.moduleNumber && !!formik.errors.moduleNumber
              }
            />
            {formik.touched.moduleNumber && !!formik.errors.moduleNumber && (
              <p className="border-red-500 text-red-500">
                {formik.errors.moduleNumber as string}
              </p>
            )}
          </div>
          <div className="relative ">
            <OutputSettingTextInput
              name="unitOfInstrument"
              label={t('report_edit.enter_instrument_unit')}
              className="h-12 w-[282px] pl-2 mr-4 rounded border border-gray-300 "
              required={false}
              value={formik.values.unitOfInstrument}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.unitOfInstrument &&
                !!formik.errors.unitOfInstrument
              }
            />
            {formik.touched.unitOfInstrument &&
              !!formik.errors.unitOfInstrument && (
                <p className="border-red-500 text-red-500">
                  {formik.errors.unitOfInstrument as string}
                </p>
              )}
          </div>
        </div>
      </form>
      {errorMessage && <p className="text-red-600 ml-4">{errorMessage}</p>}
      <div className={`flex flex-row  ${errorMessage ? 'mt-2' : 'mt-8'}`}>
        <div className="border border-gray-300 w-1/2 ml-4 h-[calc(100vh_-_14.6rem)] overflow-y-auto  shadow-md rounded">
          <div className="mb-2 flex flex-row  border-b border-gray-300 p-6 bg-gray-200  text-gray-800 text-base font-semibold">
            {selectedTestsList.length ? (
              <Image
                src={checkboxTick}
                alt=""
                width={13}
                height={13}
                className="mr-4"
              />
            ) : (
              <Image
                src={checkbox}
                alt=""
                width={13}
                height={13}
                className="mr-4"
              />
            )}
            <label htmlFor={`name`}>{t('report_edit.validation_test')}</label>
          </div>

          {validationList.map((item) => (
            <div key={item.id} className=" border-b border-gray-300 p-6">
              <input
                type="checkbox"
                className="mr-4 rounded-none"
                onChange={() => handleCheckbox(item)}
                checked={item.selected}
              />
              <label
                htmlFor={`${item.name}`}
                className={item.selected ? 'line-through text-gray-400' : ''}
              >
                {item.name}
              </label>
            </div>
          ))}
        </div>
        <div className="border border-gray-300 w-1/2 ml-8 mr-4 shadow-md rounded bg-white h-[calc(100vh_-_14.6rem)] overflow-y-auto ">
          <div className="">
            <div className="  border-b border-gray-300 p-6 bg-gray-200 text-gray-800 text-base font-semibold">
              <label htmlFor={`name`}>{`${t(
                'report_edit.selected_validation_test',
              )} (${selectedTestsList.length})`}</label>
            </div>
            {selectedTestsList.length ? (
              validationList
                .filter((item) => item.selected)
                .map((item) => (
                  <div key={item.id} className=" border-b border-gray-300 p-7">
                    <label htmlFor={`${item.name}`}>{item.name}</label>
                  </div>
                ))
            ) : (
              <p className="text-gray-600 font-normal text-base pl-6">
                Your selected test will appear here!
              </p>
            )}
          </div>
        </div>
      </div>

      <ReportFooter
        reportWorkflowSteps={props.reportWorkflowSteps}
        handleSubmit={() => {
          if (formik.isValid && formik.dirty) {
            handleSubmit();
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
      />
    </>
  );
}
