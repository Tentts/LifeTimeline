/**
 * Crisis lines shown on the support panel. Every entry was checked on the service's official
 * site on 2026-11-22. Re-check them periodically, and verify any new entry at its official source.
 * We never detect the user's location: all lines are listed and the user picks their own.
 */
export interface CrisisLine {
  id: 'us' | 'ca' | 'ukie' | 'es' | 'mx' | 'au';
  name: string;
  phone: string;
  tel: string;
  url: string;
  emergency: string;
}

export const CRISIS_LINES: CrisisLine[] = [
  {
    id: 'us',
    name: '988 Suicide & Crisis Lifeline',
    phone: '988',
    tel: '988',
    url: 'https://988lifeline.org/get-help/',
    emergency: '911',
  },
  {
    id: 'ca',
    name: '9-8-8 Suicide Crisis Helpline',
    phone: '9-8-8',
    tel: '988',
    url: 'https://988.ca/',
    emergency: '911',
  },
  {
    id: 'ukie',
    name: 'Samaritans',
    phone: '116 123',
    tel: '116123',
    url: 'https://www.samaritans.org/how-we-can-help/contact-samaritan/',
    emergency: '999 / 112',
  },
  {
    id: 'es',
    name: 'Línea 024',
    phone: '024',
    tel: '024',
    url: 'https://www.sanidad.gob.es/linea024/home.htm',
    emergency: '112',
  },
  {
    id: 'mx',
    name: 'Línea de la Vida',
    phone: '800 911 2000',
    tel: '8009112000',
    url: 'https://www.gob.mx/lineadelavida',
    emergency: '911',
  },
  {
    id: 'au',
    name: 'Lifeline Australia',
    phone: '13 11 14',
    tel: '131114',
    url: 'https://www.lifeline.org.au/131114',
    emergency: '000',
  },
];

/** International directory, for every country not listed above. */
export const FIND_A_HELPLINE_URL = 'https://findahelpline.com/';
