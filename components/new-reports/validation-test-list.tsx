import {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import useRequestUtilities from '../hooks/use-request-utilities';
import EditReportSkeleton from '../loading/edit-report-skeleton';
import { ReportDetail } from './models/report-details';
import { ReportWorkflowStep } from './models/new-report-workflow-step';
import { ValidationTestViewModel } from './models/validation-test-view-model';
import ReportFooter from './report-footer';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

export default function ValidationTestList(props: {
  reportWorkflowSteps: ReportWorkflowStep[];
  activeStep: number;
  setActiveStep: Dispatch<SetStateAction<number>>;
  reportId: string;
  report: ReportDetail;
  setReport: Dispatch<SetStateAction<ReportDetail>>;
  setIsReportCreated: Dispatch<SetStateAction<boolean>>;
  isReportCreated: boolean;
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
  const [selectAll, setSelectAll] = useState<boolean | null>(null);
  const [allValidationTests, setAllValidationTests] = useState([]);
  const [datasource, setDatasource] = useState<any>();

  const { t } = useTranslation();

  const router = useRouter();

  const newDataSourceId = router?.query?.newDataSourceId;

  useEffect(() => {
    if (!datasource || allValidationTests.length === 0) return;
    const validationViewList =
      allValidationTests
        ?.filter((valTest) =>
          datasource?.validationTests?.includes(valTest?.code),
        )
        ?.map((valTest) => ({
          code: valTest?.code,
          name: valTest?.name,
          selected: Boolean(
            props.report?.validationTests?.includes(valTest?.code),
          ),
        })) || [];
    setValidationList(validationViewList);
  }, [props.report, allValidationTests, datasource]);

  async function getDatasource(report: SetStateAction<ReportDetail>) {
    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.ok) {
        setDatasource(resJson);
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
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/datasources/${newDataSourceId}`,
      includeAuthToken: true,
      handleResponse,
      handleError,
      handleFinally,
    });
  }

  async function getAllValidationTests() {
    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.ok) {
        setAllValidationTests(resJson);
      } else {
        setErrorMessage(resJson?.message || t('error.something_went_wrong'));
      }
    }
    function handleError(_error: any) {
      setErrorMessage(t('error.something_went_wrong'));
    }

    fetchWrapper({
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/validationtests?language=${router.locale}`,
      includeAuthToken: true,
      handleResponse,
      handleError,
    });
  }

  useEffect(() => {
    if (!newDataSourceId) {
      return;
    }
    const { report } = props;
    getAllValidationTests();
    getDatasource(report);
  }, [newDataSourceId]);

  const handleCheckbox = useCallback((item: ValidationTestViewModel, e) => {
    setValidationList((previous) => {
      return previous.map((data) => {
        if (data.code === item.code) {
          return {
            ...data,
            selected: !data.selected,
          };
        } else {
          return data;
        }
      });
    });
  }, []);

  useEffect(() => {
    setErrorMessage('');
  }, [selectedTestsList]);
  useEffect(() => {
    getAllValidationTests();
  }, [router.locale]);

  const checkAllSelected = (e) => {
    const checked = e.target.checked;

    setSelectAll(checked);
    setValidationList((previous) =>
      previous.map((data) => ({ ...data, selected: checked })),
    );
  };

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

    if (!validate) {
      setErrorMessage(t('error.select_atleast_one_validation'));
      return;
    }

    props.setReport((report) => ({
      ...report,
      validationTests: selectedValidationTestList,
    }));

    if (props.isReportCreated) {
      props.setActiveStep((activeStep) => activeStep + 1);
      return;
    }

    //! --
    function initiate() {
      setIsLoading(true);
    }

    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.ok) {
        props.setReport(resJson);
        props.setIsReportCreated(true);
        props.setActiveStep((activeStep) => activeStep + 1);
      } else {
        setErrorMessage(resJson?.message || t('error.something_went_wrong'));
      }
    }
    function handleError(_error: any) {
      setErrorMessage(t('error.something_went_wrong'));
    }
    function handleFinally() {
      setIsLoading(false);
    }

    fetchWrapper({
      method: 'POST',
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/reports`,
      includeAuthToken: true,
      body: {
        dataSourceId: newDataSourceId,
        name: props.report.name,
        startDate: props.report.startDate,
        endDate: props.report.endDate,
        department: {
          name: props.report.department.name,
          teamName: props.report.department.teamName,
          addressLine1: props.report.department.addressLine1,
          addressLine2: props.report.department.addressLine2,
          addressLine3: props.report.department.addressLine3,
          contactNumber: props.report.department.contactNumber,
          faxNumber: props.report.department.faxNumber,
        },
        engineers: props.report.engineers,
        validationTests: selectedTestsList
          .filter((item) => item.selected)
          .map((item) => item.code),
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
      {errorMessage && <p className="text-red-600 ml-4">{errorMessage}</p>}
      <div
        className={`flex flex-row h-full ${
          errorMessage ? 'mt-2' : 'mt-8'
        } min-h-[calc(100vh_-_14.6rem)]`}
      >
        <div className="border border-gray-300 w-1/2 ml-4 h-full overflow-y-auto  shadow-md rounded">
          <div className="flex flex-row  border-b border-gray-300 p-4 bg-gray-200  text-gray-800 text-base font-semibold">
            <input
              type="checkbox"
              className="mr-4 rounded-none"
              onChange={(e) => checkAllSelected(e)}
              checked={selectAll}
            />
            <label htmlFor={`name`}>{t('report_edit.validation_test')}</label>
          </div>

          {validationList.map((item) => (
            <div key={item.code} className=" border-b border-gray-300 p-4">
              <input
                type="checkbox"
                className="mr-4 rounded-none"
                onChange={(e) => handleCheckbox(item, e)}
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
        <div className="border border-gray-300 w-1/2 ml-8 mr-4 shadow-md rounded bg-white h-full overflow-y-auto ">
          <div className="">
            <div className="  border-b border-gray-300 p-4 bg-gray-200 text-gray-800 text-base font-semibold">
              <label htmlFor={`name`}>{`${t(
                'report_edit.selected_validation_test',
              )} (${selectedTestsList.length})`}</label>
            </div>
            {selectedTestsList.length ? (
              validationList
                .filter((item) => item.selected)
                .map((item) => (
                  <div key={item.id} className=" border-b border-gray-300 p-4">
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

      <ReportFooter
        reportWorkflowSteps={props.reportWorkflowSteps}
        handleSubmit={() => {
          handleSubmit();
        }}
        handlePrevious={() =>
          props.setActiveStep((activeStep) => activeStep - 1)
        }
        isLoading={isLoading}
        activeStep={props.activeStep}
        report={props.report}
      />
    </>
  );
}
