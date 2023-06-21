import { Listbox } from '@headlessui/react';
import dropDown from '../../public/icons/dropDown.svg';
import Image from 'next/image';
import React, { Dispatch, useEffect, useMemo, useState } from 'react';
import {
  DataSetGroupsAction,
  DataSetGroupsDetail,
} from './models/dataset-groups';

export default function LabelGroupSelector(props: {
  tableGroups: DataSetGroupsDetail;
  dispatchDataSetGroups: Dispatch<DataSetGroupsAction>;
  readOnly: boolean;
}) {
  const { tableGroups, dispatchDataSetGroups, readOnly } = props;

  const [localSelectedIDs, setLocalSelectedIDs] = useState<number[]>([]);

  const alreadySelectedGroups = useMemo(
    () => tableGroups?.groups?.filter((group) => group?.selected) || [],
    [tableGroups],
  );

  useEffect(() => {
    const selectedIDs =
      tableGroups?.groups
        ?.filter((group) => group?.selected)
        ?.map((group) => group?.id) || [];

    setLocalSelectedIDs(selectedIDs);
  }, [tableGroups, setLocalSelectedIDs]);

  return (
    <>
      <Listbox
        name="data-labelling-group"
        onChange={setLocalSelectedIDs}
        multiple
        disabled={readOnly}
      >
        {({ open, disabled }) => (
          <>
            <div className="relative">
              <Listbox.Button
                className={`px-4 py-2 w-80 rounded border ${
                  open ? 'border-light-blue-600' : 'border-gray-300'
                } flex items-center justify-between font-normal text-base text-gray-600 ${
                  disabled ? 'hidden' : ''
                }`}
              >
                {alreadySelectedGroups.length ? (
                  <p className="">
                    <span className="mr-2 px-[6px] rounded-full bg-light-blue-50 text-light-blue-600">
                      {alreadySelectedGroups.length}
                    </span>
                    group selected
                  </p>
                ) : (
                  <p>Select group to parse data</p>
                )}
                <Image
                  src={dropDown}
                  alt="Dropdown icon"
                  width={13}
                  height={8}
                />
              </Listbox.Button>
              <Listbox.Options className="absolute mt-1 w-full rounded border border-gray-100 bg-white shadow-md">
                <div className="max-h-[50vh] overflow-y-auto">
                  {tableGroups?.groups?.map((group) => (
                    <Listbox.Option
                      key={group?.id}
                      value={group?.id}
                      className="px-4 py-3 flex items-center gap-3 hover:bg-light-blue-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="w-5 h-5 cursor-pointer"
                        checked={!!localSelectedIDs?.includes(group?.id)}
                        readOnly
                      />
                      {group?.displayName}
                    </Listbox.Option>
                  ))}
                </div>
                <div className="border-t border-gray-300 px-4 py-2 flex items-center justify-end">
                  <button
                    onClick={() =>
                      dispatchDataSetGroups({
                        type: 'REPLACE',
                        replacePayload: {
                          ...tableGroups,
                          groups: tableGroups?.groups?.map((group) => ({
                            ...group,
                            selected: localSelectedIDs.includes(group.id),
                          })),
                        },
                      })
                    }
                    className="rounded px-3 py-1 shadow-sm font-semibold text-base text-white bg-light-blue-600 hover:bg-blue-600 hover:shadow-none"
                  >
                    {alreadySelectedGroups.length ? 'Update' : 'Add'}
                  </button>
                </div>
              </Listbox.Options>
            </div>
          </>
        )}
      </Listbox>
    </>
  );
}
