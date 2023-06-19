import Image from 'next/image';

const RocNumberInput = (props: {
  className: string;
  required: boolean;
  value: string;
  onChange: any;
  onBlur: any;
  name: string;
  error: boolean;
  read_only?: boolean;
  label?: string;
  isImage: boolean;
}) => {
  const {
    className,
    required = false,
    value,
    onChange,
    onBlur,
    name,
    error,
    read_only = false,
    label = 'Number',
    isImage,
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
        {isImage && (
          <Image
            src="/icons/phone-icon.svg"
            alt="Phone icon"
            width={24}
            height={24}
            className="absolute top-3 left-4 pointer-events-none"
          />
        )}
        {!read_only && (
          <label
            className={`font-normal text-base leading-6 text-gray-600 absolute top-3 left-12 pointer-events-none origin-top-left transition-all duration-200 group-focus-within:shrunk-label ${
              value ? 'shrunk-label' : ''
            } ${error && 'text-red-500'}`}
          >
            {label}
          </label>
        )}
      </div>
    </>
  );
};
export default RocNumberInput;
