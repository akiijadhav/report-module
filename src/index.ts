import i18n from '../i18n';
export { default as Accordion } from './components/accordions/accordion';
export { i18n }; // Export the i18n instance directly, without default keyword

// No need to call `i18n.init()` here, as it will be called when used in app2
