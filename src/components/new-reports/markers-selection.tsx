import React, { useCallback, useEffect } from 'react';
// import Image from 'next/image';
import { Dispatch, SetStateAction, useState } from 'react';
// import downArrow from '../../public/icons/accordian-down-arrow.svg';
import { useRouter } from 'next/router';
import useRequestUtilities from '../hooks/use-request-utilities';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { HTMLProps } from 'react';
import RocTooltip from '../ui/tooltip';
import {
  MarkerDetail,
  MarkerRecord,
  ReportDetail,
} from './models/report-details';
import { ReportWorkflowStep } from './models/new-report-workflow-step';
import ReportFooter from './report-footer';
import EditReportSkeleton from '../loading/edit-report-skeleton';
import Accordion from '../accordions/accordion';
import { ValidationTestsCode } from '../reports/enums/validation-tests-code';
import { useTranslation } from 'react-i18next';

export default function MarkerSelection(props: {
  reportWorkflowSteps: ReportWorkflowStep[];
  activeStep: number;
  setActiveStep: Dispatch<SetStateAction<number>>;
  reportId: string;
  report: ReportDetail;
  setReport: Dispatch<SetStateAction<ReportDetail>>;
  setAccuracyMarkers: Dispatch<SetStateAction<string[]>>;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedStates, setExpandedStates] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [markerRecords, setMarkerRecords] = useState([]);
  const { fetchWrapper } = useRequestUtilities();
  type viewScreenType = 'loading' | 'set';
  const [viewScreen, setViewScreen] = useState<viewScreenType>('loading');
  const { t } = useTranslation();

  // create local state
  const router = useRouter();
  type ValidationTest = {
    code: string;
    name: string;
    markerDetails: {
      acn: string;
      label: string;
    }[];
  };

  const transformMarkerRecordToValidationTests = (
    markerRecord: any,
  ): ValidationTest[] => {
    if (!markerRecord || !markerRecord.markerDetails) {
      return [];
    }

    const transformedData: ValidationTest[] = [
      {
        code: markerRecord.code,
        name: markerRecord.name,
        markerDetails: markerRecord.markerDetails.map((detail: any) => ({
          id: crypto.randomUUID(),
          acn: detail.acn,
          label: detail.label,
          category: detail.category,
          isSelected: false,
        })),
      },
    ];

    return transformedData;
  };

  const newDataSourceId = router?.query?.newDataSourceId;

  const handleSubmit = async () => {
    function transformData(markerRecords) {
      let selectedMarkers = {};

      // loop through each marker record
      markerRecords.forEach((markerRecord) => {
        const { code, markerDetails } = markerRecord;

        // check if at least one marker detail has isSelected set to true
        const isAtLeastOneSelected = markerRecord.markerDetails.some(
          (markerDetail) => markerDetail.isSelected,
        );

        if (isAtLeastOneSelected) {
          selectedMarkers[code] = [];

          // loop through each marker detail to check isSelected
          markerDetails.forEach((markerDetail) => {
            if (markerDetail.isSelected) {
              selectedMarkers[code].push(Number(markerDetail.acn));
            }
          });
        }
      });

      if (Object.keys(selectedMarkers).length === 0) {
        selectedMarkers = null;
      }

      return { selectedMarkers };
    }

    const selectedListData = transformData(markerRecords);

    props.setReport((report) => ({
      ...report,
      id: report.id,
      selectedMarkers: selectedListData.selectedMarkers,
    }));

    fetchWrapper({
      method: 'PUT',
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/reports/${props.report.id}/selected-marker-labels`,
      includeAuthToken: true,
      body: {
        selectedMarkers: selectedListData.selectedMarkers,
      },
      handleResponse,
      handleError,
      initiate,
      handleFinally,
    });

    function initiate() {
      setIsLoading(true);
    }

    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.ok) {
        props.setReport(resJson);
        props.setActiveStep((activeStep) => activeStep + 1); // moved inside else block
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
  };

  async function getMarkerRecords(report: SetStateAction<ReportDetail>) {
    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.ok) {
        const transformedData = resJson.markerRecords.flatMap(
          transformMarkerRecordToValidationTests,
        );
        setMarkerRecords(transformedData);
      } else {
        setErrorMessage(resJson?.message || t('error.something_went_wrong'));
        return;
      }
    }
    function handleError(_error: any) {
      setErrorMessage(t('error.something_went_wrong'));
    }
    function handleFinally() {
      setViewScreen('set');
    }

    fetchWrapper({
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/reports/${props.report.id}/marker-labels`,
      includeAuthToken: true,
      handleResponse,
      handleError,
      handleFinally,
    });
  }

  const findDuplicateMarkers = useCallback(
    function () {
      const isAccuracyMarkerSelected = Boolean(
        markerRecords
          ?.find(
            (testRecords) => testRecords?.code === ValidationTestsCode.Accuracy,
          )
          ?.markerDetails?.some((markerItem) => markerItem?.isSelected),
      );
      const accuracyLocalMarkers: string[] =
        markerRecords
          ?.find(
            (testRecords) => testRecords?.code === ValidationTestsCode.Accuracy,
          )
          ?.markerDetails?.filter(
            (markerItem) =>
              !!markerItem?.isSelected === isAccuracyMarkerSelected &&
              markerItem?.category === 'IM',
          )
          ?.map((markerItem) => markerItem?.label) || [];

      const markerSeenStatus = {};
      const duplicateMarkers = [];
      accuracyLocalMarkers.forEach((marker) => {
        if (markerSeenStatus[marker]) {
          duplicateMarkers.push(marker);
        } else {
          markerSeenStatus[marker] = true;
        }
      });
      props.setAccuracyMarkers(duplicateMarkers);
    },
    [markerRecords, ValidationTestsCode, props.setAccuracyMarkers],
  );

  useEffect(() => {
    if (!newDataSourceId) {
      return;
    }
    const { report } = props;
    getMarkerRecords(report);
  }, [newDataSourceId]);

  if (viewScreen === 'loading') {
    return <EditReportSkeleton />;
  }

  return (
    <>
      <div className="min-h-[calc(100vh_-_14.65rem)]">
        {errorMessage && (
          <p className="border-red-500 text-red-500 mx-8 my-8">
            {errorMessage}
          </p>
        )}

        {markerRecords.map((record) => (
          <Accordion
            key={record.code}
            title={record.name}
            record={record}
            id={record.code}
            expandedStates={expandedStates}
            setExpandedStates={setExpandedStates}
            markerRecords={markerRecords}
            setMarkerRecords={setMarkerRecords}
            setErrorMessage={setErrorMessage}
          />
        ))}
      </div>
      {/* Add more accordions as needed */}
      <ReportFooter
        reportWorkflowSteps={props.reportWorkflowSteps}
        handleSubmit={() => {
          findDuplicateMarkers();
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
