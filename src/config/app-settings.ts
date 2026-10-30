export type AppSettings =
  | {
      readonly reviewsService: 'fake';
      readonly useSeedData: boolean;
    }
  | {
      readonly reviewsService: 'http';
      readonly reviewsBaseUrl: string;
      readonly useSeedData: false;
    };

export type PublicEnvironment = Readonly<
  Record<string, string | boolean | undefined> //specifies keys and its values e.g., Record<key, value(s)>
>;

export function parseAppSettings(env: PublicEnvironment): AppSettings {
  const serviceValue = readString(env.VITE_REVIEWS_SERVICE).toLowerCase();
  const reviewsService = serviceValue === '' ? 'fake' : serviceValue; //if serviceValue is empty return fake and if its not return the passed serviceValue from prev line
  if (reviewsService !== 'fake' && reviewsService !== 'http') {
    throw new Error(
      'VITE_REVIEWS_SERVICE must be either "fake" or "http" when set.',
    );
  }

  const useSeedData = parseBoolean(
    //value and its name e.g, true and VITE_USE_SEED_DATA
    env.VITE_USE_SEED_DATA,
    'VITE_USE_SEED_DATA',
  );
  const baseUrlValue = readString(env.VITE_REVIEWS_BASE_URL);

  if (reviewsService === 'fake') {
    if (baseUrlValue !== '') {
      throw new Error(
        'VITE_REVIEWS_BASE_URL is only valid when VITE_REVIEWS_SERVICE is "http".',
      );
    }
    return { reviewsService, useSeedData };
  }

  if (useSeedData) {
    throw new Error(
      'VITE_USE_SEED_DATA cannot be enabled for the HTTP review service.',
    );
  }
  return {
    reviewsService,
    reviewsBaseUrl: parseFunctionsBaseUrl(baseUrlValue),
    useSeedData: false,
  };
}

function parseBoolean(
  value: string | boolean | undefined,
  name: string,
): boolean {
  if (value === undefined || value === '' || value === false) return false;
  if (value === true || value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${name} must be either "true" or "false" when set.`);
}

function parseFunctionsBaseUrl(value: string): string {
  if (value === '') {
    throw new Error(
      'VITE_REVIEWS_BASE_URL is required for the HTTP review service.',
    );
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('VITE_REVIEWS_BASE_URL must be an absolute URL.');
  }

  if (
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    url.username !== '' ||
    url.password !== '' ||
    url.search !== '' ||
    url.hash !== ''
  ) {
    throw new Error(
      'VITE_REVIEWS_BASE_URL must be a plain HTTP(S) URL without credentials, query or fragment.',
    );
  }

  const pathname = url.pathname.replace(/\/+$/, '');
  if (!pathname.endsWith('/api')) {
    throw new Error(
      'VITE_REVIEWS_BASE_URL must end with the Functions /api path.',
    );
  }

  url.pathname = pathname;
  return url.toString().replace(/\/$/, '');
}

function readString(value: string | boolean | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

export const appSettings = parseAppSettings(import.meta.env);
