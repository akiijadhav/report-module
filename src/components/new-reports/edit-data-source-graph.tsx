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
import GenerateConfirmationReportModal from './generate-report-confirmation-modal';
import { report } from 'process';
import Select2CHMarkersModal from './select-2ch-markers-modal';

export default function EditDataSourceGraph(props: {
  reportWorkflowSteps: ReportWorkflowStep[];
  activeStep: number;
  setActiveStep: Dispatch<SetStateAction<number>>;
  reportId: string;
  report: ReportDetail;
  setReport: Dispatch<SetStateAction<ReportDetail>>;
  accuracyMarkers: string[];
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
  const [showModal, setShowModal] = useState(false);
  const [selected2CHMarkers, setSelected2CHMarkers] = useState<string[]>([]);

  const { t } = useTranslation();

  const router = useRouter();

  const newDataSourceId = router?.query?.newDataSourceId;

  const handleSubmit = async () => {
    setShowModal(true);
    setErrorMessage('');
  };

  //   if (viewScreen === 'loading') {
  //     return <EditReportSkeleton />;
  //   }

  return (
    <>
      {errorMessage && <p className="text-red-600 ml-4">{errorMessage}</p>}
      {showModal &&
        (props.accuracyMarkers?.length ? (
          <Select2CHMarkersModal
            duplicateMarkers={props.accuracyMarkers}
            show={showModal}
            setShow={setShowModal}
            translator={t}
            selected2ChMarkers={selected2CHMarkers}
            setSelected2ChMarkers={setSelected2CHMarkers}
            setActiveStep={props.setActiveStep}
            reportID={props.report?.id}
          />
        ) : (
          <GenerateConfirmationReportModal
            setGenerateReportModal={setShowModal}
            setActiveStep={props.setActiveStep}
            report={props.report}
          />
        ))}
      <div className="min-h-[calc(100vh_-_12.8rem)]"></div>

      <ReportFooter
        reportWorkflowSteps={props.reportWorkflowSteps}
        handleSubmit={() => {
          handleSubmit();
        }}
        isLoading={false}
        activeStep={props.activeStep}
        handlePrevious={() =>
          props.setActiveStep((activeStep) => activeStep - 1)
        }
        report={props.report}
      />
    </>
  );
}
