import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './public/locales/en';
import { ja } from './public/locales/ja';

// i18n.use(initReactI18next).init({
//   lng: 'en',
//   fallbackLng: 'en',
//   resources: {
//     en,
//     ja,
//   },
// });
// export default i18n;
function initializeI18n() {
  i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
      en,
      ja,
    },
  });
  return i18n;
}

export default initializeI18n;
