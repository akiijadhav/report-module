import {
  Dispatch,
  ReactElement,
  SetStateAction,
  useEffect,
  useState,
} from 'react';
import Image from 'next/image';
import { useFormik } from 'formik';
import { useRouter } from 'next/router';
import axios, { Axios, AxiosResponse } from 'axios';
import successIcon from '../../public/icons/success-icon.svg';
import failureIcon from '../../public/icons/failure-icon.svg';
import crossIcon from '../../public/icons/cross-icon.svg';
import useRequestUtilities from '../hooks/use-request-utilities';
import { useTranslation } from 'react-i18next';
import RocTextInput from '../forms/text-input';
import profileImage from '../../public/icons/profile-image.svg';
import RocNumberInput from '../forms/number-input';

let selectFileName: string;

export default function EditProfile({ children }: { children?: ReactElement }) {
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState();
  const [userName, setUserName] = useState();
  const [userPhone, setUserPhone] = useState();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadUrl, setUploadUrl] = useState(null);
  const [imguploadPath, setImgUploadPath] = useState('');
  const [currentProfilePhoto, setCurrentProfilePhoto] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [messageObj, setMessageObj] = useState({
    message: '',
    isSuccess: false,
  });
  const { fetchWrapper } = useRequestUtilities();
  // const [selectedImageUrl, setSelectedImageUrl] = useState(null);

  const router = useRouter();
  const { t, i18n } = useTranslation();

  async function getUserDetails() {
    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.ok) {
        const userInfo = resJson;
        const lowerCaseUserInfo = {
          name: userInfo?.Name,
          email: userInfo?.Email,
          contact: userInfo?.Contact,
          profilePhoto: userInfo?.ProfilePhoto,
          role: userInfo?.Role,
        };
        localStorage.setItem('userInfo', JSON.stringify(lowerCaseUserInfo));
        setUserInfo(resJson);
      }
    }
    function handleError(_error: any) {
      console.log('err', _error);
    }

    fetchWrapper({
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/profile`,
      includeAuthToken: true,
      handleResponse,
      handleError,
    });
  }
  useEffect(() => {
    getUserDetails();
  }, []);

  useEffect(() => {
    setUserEmail(userInfo?.Email);
    setUserName(userInfo?.Name);
    setUserPhone(userInfo?.Contact);
  }, [userInfo]);
  async function fetchSignedUrl() {
    async function handleResponse(response: Response) {
      if (response.ok) {
        const resJson = await response.json();
        setCurrentProfilePhoto(resJson?.SignedUrl);
      }
    }
    function handleError(_error: any) {
      return;
    }

    fetchWrapper({
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/upload-url`,
      includeAuthToken: true,
      method: 'POST',
      applicationIdentifier: 'cms-web-app',
      body: {
        FileName: String(userInfo?.ProfilePhoto),
        Value: 'get',
      },
      handleResponse,
      handleError,
    });
  }

  useEffect(() => {
    if (userInfo?.ProfilePhoto) {
      fetchSignedUrl();
    }
  }, [userInfo?.ProfilePhoto]);

  const submitHandler = async (values) => {
    const selectedImageUrl = selectedFile && (await uploadProfileImage());
    function initiate() {
      setIsLoading(true);
    }
    async function handleResponse(response: Response) {
      // const resJson = await response.json();
      if (response.ok) {
        setIsLoading(false);
        getUserDetails();

        setMessageObj({
          message: t('error.profile_update_successfull'),
          isSuccess: true,
        });
      } else {
        setIsLoading(false);
        setMessageObj({
          message: t('error.something_went_wrong'),
          isSuccess: false,
        });
      }
    }
    function handleError(_error: any) {
      setIsLoading(false);
      setMessageObj({
        message: t('error.something_went_wrong'),
        isSuccess: false,
      });
    }
    function handleFinally() {
      setIsLoading(false);
    }

    fetchWrapper({
      method: 'PUT',
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/profile`,

      includeAuthToken: true,
      body: {
        Name: values.name,
        Contact: values.phone ? String(values.phone) : null,
        ProfilePhoto: selectedFile
          ? selectedImageUrl.status === 200
            ? `${selectFileName}`
            : ''
          : userInfo?.ProfilePhoto,
      },

      handleResponse,
      handleError,
      initiate,
      handleFinally,
    });
  };
  const validationHandler = ({
    name,
    phone,
  }: {
    name: string;
    phone: string;
  }) => {
    const errors: { name?: string; phone?: string } = {};

    if (!name) {
      errors.name = t('error.enter_full_name');
    }

    return errors;
  };
  const formik = useFormik({
    initialValues: {
      name: userName,
      phone: userPhone,
    },
    validate: validationHandler,
    onSubmit: submitHandler,
    enableReinitialize: true,
  });

  async function uploadProfileImage() {
    if (uploadUrl && selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // const croppedFile = dataURLtoFile(reader.result, selectedFile.type);
      const dataURLtoFile = (dataurl, fileType = 'image/*') => {
        const byteString = atob(dataurl.split(',')[1]);
        const arrayBuffer = new ArrayBuffer(byteString?.length);
        const ia = new Uint8Array(arrayBuffer);
        for (let i = 0; i < byteString?.length; i += 1) {
          ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([arrayBuffer], { type: fileType });
      };

      const myPromise: Promise<AxiosResponse<any, any>> = new Promise(
        (resolve) => {
          const reader = new FileReader();

          reader.readAsDataURL(selectedFile);

          reader.onload = async () => {
            const croppedFile = dataURLtoFile(reader.result, selectedFile.type);
            // function handleError(err) {
            //   console.log('error', err);
            // }
            // async function handleResponse(response: Response) {

            //   // const resJson = await response.json();
            //   console.log('imageUpload', response);
            // }
            // fetchWrapper({
            //   url: uploadUrl,
            //   'Content-Type': selectedFile.type,
            //   body: croppedFile,

            //   includeAuthToken: false,

            //   handleResponse,
            //   handleError,
            //   method: 'PUT',
            // });

            const options = {
              method: 'PUT',
              url: uploadUrl,
              headers: { 'Content-Type': selectedFile.type },
              data: croppedFile,
              // onUploadProgress: (progressEvent) => {
              //   const progressE = Math.round(
              //     (progressEvent.loaded * 100) / progressEvent.total,
              //   );
              //   // setProgress(progressE);
              // },
            };

            const res = await axios(options);
            resolve(res);

            // return res;
          };
        },
      );
      const myPromiseRes = await myPromise;

      return myPromiseRes;
    }
  }

  async function getSignedUrl(file) {
    const date = Math.round(new Date().getTime() / 1000);
    selectFileName = file?.name + date;

    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.ok) {
        setUploadUrl(resJson?.SignedUrl);
        setSelectedFile(file);
      } else {
        console.log('err', resJson?.message);
      }
    }
    function handleError(_error: any) {
      console.log('error', _error);
    }

    fetchWrapper({
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/upload-url`,
      includeAuthToken: true,
      method: 'POST',
      applicationIdentifier: 'cms-web-app',
      body: {
        FileName: selectFileName,
        Value: 'put',
      },
      handleResponse,
      handleError,
    });
  }

  const handleUploadImage = async (event) => {
    setImgUploadPath(null);
    setSelectedFile(null);

    if (event.target.files && event.target.files[0]) {
      const imgPath = event.target.files[0];

      setSelectedFile(event.target.files[0]);
      setImgUploadPath(URL.createObjectURL(imgPath));

      getSignedUrl(event.target.files[0]);
    }
  };

  const handleRemoveImage = () => null;

  return (
    <>
      <div className="flex flex-col">
        <div className="flex flex-row items-center">
          <img
            className="rounded-full w-20 aspect-square"
            src={
              selectedFile
                ? imguploadPath
                : userInfo?.ProfilePhoto
                ? currentProfilePhoto
                : '/icons/profile-image.svg'
            }
            loading="lazy"
            alt="profile"
            height="120"
          />

          <label className="font-semibold text-gray-800 border rounded border-[#D1D5DB] px-2 py-1 ml-6 h-7 text-sm">
            <input
              type="file"
              hidden
              onChange={(event) => {
                setSelectedFile(event.target.files[0]);
                handleUploadImage(event);
              }}
            />
            {t('profile.upload_photo')}
          </label>

          {selectedFile && (
            <p
              className="ml-4 text-[13px] font-semibold text-[#0284C7]"
              onClick={handleRemoveImage}
            >
              Remove Photo
            </p>
          )}
        </div>
        <hr className="border border-gray-200 w-[501px] mt-6" />
        <form onSubmit={formik.handleSubmit}>
          <div className="mt-10 relative w-full flex flex-col group">
            {/* <Image src={profileImage} alt="Profile image" /> */}
            <RocTextInput
              name="name"
              label={`${t('profile.full_name')}`}
              className="h-12 w-full rounded border border-gray-300 pl-12"
              required={false}
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && !!formik.errors.name}
              isImage={true}
            />

            {formik.touched.name && formik.errors.name && (
              <p className={`font-normal text-xs text-red-600 pl-4 `}>
                {formik.errors.name as string}
              </p>
            )}
          </div>
          <div className="mt-10 relative w-full flex flex-col group">
            <RocNumberInput
              className="h-12 w-full rounded border border-gray-300 pl-12"
              name="phone"
              required={false}
              isImage={true}
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.phone && !!formik.errors.phone}
              label={`${t('profile.phone_number')}`}
            />
            {formik.touched.phone && formik.errors.phone && (
              <p className={`font-normal text-xs text-red-600 pl-4 -mt-5`}>
                {formik.errors.phone as string}
              </p>
            )}
          </div>
          <div className="mt-10">
            <p className="text-sm font-normal text-gray-600 mt-6">
              {t('profile.email_id')}
            </p>
            <p className="text-base font-normal text-gray-800 ">
              {userEmail || ''}
            </p>
          </div>
          <hr className="border border-gray-200 w-[501px] mt-10" />
          <div className="flex flex-row mt-10">
            <button
              type="submit"
              className={`rounded bg-[#0284C7] h-10 w-34 text-white font-semibold text-base px-2 py-1 p-3 mr-4 ${
                isLoading
                  ? 'bg-gray-300 cursor-not-allowed pointer-events-none'
                  : ''
              }`}
              disabled={isLoading}
            >
              {t('profile.update_profile')}
            </button>
            <button
              className=" border rounded border-[#D1D5DB] px-2 py-1 h-10 w-34 text-gray-800 font-semibold text-base p-3"
              onClick={() => router.push('/users')}
            >
              {t('profile.cancel')}
            </button>
          </div>
          {messageObj?.message && (
            <div className="fixed bottom-4 left-4 px-4 py-2 bg-white shadow-lg rounded flex items-center gap-3 text-center font-normal text-sm leading-7 text-gray-800">
              <Image
                src={messageObj?.isSuccess ? successIcon : failureIcon}
                alt={messageObj?.isSuccess ? 'Success icon' : 'Failure icon'}
              />
              <p>{messageObj.message}</p>
              <Image
                src={crossIcon}
                alt="Close edit profile form"
                width={16}
                height={16}
                className="w-4 h-4 cursor-pointer rounded hover:bg-gray-100"
                onClick={
                  () =>
                    setMessageObj({
                      message: '',
                      isSuccess: false,
                    })
                  // setUserUpdateMsg({ isError: false, msg: '', userName: '' })
                }
              />
            </div>
          )}
        </form>
      </div>
    </>
  );
}
