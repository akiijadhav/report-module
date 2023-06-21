import React, { HTMLProps, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import downArrow from '../../public/icons/down-arrow.svg';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { MarkerDetail } from '../new-reports/models/report-details';
import { useTranslation } from 'react-i18next';

const Accordion = ({
  title,
  id,
  expandedStates,
  setExpandedStates,
  record,
  markerRecords,
  setMarkerRecords,
  setErrorMessage,
}) => {
  const isExpanded = expandedStates[id] || false;

  const [rowSelection, setRowSelection] = useState({});
  const { t } = useTranslation();
  const toggleAccordion = () => {
    setExpandedStates({
      ...expandedStates,
      [id]: !isExpanded,
    });
  };
  function IndeterminateCheckbox({
    indeterminate,
    className = '',
    ...rest
  }: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
    const ref = React.useRef<HTMLInputElement>(null!);

    React.useEffect(() => {
      if (typeof indeterminate === 'boolean') {
        ref.current.indeterminate = !rest.checked && indeterminate;
      }
    }, [ref, indeterminate]);

    return (
      <input
        type="checkbox"
        ref={ref}
        className={className + ' cursor-pointer'}
        {...rest}
      />
    );
  }

  const columnHelper = createColumnHelper<MarkerDetail>();
  const columns = [
    {
      header: ({ table }) => {
        return (
          <IndeterminateCheckbox
            {...{
              checked: table.getIsAllRowsSelected(),
              indeterminate: table.getIsSomeRowsSelected(),
              onChange: () => {
                setMarkerRecords((previous) => {
                  return previous.map((marker) => {
                    if (marker.code === record.code) {
                      return {
                        ...marker,
                        markerDetails: marker.markerDetails.map((item) => ({
                          ...item,
                          isSelected: !table.getIsAllRowsSelected(),
                        })),
                      };
                    } else {
                      return marker;
                    }
                  });
                });
                table.toggleAllRowsSelected();
              },
            }}
          />
        );
      },
      id: 'checked',
      cell: ({ row }) => (
        <div className="flex justify-center">
          <div className="checked-icon-wrapper group">
            <IndeterminateCheckbox
              {...{
                checked: row.getIsSelected(),
                disabled: !row.getCanSelect(),
                indeterminate: row.getIsSomeSelected(),
                onChange: () => {
                  setMarkerRecords((previous) => {
                    return previous.map((marker) => {
                      if (marker.code === record.code) {
                        return {
                          ...marker,
                          markerDetails: marker.markerDetails.map((item) => {
                            if (item.acn === row.original.acn) {
                              return {
                                ...item,
                                isSelected: !row.getIsSelected(),
                              };
                            } else {
                              return item;
                            }
                          }),
                        };
                      } else {
                        return marker;
                      }
                    });
                  });
                  row.toggleSelected();
                },
              }}
            />
          </div>
        </div>
      ),
    },
    columnHelper.accessor('acn', {
      cell: (info: {
        getValue: () =>
          | string
          | number
          | boolean
          | React.ReactElement<any, string | React.JSXElementConstructor<any>>
          | React.ReactFragment
          | React.ReactPortal;
      }) => <p>{info.getValue()}</p>,
      header: () => <span>{t('data_source_review_marker.acn')}</span>,
    }),
    columnHelper.accessor('label', {
      header: () => `${t('data_source_review_marker.marker_labels')}`,
      cell: (info: { renderValue: () => any }) => info.renderValue(),
    }),
  ];

  const tableData = useMemo(() => {
    const duplicateMarkers = record?.markerDetails || [];
    const uniqueMarkers = [];
    duplicateMarkers.forEach((item) => {
      if (!uniqueMarkers.find((markerItem) => markerItem.acn === item.acn)) {
        uniqueMarkers.push(item);
      }
    });
    return uniqueMarkers;
  }, [record.markerDetails]);

  // // Create a useReactTable instance for each accordion
  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      rowSelection: rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
  });

  // useEffect(() => {
  //   setErrorMessage('');
  // }, [rowSelection]);

  return (
    <div className="rounded-lg overflow-hidden bg-gray-50 flex flex-col items-center shadow-md my-8 mx-8">
      <span
        className="w-full p-4 px-12 flex items-center justify-between bg-light-blue-50 border-b border-light-blue-100 font-medium text-xl text-gray-800 cursor-pointer"
        onClick={toggleAccordion}
      >
        {title}
        <span className="flex justify-center items-center rounded w-10 h-10">
          <Image
            width={14}
            height={8}
            src={downArrow}
            alt="Toggle accordion icon"
            className={`${
              isExpanded ? '-rotate-180' : ''
            } transition-transform`}
          />
        </span>
      </span>
      {isExpanded && (
        <div className="self-stretch space-y-6">
          <div className="p-4 pb-6 bg-white rounded space-y-4">
            <div className="flex justify-between px-8">
              <div id=" " className="space-y-3 rounded w-[32rem]">
                <p>{t('report_markers.all_marker')}</p>
                <table className="pl-4 py-4 border border-gray-300 rounded w-full overflow-y-auto accordion-table">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr
                        key={headerGroup.id}
                        className="bg-gray-200 custom-height-tr"
                      >
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="p-1 text-left text-gray-400"
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
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className=" border-b border-gray-300 h-30"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="p-1 text-left custom-height-td"
                          >
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accordion;
