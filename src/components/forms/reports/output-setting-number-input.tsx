import Image from 'next/image';

const OutputSettingNumberInput = (props: {
  className: string;
  required: boolean;
  value: string;
  onChange: any;
  onBlur: any;
  name: string;
  error: boolean;
  read_only?: boolean;
  label?: string;
}) => {
  const {
    className,
    required,
    value,
    onChange,
    onBlur,
    name,
    error,
    read_only = false,
    label = 'Number',
  } = props;

  return (
    <>
      <div className="relative  flex flex-col group">
        <input
          type={'number'}
          name={name}
          className={`${className} ${error && 'border-red-500'}`}
          required={required}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onWheel={() => {
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
          }}
          readOnly={read_only}
        />

        {!read_only && (
          <label
            className={`font-normal text-base leading-6 text-gray-400 absolute top-3 left-9 pointer-events-none origin-top-left transition-all duration-200 group-focus-within:shrunk-label group-focus-within:text-gray-600 ${
              value ? 'shrunk-label text-gray-600' : ''
            } ${error && 'text-red-500'}`}
          >
            {label}
          </label>
        )}
      </div>
    </>
  );
};
export default OutputSettingNumberInput;
