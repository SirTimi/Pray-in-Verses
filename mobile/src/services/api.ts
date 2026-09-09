import * as SecureStore from 'expo-secure-store';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://api.prayinverses.com/api';

const TOKEN_KEY = 'piv_access_token';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(
    message: string,
    status: number,
    data: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(
    TOKEN_KEY,
  );
}

export async function setAccessToken(
  token: string,
) {
  await SecureStore.setItemAsync(
    TOKEN_KEY,
    token,
  );
}

export async function clearAccessToken() {
  await SecureStore.deleteItemAsync(
    TOKEN_KEY,
  );
}

type ApiOptions = RequestInit & {
  authenticated?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const {
    authenticated = true,
    headers,
    ...requestOptions
  } = options;

  const token =
    authenticated
      ? await getAccessToken()
      : null;

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...requestOptions,

      headers: {
        Accept: 'application/json',
        'Content-Type':
          'application/json',

        ...(token
          ? {
              Authorization:
                `Bearer ${token}`,
            }
          : {}),

        ...(headers || {}),
      },
    },
  );

  const text =
    await response.text();

  let data: any = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (
      response.status === 401 &&
      authenticated
    ) {
      await clearAccessToken();
    }

    const message =
      Array.isArray(data?.message)
        ? data.message.join(', ')
        : data?.message ||
          'Something went wrong';

    throw new ApiError(
      message,
      response.status,
      data,
    );
  }

  return data as T;
}