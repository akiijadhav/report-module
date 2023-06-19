import { useState } from 'react';
import { DataSourceModel } from './models/data-source';
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import Image from 'next/image';
import viewSourceIcon from '../../public/icons/view-report.svg';
import generateReportIcon from '../../public/icons/report-from-source-icon.svg';
import deleteSourceIcon from '../../public/icons/delete-report.svg';
import editSourceIcon from '../../public/icons/edit-data-source-icon.svg';
import Notification, { responseMsgType } from '../ui/notification';
import RocStatusLabel from '../common/status-label';
import RocTooltip from '../ui/tooltip';
import { useTranslation } from 'react-i18next';
import DeleteDataSourceModal from './delete-data-source-modal';
import { useRouter } from 'next/router';

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

export default function DataSourceTable({ data }: { data: DataSourceModel[] }) {
  const [reportUpdateMsg, setReportUpdateMsg] = useState<responseMsgType>({});
  const [showDeleteSourceModal, setShowDeleteSourceModal] = useState(false);
  const [selectedDataSource, setSelectedDataSource] =
    useState<DataSourceModel>();

  const { t } = useTranslation();
  const router = useRouter();

  const columnHelper = createColumnHelper<DataSourceModel>();
  const columns: ColumnDef<DataSourceModel, string>[] = [
    columnHelper.accessor('name', {
      header: `${t('data_sources.data_Source')} (${data.length})`,
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
      header: t('data_sources.customer'),
      cell(props) {
        const dataRow = props.row.original;
        return (
          <div className="table-cell-default">
            <p className="text-gray-800">{dataRow?.hospitalName || '-'}</p>
            <p>{dataRow.labName || '-'}</p>
          </div>
        );
      },
    },
    columnHelper.accessor('updatedAt', {
      header: t('data_sources.date_time'),
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
    columnHelper.accessor('status', {
      cell(props) {
        return (
          <div className="table-cell-default">
            <RocStatusLabel Status={props.getValue()} />
          </div>
        );
      },
      header: t('data_sources.status'),
    }),
    columnHelper.display({
      id: 'Actions',
      cell(props) {
        const reportStatus = props.row.original.status;
        return (
          <div className="table-cell-actions">
            {reportStatus === 'Completed' && (
              <>
                <div
                  className="actions-icon-wrapper group"
                  onClick={() =>
                    router.push(`/data-sources/${props.row.original.id}/view`)
                  }
                >
                  <Image
                    src={viewSourceIcon}
                    width={24}
                    height={24}
                    alt="View data source"
                    className={`w-6 h-6`}
                  />
                  <RocTooltip bottom="100%">
                    {t('data_sources.view_data_source')}
                  </RocTooltip>
                </div>

                <div
                  className={`actions-icon-wrapper group`}
                  onClick={() =>
                    router.push({
                      pathname: `/data-sources/[newDataSourceId]/reports`,
                      query: { newDataSourceId: `${props.row.original.id}` },
                    })
                  }
                >
                  <Image
                    src={generateReportIcon}
                    width={24}
                    height={24}
                    alt="Generate Report"
                    className={`w-6 h-6`}
                  />
                  <RocTooltip bottom="100%">
                    {t('data_sources.create_report')}
                  </RocTooltip>
                </div>
              </>
            )}
            {reportStatus === 'Draft' && (
              <>
                <div
                  className="actions-icon-wrapper group"
                  onClick={() =>
                    router.push(`/data-sources/${props.row.original.id}`)
                  }
                >
                  <Image
                    src={editSourceIcon}
                    width={24}
                    height={24}
                    alt="Edit data source"
                    className={`w-6 h-6`}
                  />
                  <RocTooltip bottom="100%">
                    {t('data_sources.edit_data_source')}
                  </RocTooltip>
                </div>
              </>
            )}
            <div
              className="actions-icon-wrapper group"
              onClick={() => {
                setSelectedDataSource(props.row.original);
                setShowDeleteSourceModal(true);
              }}
            >
              <Image
                src={deleteSourceIcon}
                width={24}
                height={24}
                alt="Delete data source"
                className={`w-6 h-6`}
              />
              <RocTooltip bottom="100%">
                {t('data_sources.delete_data_source')}
              </RocTooltip>
            </div>
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
                <th key={header.id} className="font-medium text-base ">
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
            <tr key={row.id} className=" hover:bg-gray-100">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {showDeleteSourceModal && (
        <DeleteDataSourceModal
          dataSource={selectedDataSource}
          show={showDeleteSourceModal}
          setShow={setShowDeleteSourceModal}
          translator={t}
        />
      )}
      {reportUpdateMsg?.msg ? (
        <Notification
          entityUpdateMsg={reportUpdateMsg}
          setEntityUpdateMsg={setReportUpdateMsg}
        />
      ) : null}
    </>
  );
}
