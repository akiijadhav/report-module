import Image from 'next/image';

const TextInput = (props: {
  className: string;
  required: boolean;
  value: string;
  onChange: any;
  onBlur: any;
  name: string;
  error: boolean;
  read_only?: boolean;
  label?: string;
  isImage?: boolean;
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
    label = 'Text',
  } = props;
  return (
    <>
      <div className="relative  flex flex-col group">
        <input
          type={'text'}
          name={name}
          className={`${className} ${error && 'border-red-500'}`}
          required={required}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          readOnly={read_only}
        />

        <label
          className={`font-normal text-base leading-6 text-gray-400 absolute top-3 pl-4 pointer-events-none origin-top-left transition-all duration-200 group-focus-within:shrunk-label-without-image group-focus-within:text-gray-600  ${
            value ? 'shrunk-label-without-image text-gray-600' : ''
          } ${error && 'text-red-500'}`}
        >
          {label}
        </label>
      </div>
    </>
  );
};
export default TextInput;
