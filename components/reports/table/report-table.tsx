import React, { useCallback, useState } from 'react';
import { ReportType } from './types';
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import RocStatusLabel from '../../common/status-label';
import RocTooltip from '../../ui/tooltip';
import Image from 'next/image';
import viewReportIcon from '../../../public/icons/view-report.svg';
import downloadReportIcon from '../../../public/icons/download-report.svg';
import deleteReportIcon from '../../../public/icons/delete-report.svg';
import editReportIcon from '../../../public/icons/edit-report-icon.svg';
import DeleteReportModal from '../delete-report-modal';
import useRequestUtilities from '../../hooks/use-request-utilities';
import Notification, { responseMsgType } from '../../ui/notification';
import PreviewReportModal from '../preview-report-modal';
import { useTranslation } from 'react-i18next';

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function ReportTable({ data }: { data: ReportType[] }) {
  const { fetchWrapper, nextJsRouter: router } = useRequestUtilities();
  const [showDeleteReportModal, setShowDeleteReportModal] = useState(false);
  const [selectedReportData, setSelectedReportData] = useState<ReportType>();
  const [reportUpdateMsg, setReportUpdateMsg] = useState<responseMsgType>({});
  const [isGettingReport, setIsGettingReport] = useState(false);
  const [showPreviewReportModal, setShowPreviewReportModal] = useState({
    show: false,
    fileUrl: '',
  });
  const { t } = useTranslation();

  const downloadThroughBlob = useCallback(function (
    fileUrl: RequestInfo | URL,
    report: ReportType,
  ) {
    function initiate() {
      setIsGettingReport(true);
      setReportUpdateMsg({
        isError: false,
        isProcessing: true,
        entityName: report.Name,
        msg: t('error.downloading_report'),
      });
    }
    async function handleResponse(response: Response) {
      if (response.ok) {
        const resBlob = await response.blob();
        const blobUrl = window.URL.createObjectURL(new Blob([resBlob]));
        const downloadButton = document.createElement('a');
        downloadButton.href = blobUrl;
        downloadButton.download = report.Name.replaceAll(' ', '_') + '.pdf';
        downloadButton.click();
        setReportUpdateMsg({
          entityName: '',
          isError: false,
          isProcessing: false,
          msg: '',
        });
      } else {
        setReportUpdateMsg({
          entityName: report.Name,
          isError: true,
          isProcessing: false,
          msg: ` Error ${response.status} ${response.statusText}`,
        });
      }
    }
    function handleError(_error: any) {
      setReportUpdateMsg({
        isError: true,
        entityName: report.Name,
        isProcessing: false,
        msg: t('error.failed_to_get_report_file'),
      });
    }
    function handleFinally() {
      setIsGettingReport(false);
    }

    fetchWrapper({
      url: fileUrl,
      includeAuthToken: false,
      initiate,
      handleResponse,
      handleError,
      handleFinally,
    });
  },
  []);

  const getReportFile = useCallback(function (
    report: ReportType,
    shouldDownload = false,
  ) {
    function initiate() {
      setIsGettingReport(true);
      if (shouldDownload) {
        setReportUpdateMsg({
          isError: false,
          isProcessing: true,
          entityName: report.Name,
          msg: t('error.downloading_report'),
        });
      }
    }
    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.ok) {
        const fileUrl = resJson.url;

        if (shouldDownload) {
          downloadThroughBlob(fileUrl, report);
        } else {
          setShowPreviewReportModal({
            show: true,
            fileUrl,
          });
        }
      } else {
        setReportUpdateMsg({
          entityName: report.Name,
          isError: true,
          isProcessing: false,
          msg: resJson?.message
            ? ` ${resJson.message}`
            : ` Error ${response.status} ${response.statusText}`,
        });
      }
    }
    function handleError(_error: any) {
      setReportUpdateMsg({
        isError: true,
        entityName: report.Name,
        isProcessing: false,
        msg: t('error.failed_to_get_report_file'),
      });
    }
    function handleFinally() {
      setIsGettingReport(false);
    }

    fetchWrapper({
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/${report.Id}/download-url`,
      includeAuthToken: true,
      initiate,
      handleResponse,
      handleError,
      handleFinally,
    });
  },
  []);

  const columnHelper = createColumnHelper<ReportType>();
  const columns: ColumnDef<ReportType, string>[] = [
    columnHelper.accessor('Name', {
      header: `Reports (${data.length})`,
      cell(props) {
        return (
          <div className="table-cell-report-name">
            <p>{props.renderValue()}</p>
          </div>
        );
      },
    }),
    {
      id: 'Customer',
      header: 'Customer',
      cell(props) {
        const dataRow = props.row.original;
        return (
          <div className="table-cell-default">
            <p className="text-gray-800">{dataRow?.HospitalName || '-'}</p>
            <p>{dataRow.LabName || '-'}</p>
          </div>
        );
      },
    },
    columnHelper.accessor('Timestamp', {
      header: 'Date & Time',
      cell(props) {
        const dateTime = new Date(props.getValue());
        const reportDate = `${dateTime.getDate()} ${
          monthNames[dateTime.getMonth()]
        } ${dateTime.getFullYear()}`;
        return (
          <div className="table-cell-default">
            <p className="text-gray-800">{reportDate || '-'}</p>
            <p>{dateTime.toLocaleTimeString() || '-'}</p>
          </div>
        );
      },
    }),
    columnHelper.accessor('Status', {
      cell(props) {
        return (
          <div className="table-cell-default">
            <RocStatusLabel Status={props.getValue()} />
          </div>
        );
      },
    }),
    columnHelper.display({
      id: 'Actions',
      cell(props) {
        const reportStatus = props.row.original.Status;
        const disableDownload =
          selectedReportData?.Id === props.row.original.Id && isGettingReport;
        return (
          <div className="table-cell-actions">
            {reportStatus === 'Success' && (
              <>
                <div
                  className="actions-icon-wrapper group"
                  onClick={() => {
                    setSelectedReportData(props.row.original);
                    getReportFile(props.row.original);
                  }}
                >
                  <Image
                    src={viewReportIcon}
                    width={24}
                    height={24}
                    alt="View Report"
                    className={`w-6 h-6`}
                  />
                  <RocTooltip bottom="100%">View report</RocTooltip>
                </div>
                <div
                  className={`actions-icon-wrapper group ${
                    disableDownload ? 'disabled-action-btn' : ''
                  }`}
                  onClick={() => {
                    if (disableDownload) return;
                    setSelectedReportData(props.row.original);
                    getReportFile(props.row.original, true);
                  }}
                >
                  <Image
                    src={downloadReportIcon}
                    width={24}
                    height={24}
                    alt="Download Report"
                    className={`w-6 h-6`}
                  />
                  <RocTooltip bottom="100%">Download report</RocTooltip>
                </div>
              </>
            )}
            {reportStatus === 'Draft' && (
              <>
                <div
                  className="actions-icon-wrapper group"
                  onClick={() =>
                    router.push(`/old-reports/${props.row.original.Id}`)
                  }
                >
                  <Image
                    src={editReportIcon}
                    width={24}
                    height={24}
                    alt="Edit Report"
                    className={`w-6 h-6`}
                  />
                  <RocTooltip bottom="100%">Edit report</RocTooltip>
                </div>
                <div
                  className="actions-icon-wrapper group"
                  onClick={() => {
                    setSelectedReportData(props.row.original);
                    setShowDeleteReportModal(true);
                  }}
                >
                  <Image
                    src={deleteReportIcon}
                    width={24}
                    height={24}
                    alt="Delete Report"
                    className={`w-6 h-6`}
                  />
                  <RocTooltip bottom="100%">Delete</RocTooltip>
                </div>
              </>
            )}
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <table className="custom-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {showDeleteReportModal && (
        <DeleteReportModal
          show={showDeleteReportModal}
          setShow={setShowDeleteReportModal}
          reportData={selectedReportData}
        />
      )}
      {reportUpdateMsg?.msg ? (
        <Notification
          entityUpdateMsg={reportUpdateMsg}
          setEntityUpdateMsg={setReportUpdateMsg}
        />
      ) : null}
      {showPreviewReportModal.show && (
        <PreviewReportModal
          reportData={selectedReportData}
          showPreviewReportModal={showPreviewReportModal}
          setShowPreviewReportModal={setShowPreviewReportModal}
        />
      )}
    </>
  );
}
