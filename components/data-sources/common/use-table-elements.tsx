import { HeaderContext, CellContext, Cell } from '@tanstack/react-table';
import Image from 'next/image';
import {
  Dispatch,
  KeyboardEvent,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import leftArrowIcon from '../../../public/icons/left-arrow.svg';
import openResultsIcon from '../../../public/icons/open-results-icon.svg';
import { InputFieldType } from '../enums/input-field-type';
import { KeyboardKeyName } from '../enums/keyboard-key-name';
import exportIcon from '../../../public/icons/exportIcon.svg';
import moment from 'moment';

export default function useTableElements() {
  const handleKeyDown = useCallback(function <rowData>(
    event: KeyboardEvent<HTMLInputElement>,
    cell: Cell<rowData, unknown>,
    isActive: boolean,
    setIsActive: Dispatch<SetStateAction<boolean>>,
  ) {
    event.stopPropagation();
    const inputIdParts = `${cell.id}_input`.split('_');
    const currentElement = document.activeElement as HTMLInputElement;
    const inputElements = [
      ...document.activeElement?.parentElement?.parentElement?.getElementsByTagName(
        'input',
      ),
    ];

    if (!isActive) {
      switch (event.key) {
        case KeyboardKeyName.F2:
          setIsActive(true);
          break;
        case KeyboardKeyName.Left:
          if (
            document?.getElementById(
              `${Number(inputIdParts[0]) - 1}_${inputIdParts[1]}_input`,
            )
          ) {
            (document.activeElement as HTMLInputElement).blur();
            document
              ?.getElementById(
                `${Number(inputIdParts[0]) - 1}_${inputIdParts[1]}_input`,
              )
              ?.focus();
          }
          break;
        case KeyboardKeyName.Right:
          if (
            document?.getElementById(
              `${Number(inputIdParts[0]) + 1}_${inputIdParts[1]}_input`,
            )
          ) {
            (document.activeElement as HTMLInputElement).blur();
            document
              ?.getElementById(
                `${Number(inputIdParts[0]) + 1}_${inputIdParts[1]}_input`,
              )
              ?.focus();
          }
          break;
        case KeyboardKeyName.Enter:
        case KeyboardKeyName.Down:
          currentElement.type === InputFieldType.number &&
            event.preventDefault();
          const nextElement = inputElements.at(
            inputElements.indexOf(currentElement) + 1,
          );

          if (nextElement) {
            (document.activeElement as HTMLInputElement).blur();
            nextElement.focus();
          }
          break;
        case KeyboardKeyName.Up:
          currentElement.type === InputFieldType.number &&
            event.preventDefault();
          const previousElement = inputElements.at(
            (inputElements.indexOf(currentElement) || 1) - 1,
          );

          if (previousElement) {
            (document.activeElement as HTMLInputElement).blur();
            previousElement.focus();
          }
          break;
        default:
          break;
      }
    } else {
      switch (event.key) {
        case KeyboardKeyName.Escape:
          setIsActive(false);
          break;
        case KeyboardKeyName.Up:
          currentElement.type === InputFieldType.number &&
            event.preventDefault();
          break;
        case KeyboardKeyName.Down:
          currentElement.type === InputFieldType.number &&
            event.preventDefault();
          break;
        case KeyboardKeyName.Enter:
          currentElement.type === InputFieldType.number &&
            event.preventDefault();
          const nextElement = inputElements.at(
            inputElements.indexOf(currentElement) + 1,
          );

          if (nextElement) {
            (document.activeElement as HTMLInputElement).blur();
            nextElement.focus();
          }
          break;
        default:
          break;
      }
    }
  },
  []);

  const ReadOnlyCell = useCallback(
    (props: CellContext<any, string | number | null>) => {
      const isDate = !!props.column.columnDef.meta?.isDate;
      const value =
        isDate && !!props.getValue()
          ? moment(props.getValue()).format('YYYY-MM-DD')
          : props.getValue();
      return <div className="px-4">{value}</div>;
    },
    [],
  );

  const EditableCell = useCallback(function (
    props: CellContext<any, string | number | null>,
  ) {
    const {
      getValue,
      column: { id },
      table,
    } = props;
    const initialValue = getValue();
    const [value, setValue] = useState(initialValue);
    const [isActive, setIsActive] = useState(false);

    const onBlur = () => {
      setIsActive(false);
      const recordId = props.row.original?.id;
      const groupName = props.column.columnDef.meta?.groupParent || '';
      table.options.meta?.updateMarkerRecord(recordId, id, value, groupName);
    };

    useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);

    return (
      <input
        value={(value as string) || ''}
        onChange={(e) => setValue(e.target.value)}
        onDoubleClick={() => setIsActive(true)}
        onFocus={(e) => {
          e.target.select();
          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
        onBlur={onBlur}
        id={props.cell.id + '_input'}
        onKeyDown={(e) => handleKeyDown(e, props.cell, isActive, setIsActive)}
        className={`min-w-[7rem] h-full pl-4 focus:px-1 focus:w-full ${
          isActive ? 'outline-none' : ''
        }`}
      />
    );
  },
  []);

  const UnifiedProductCodeCell = useCallback(function (
    props: CellContext<any, string | number | null>,
  ) {
    const {
      getValue,
      column: { id },
      table,
    } = props;
    const initialValue = getValue();
    const [value, setValue] = useState(initialValue);
    const [isActive, setIsActive] = useState(false);

    const openModal = () => {
      const recordId = props.row.original?.id;
      const groupName = props.column.columnDef.meta?.groupParent || '';
      const dependentAttributes =
        props.column.columnDef.meta?.dependentAttributes || [];
      table.options.meta?.updateProductDetail(
        recordId,
        groupName,
        String(value),
        dependentAttributes,
      );
    };

    const onBlur = () => {
      setIsActive(false);
      const recordId = props.row.original?.id;
      const groupName = props.column.columnDef.meta?.groupParent || '';
      table.options.meta?.updateMarkerRecord(recordId, id, value, groupName);
      if (!value) {
        const dependentAttributes =
          props.column.columnDef.meta?.dependentAttributes || [];
        table.options.meta?.clearProductDetails(
          recordId,
          groupName,
          dependentAttributes,
        );
      }
    };

    useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);

    return (
      <>
        <input
          value={(value as string) || ''}
          onChange={(e) => setValue(e.target.value)}
          onDoubleClick={() => setIsActive(true)}
          onFocus={(e) => {
            e.target.select();
            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          onBlur={onBlur}
          id={props.cell.id + '_input'}
          onKeyDown={(e) => handleKeyDown(e, props.cell, isActive, setIsActive)}
          className={`min-w-[7rem] h-full pl-4 focus:px-1 focus:w-full ${
            isActive ? 'outline-none' : ''
          }`}
        />
        {value && (
          <Image
            src={exportIcon}
            alt="Open product details popup"
            className="cursor-pointer hover:brightness-50 ml-1 mr-4"
            onClick={openModal}
          />
        )}
      </>
    );
  },
  []);

  const EditableNumberCell = useCallback(function (
    props: CellContext<any, number | null>,
  ) {
    const {
      getValue,
      column: { id },
      table,
    } = props;
    const initialValue = getValue();
    const [value, setValue] = useState(initialValue);
    const [isActive, setIsActive] = useState(false);

    const onBlur = () => {
      setIsActive(false);
      const recordId = props.row.original?.id;
      const groupName = props.column.columnDef.meta?.groupParent || '';
      table.options.meta?.updateMarkerRecord(recordId, id, value, groupName);
    };

    useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);

    return (
      <input
        defaultValue={value || ''}
        type="number"
        onChange={(e) => setValue(Number(e.target.value))}
        onDoubleClick={() => setIsActive(true)}
        onBlur={onBlur}
        onFocus={(e) => {
          e.target.select();
          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
        id={props.cell.id + '_input'}
        onKeyDown={(e) => handleKeyDown(e, props.cell, isActive, setIsActive)}
        onWheel={() => {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }}
        className={`min-w-[7rem] h-full pl-4 focus:px-1 focus:w-full ${
          isActive ? 'outline-none' : ''
        }`}
      />
    );
  },
  []);

  const EditableCellDataInput = useCallback(function (
    props: CellContext<any, string | number | null>,
  ) {
    const {
      getValue,
      column: { id },
      table,
    } = props;
    const initialValue = getValue();
    const [value, setValue] = useState(initialValue);
    const [isActive, setIsActive] = useState(false);

    const onBlur = () => {
      setIsActive(false);
      const resultId = props.row.original?.id;
      const dataSetName = props.column.columnDef.meta?.datasetName || '';
      const groupName = props.column.columnDef.meta?.groupParent || '';
      const groupDisplayName =
        props.column.columnDef.meta?.groupDisplayName || '';
      table.options.meta?.updateMarkerResult(
        resultId,
        dataSetName,
        id,
        value,
        groupName,
        groupDisplayName,
      );
    };

    useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);

    return (
      <input
        value={(value as string) || ''}
        onChange={(e) => setValue(e.target.value)}
        onDoubleClick={() => setIsActive(true)}
        onFocus={(e) => {
          e.target.select();
          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
        onBlur={onBlur}
        id={props.cell.id + '_input'}
        onKeyDown={(e) => handleKeyDown(e, props.cell, isActive, setIsActive)}
        className={`min-w-[7rem] h-full pl-4 focus:px-1 focus:w-full ${
          isActive ? 'outline-none' : ''
        }`}
      />
    );
  },
  []);

  const EditableNumberCellDataInput = useCallback(function (
    props: CellContext<any, number | null>,
  ) {
    const {
      getValue,
      column: { id },
      table,
    } = props;
    const initialValue = getValue();
    const [value, setValue] = useState(initialValue);
    const [isActive, setIsActive] = useState(false);

    const onBlur = () => {
      setIsActive(false);
      const resultId = props.row.original?.id;
      const dataSetName = props.column.columnDef.meta?.datasetName || '';
      const groupName = props.column.columnDef.meta?.groupParent || '';
      const groupDisplayName =
        props.column.columnDef.meta?.groupDisplayName || '';
      const isArray = !!props.column.columnDef.meta?.isArray;
      table.options.meta?.updateMarkerResult(
        resultId,
        dataSetName,
        id,
        value,
        groupName,
        groupDisplayName,
        isArray,
      );
    };

    useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);

    return (
      <input
        defaultValue={value || ''}
        type="number"
        onChange={(e) => setValue(Number(e.target.value))}
        onDoubleClick={() => setIsActive(true)}
        onBlur={onBlur}
        onFocus={(e) => {
          e.target.select();
          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
        id={props.cell.id + '_input'}
        onKeyDown={(e) => handleKeyDown(e, props.cell, isActive, setIsActive)}
        onWheel={() => {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }}
        className={`min-w-[7rem] h-full pl-4 focus:px-1 focus:w-full ${
          isActive ? 'outline-none' : ''
        }`}
      />
    );
  },
  []);

  const GroupParentCell = useCallback((props: CellContext<any, any>) => {
    const { cell, table, row } = props;
    const allowResultSelection =
      !!cell.column.columnDef.meta?.allowResultSelection;
    const groupDisplayName = cell.column.columnDef.meta?.displayName;
    const groupName = cell.column.columnDef.meta?.datasetName
      ? cell.column.id?.split('.')?.at(1)
      : cell.column.id;

    if (!allowResultSelection) return null;
    return (
      <span className="w-full">
        <Image
          src={openResultsIcon}
          alt="Open results selection screen"
          onClick={() =>
            table.options.meta?.openResultSelector(
              row?.original?.markerId,
              groupName,
              groupDisplayName,
            )
          }
          className="ml-auto rounded hover:brightness-75 cursor-pointer"
        />
      </span>
    );
  }, []);

  const groupParentHeader = useCallback(function <rowData>(
    props: HeaderContext<rowData, unknown>,
  ) {
    const areChildrenVisible = props.table
      .getAllColumns()
      .filter((col) => col.columnDef?.meta?.groupParent === props.column.id)
      .every((col) => col.getIsVisible());
    return (
      <div className="h-full flex items-center gap-4">
        <button
          type="button"
          className="h-8 w-8 flex justify-center items-center bg-white rounded border-2 border-gray-300"
          onClick={() => {
            const rowNameArray = props.table
              .getAllColumns()
              .filter(
                (col) => col.columnDef?.meta?.groupParent === props.column.id,
              )
              .map((col) => col.id);

            const rowNameObj: Record<string, boolean> | Record<string, never> =
              {};
            rowNameArray.forEach((row) => {
              rowNameObj[row] = !areChildrenVisible;
            });

            props.table.setColumnVisibility((old) => {
              return {
                ...old,
                ...rowNameObj,
              };
            });
          }}
        >
          <Image
            src={leftArrowIcon}
            alt={areChildrenVisible ? 'Collapse group' : 'Expand group'}
            width={20}
            height={20}
            className={`${
              areChildrenVisible ? 'rotate-[270deg]' : 'rotate-180'
            } transition-transform`}
          />
        </button>
        {props.column.columnDef?.meta?.displayName}
      </div>
    );
  },
  []);

  const groupParentHeaderDataInput = useCallback(function <rowData>(
    props: HeaderContext<rowData, unknown>,
  ) {
    const areChildrenVisible = props.table
      .getAllColumns()
      .filter(
        (col) =>
          (col.columnDef?.meta?.datasetName
            ? `${col.columnDef?.meta?.datasetName}.${col.columnDef?.meta?.groupParent}`
            : col.columnDef?.meta?.groupParent) === props.column.id,
      )
      .every((col) => col.getIsVisible());
    return (
      <div className="h-full flex items-center gap-4">
        <button
          type="button"
          className="h-8 w-8 flex justify-center items-center bg-white rounded border-2 border-gray-300"
          onClick={() => {
            const rowNameArray = props.table
              .getAllColumns()
              .filter(
                (col) =>
                  (col.columnDef?.meta?.datasetName
                    ? `${col.columnDef?.meta?.datasetName}.${col.columnDef?.meta?.groupParent}`
                    : col.columnDef?.meta?.groupParent) === props.column.id,
              )
              .map((col) => col.id);

            const rowNameObj: Record<string, boolean> | Record<string, never> =
              {};
            rowNameArray.forEach((row) => {
              rowNameObj[row] = !areChildrenVisible;
            });

            props.table.setColumnVisibility((old) => {
              return {
                ...old,
                ...rowNameObj,
              };
            });
          }}
        >
          <Image
            src={leftArrowIcon}
            alt={areChildrenVisible ? 'Collapse group' : 'Expand group'}
            width={20}
            height={20}
            className={`${
              areChildrenVisible ? 'rotate-[270deg]' : 'rotate-180'
            } transition-transform`}
          />
        </button>
        {props.column.columnDef?.meta?.displayName}
      </div>
    );
  },
  []);

  const computeClassName = useCallback(
    (sequenceNo: string, isHeader: boolean, isGroupParent = false) => {
      let conditionalClassName = '';
      if (sequenceNo === '0') {
        conditionalClassName = 'first-row';
      } else if (sequenceNo === '1') {
        conditionalClassName = 'second-row';
      } else if (sequenceNo === '2') {
        conditionalClassName = 'third-row';
      } else if (sequenceNo === '3') {
        conditionalClassName = 'fourth-row';
      }
      if (isGroupParent) {
        conditionalClassName = `group-parent ${
          isHeader ? 'border-r' : 'border-x-0'
        }`;
      }
      return conditionalClassName;
    },
    [],
  );

  return {
    ReadOnlyCell,
    EditableCell,
    EditableNumberCell,
    EditableCellDataInput,
    EditableNumberCellDataInput,
    GroupParentCell,
    groupParentHeader,
    groupParentHeaderDataInput,
    computeClassName,
    UnifiedProductCodeCell,
  };
}
