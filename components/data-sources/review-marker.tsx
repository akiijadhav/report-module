import Image from 'next/image';
import deleteIcon from '../../public/icons/delete-report.svg';
import restoreIcon from '../../public/icons/restore-icon.svg';
import React, { Dispatch, SetStateAction } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import RocTooltip from '../ui/tooltip';
import { markerRecordsDetails } from './models/data-source-detail';
import { localMarkerdetail } from './models/local-marker-review-detail';
import { useTranslation } from 'react-i18next';

export default function ReviewMarker(props: {
  item: localMarkerdetail;
  readOnly: boolean;
  dataSourceReviewMarkerObj: localMarkerdetail[];
  setDataSourceReviewMarkerObj: Dispatch<SetStateAction<localMarkerdetail[]>>;
}) {
  const {
    item,
    dataSourceReviewMarkerObj,
    setDataSourceReviewMarkerObj,
    readOnly,
  } = props;
  const { t } = useTranslation();

  const columnHelper = createColumnHelper<markerRecordsDetails>();

  const handleExcludedMarker = React.useCallback(
    (rowData: markerRecordsDetails) => {
      setDataSourceReviewMarkerObj((previousData) => {
        return previousData.map((data) => {
          if (data.id === item.id) {
            return {
              ...data,
              markerRecords: data?.markerRecords?.map((record) => {
                if (record.marker_code === rowData.marker_code) {
                  return {
                    ...record,
                    selected: false,
                  };
                } else {
                  return record;
                }
              }),
            };
          } else {
            return data;
          }
        });
      });
    },
    [setDataSourceReviewMarkerObj, item.id],
  );

  const handleRestore = React.useCallback(
    (rowData: markerRecordsDetails) => {
      setDataSourceReviewMarkerObj((previousData) => {
        return previousData.map((data) => {
          if (data.id === item.id) {
            return {
              ...data,
              markerRecords: data?.markerRecords?.map((record) => {
                if (record.marker_code === rowData.marker_code) {
                  return {
                    ...record,
                    selected: true,
                  };
                } else {
                  return record;
                }
              }),
            };
          } else {
            return data;
          }
        });
      });
    },
    [setDataSourceReviewMarkerObj, item.id],
  );

  const columns = React.useMemo(() => {
    const columnsLocal = [
      columnHelper.accessor('marker_code', {
        header: t('data_source_review_marker.acn'),
      }),
      columnHelper.accessor('marker_label', {
        header: t('data_source_review_marker.marker_labels'),
      }),
    ];

    if (!readOnly) {
      columnsLocal.push({
        header: 'Actions',
        id: 'actions',
        cell: ({ row }) =>
          row.original.selected ? (
            <div className="">
              <div
                className="actions-icon-wrapper group"
                onClick={() => {
                  handleExcludedMarker(row.original);
                }}
              >
                <Image
                  src={deleteIcon}
                  width={16}
                  height={16}
                  alt="Exclude Marker icon"
                />
                <RocTooltip bottom="100%">
                  {t('data_source_review_marker.excluded_markers')}
                </RocTooltip>
              </div>
            </div>
          ) : (
            <div className="flex ">
              <div
                className="actions-icon-wrapper group"
                onClick={() => {
                  handleRestore(row.original);
                }}
              >
                <Image
                  src={restoreIcon}
                  width={16}
                  height={16}
                  alt="Restore Marker icon"
                />
                <RocTooltip bottom="100%">
                  {t('data_source_review_marker.restore_marker')}
                </RocTooltip>
              </div>
            </div>
          ),
      });
    }

    return columnsLocal;
  }, [columnHelper, readOnly, handleExcludedMarker, handleRestore]);

  const selectedMakers = React.useMemo(() => {
    const duplicateMarkers =
      item.markerRecords?.filter((item) => item.selected) || [];
    const uniqueMarkers: markerRecordsDetails[] = [];
    duplicateMarkers.forEach((item) => {
      if (
        !uniqueMarkers.find(
          (markerItem) => markerItem.marker_code === item.marker_code,
        )
      ) {
        uniqueMarkers.push(item);
      }
    });
    return uniqueMarkers;
  }, [item]);

  const excludeMakers = React.useMemo(() => {
    const duplicateMarkers =
      item.markerRecords?.filter((item) => !item.selected) || [];
    const uniqueMarkers: markerRecordsDetails[] = [];
    duplicateMarkers.forEach((item) => {
      if (
        !uniqueMarkers.find(
          (markerItem) => markerItem.marker_code === item.marker_code,
        )
      ) {
        uniqueMarkers.push(item);
      }
    });
    return uniqueMarkers;
  }, [item]);

  const noSelectedMarkers = React.useMemo(
    () => (selectedMakers?.length === 0 ? t('error.atleast_one_marker') : ''),
    [selectedMakers],
  );

  const table = useReactTable({
    data: selectedMakers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  const excludeMarkerTable = useReactTable({
    data: excludeMakers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="bg-white space-y-1">
        {noSelectedMarkers && (
          <span className="text-red-500">{noSelectedMarkers}</span>
        )}
        <div className="ds-review-markers-wrapper flex justify-between">
          <div id=" " className="space-y-2 rounded w-[32rem]">
            <p>{t('data_source_review_marker.included_markers')}</p>
            <table className="pl-4 py-4 border bg-gray-200 border-gray-300 rounded w-full overflow-y-auto">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3  text-gray-400 text-left"
                      >
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
              <tbody className="bg-white">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-300">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2 ">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div id=" " className="space-y-2 rounded w-[32rem]">
            <p>{t('data_source_review_marker.excluded_markers')}</p>
            {excludeMakers.length > 0 ? (
              <table className="pl-4 py-4 rounded border bg-gray-200 border-gray-300 w-full">
                <thead>
                  {excludeMarkerTable.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-gray-400"
                        >
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
                <tbody className="bg-white">
                  {excludeMarkerTable.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b border-gray-300">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-2 ">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="border rounded border-gray-300 text-gray-600 font-normal text-base p-4 w-[32rem] ">
                {t('data_source_review_marker.no_marker_excluded')}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
