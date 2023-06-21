import { useState, useEffect } from 'react';
import Image from 'next/image';
import Modal from '../ui/modal';
import { useRouter } from 'next/router';
import useRequestUtilities from '../hooks/use-request-utilities';
import { useTranslation } from 'react-i18next';

export default function UserInviteModal({ setInviteScreen }) {
  const [formValues, setFormValues] = useState([
    { Email: '', Name: '', Contact: null },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState({
    errorMessage: '',
    userCount: false,
    isValidEmail: true,
  });
  const [isShowAddButton, setIsShowAddButton] = useState(true);
  const router = useRouter();
  const { fetchWrapper } = useRequestUtilities();
  const { t } = useTranslation();

  const handleChange = (indx, e) => {
    const newFormValues = [...formValues];

    newFormValues[indx][e.target.name] = e.target.value;
    setFormValues(newFormValues);
    setIsError({ ...isError, errorMessage: '' });
  };
  const handleScreen = () => {
    setOpen(false), setInviteScreen('invisible');
  };

  const handleRowAdd = () => {
    if (formValues.length < 10) {
      setFormValues([...formValues, { Email: '', Name: '', Contact: null }]);
      setIsError({ ...isError, userCount: false });
    }
  };

  const handleDeleteRow = (index) => {
    const newFormValues = [...formValues];
    if (formValues.length > 1) {
      newFormValues.splice(index, 1);
      setFormValues(newFormValues);
    }
    if (formValues.length < 10) {
      setIsError({ ...isError, userCount: false });
    }
    if (formValues.length === 1) {
      setFormValues([{ Email: '', Name: '', Contact: null }]);
    }
  };

  useEffect(() => {
    if (formValues.length === 10) {
      setIsError({ ...isError, userCount: true });
      setIsShowAddButton(false);
    }
    if (formValues.length < 10) {
      setIsError({ ...isError, userCount: false });
      setIsShowAddButton(true);
    }
  }, [formValues]);

  const validEmailDomains: string[] = JSON.parse(
    process.env.NEXT_PUBLIC_VALID_EMAIL_DOMAINS,
  );

  const emailValidation = (email) => {
    if (!validEmailDomains.some((domain) => email.endsWith(domain))) {
      setIsError({ ...isError, errorMessage: t('error.only_roche_email') });
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setIsError({
        ...isError,
        errorMessage: t('error.please_enter_correct_email'),
      });
      return false;
    }
    const emailArray = formValues.map((item) => item.Email);
    const isEmailDuplicate = emailArray.some(
      (item) => emailArray.indexOf(item) !== emailArray.lastIndexOf(item),
    );
    if (isEmailDuplicate) {
      setIsError({
        ...isError,
        errorMessage: t('error.duplicate_email'),
      });
      return false;
    }

    return true;
  };

  function validation() {
    return formValues.every((item) => {
      return (
        item.Email !== '' &&
        item.Name.trim() !== '' &&
        emailValidation(item.Email)
      );
    });
  }

  function emptyFieldValidate() {
    return formValues.every(
      (item) => item.Name.trim() !== '' && item.Email !== '',
    );
  }

  const handleSubmit = async () => {
    const validate = validation();
    function initiate() {
      setIsLoading(true);
    }
    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.status === 201) {
        setIsLoading(false);
        const randomToggleTrigger = String(Math.random()).slice(0, 5);
        router.push(`/users?refetch=${randomToggleTrigger}`, '/users');
        setInviteScreen('invisible');
      } else if (response.status === 401) {
        const errorMsg = resJson?.message?.trim();
        setMessage(errorMsg);
      } else {
        const errorMsg = resJson?.error?.trim();
        setMessage(errorMsg || resJson.error[0].message);
      }
    }
    function handleError(_error: any) {
      setMessage(t('error.something_went_wrong'));
    }
    function handleFinally() {
      setIsLoading(false);
    }
    if (validate) {
      fetchWrapper({
        url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/users`,
        method: 'POST',
        body: formValues,
        includeAuthToken: true,
        initiate,
        handleResponse,
        handleError,
        handleFinally,
      });

      setIsError({ ...isError, errorMessage: '' });
      // setInviteScreen("invisible")
    } else {
      if (emptyFieldValidate()) {
        // setIsError({...isError,errorMessage:'Please enter correct email'})
      } else {
        setIsError({
          ...isError,
          errorMessage: t('error.enter_mandatory_field'),
        });
      }
    }
  };

  return (
    <>
      <Modal open={open} setOpen={setOpen}>
        <div className="flex flex-col ">
          <p className="font-semibold text-xl text-gray-800">Invite Users</p>
          <div className=" border-y border-gray-300 mt-6  h-[252px] overflow-y-auto">
            {formValues.map((ele, indx) => (
              <div key={indx} className="flex flex-row mt-8">
                <div className="relative">
                  <input
                    type="email"
                    name="Email"
                    value={ele.Email || ''}
                    className="border border-gray-300 rounded h-12 w-[238px]  pl-9 outline-none"
                    placeholder={`${t('invite_users_modal.email_id')}`}
                    onChange={(e) => handleChange(indx, e)}
                    required
                  />
                  <Image
                    src="/icons/email-icon.svg"
                    alt="Email icon"
                    width={24}
                    height={24}
                    className="absolute top-3 left-2 pointer-events-none"
                  />
                  {ele.Email === '' && (
                    <Image
                      src="/icons/astrik-icon.svg"
                      alt="Email icon"
                      width={6}
                      height={6}
                      className="absolute top-3 right-32 pointer-events-none"
                    />
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    name="Name"
                    value={ele.Name || ''}
                    className="border border-gray-300 rounded h-12 w-[238px] mx-2  pl-8 outline-none"
                    placeholder={`${t('invite_users_modal.full_name')}`}
                    onChange={(e) => handleChange(indx, e)}
                  />
                  <Image
                    src="/icons/profile-icon-default.svg"
                    alt="Profile icon"
                    width={24}
                    height={24}
                    className="absolute top-3 left-3 pointer-events-none"
                  />
                  {ele.Name === '' && (
                    <Image
                      src="/icons/astrik-icon.svg"
                      alt="Email icon"
                      width={6}
                      height={6}
                      className="absolute top-3 right-32 pointer-events-none"
                    />
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    name="Contact"
                    value={ele.Contact || ''}
                    className="border border-gray-300 rounded h-12 w-[238px]  pl-10 appearance-none outline-none"
                    placeholder={`${t('invite_users_modal.phone_number')}`}
                    onChange={(e) => handleChange(indx, e)}
                  />
                  <Image
                    src="/icons/phone-icon.svg"
                    alt="Phone icon"
                    width={24}
                    height={24}
                    className="absolute top-3 left-2 pointer-events-none"
                  />
                </div>
                <div onClick={() => handleDeleteRow(indx)}>
                  <Image
                    src="/icons/cross.svg"
                    alt="Cross icon"
                    width={24}
                    height={24}
                    className="ml-2 pt-3"
                  />
                </div>
              </div>
            ))}
            {isShowAddButton && (
              <button
                className="h-10 w-20 p-3 mt-6 rounded border flex  items-center justify-between border-gray-300 mb-2 font-semibold text-base text-gray-800"
                onClick={handleRowAdd}
              >
                <Image
                  src="/icons/add-black-icon.svg"
                  alt="Add icon"
                  width={12}
                  height={12}
                />
                <span>{t('invite_users_modal.add')}</span>
              </button>
            )}
            {isError && isError.userCount && (
              <p className="mb-4 text-red-500">{t('error.maxi_10_invite')}</p>
            )}
            {isError && isError.errorMessage && (
              <p className="mb-4 text-red-500">{isError.errorMessage}</p>
            )}
          </div>
          <div className="flex justify-end">
            <div className="flex flex-row">
              <button
                className="h-10 min-w-20 p-2 mt-6 rounded border border-gray-300 font-semibold text-base text-gray-800"
                onClick={handleScreen}
              >
                {t('invite_users_modal.cancel')}
              </button>
              <button
                disabled={isLoading}
                className={`h-10 min-w-20 p-2 mt-6 rounded border border-gray-300 ml-8 bg-[#0284C7] font-semibold text-base text-white ${
                  isLoading
                    ? 'cursor-not-allowed pointer-events-none opacity-50'
                    : 'opacity-100'
                }`}
                onClick={handleSubmit}
              >
                {t('invite_users_modal.invite')}
              </button>
            </div>
          </div>
          {message && <p className="text-red-500">{message}</p>}
        </div>
      </Modal>
    </>
  );
}
