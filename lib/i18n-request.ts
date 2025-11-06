import {getRequestConfig} from 'next-intl/server';
import {headers} from 'next/headers';

export default getRequestConfig(async () => {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language');
  
  // Parse the accept-language header
  const locale = acceptLanguage?.split(',')[0]?.split('-')[0] || 'id';
  
  // Validate against supported locales
  const supportedLocales = ['en', 'id'];
  const validLocale = supportedLocales.includes(locale) ? locale : 'id';
 
  return {
    locale: validLocale,
    messages: (await import(`../messages/${validLocale}.json`)).default
  };
});