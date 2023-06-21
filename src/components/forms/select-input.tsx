const RocSelectInput = (props: {
  className?: string;
  required?: boolean;
  value?: string;
  onChange?: any;
  onBlur?: any;
  name?: string;
  error?: boolean;
  read_only?: boolean;
  label?: string;
  options?: { Name: string }[];
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
    label,
    options,
  } = props;

  return (
    <>
      <select
        name={name}
        className={`w-[282px] rounded border border-gray-300  bg-white h-12  text-gray-600  ${className} ${
          error && 'border-red-500'
        }`}
        required={required}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      >
        <option selected disabled></option>
        {options?.map((item) => (
          <>
            <option value={item.Name}>{item.Name}</option>
          </>
        ))}
      </select>
      <label
        className={`font-normal text-base leading-6 text-gray-600 absolute top-3 left-9 pointer-events-none origin-top-left transition-all duration-200 group-focus-within:shrunk-label ${
          value ? 'shrunk-label' : ''
        } ${error && 'text-red-500'}`}
      >
        {label}
      </label>
    </>
  );
};
export default RocSelectInput;
