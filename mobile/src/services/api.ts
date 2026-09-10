import * as SecureStore from 'expo-secure-store';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  'https://api.prayinverses.com/api';

const TOKEN_KEY =
  'piv.access_token';

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

export async function saveAccessToken(
  token: string,
) {
  await SecureStore.setItemAsync(
    TOKEN_KEY,
    token,
  );
}

export async function removeAccessToken() {
  await SecureStore.deleteItemAsync(
    TOKEN_KEY,
  );
}

type ApiRequestOptions =
  RequestInit & {
    authenticated?: boolean;
  };

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    authenticated = true,
    headers,
    ...rest
  } = options;

  const token =
    authenticated
      ? await getAccessToken()
      : null;

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...rest,

      headers: {
        Accept: 'application/json',

        ...(rest.body
          ? {
              'Content-Type':
                'application/json',
            }
          : {}),

        ...(token
          ? {
              Authorization:
                `Bearer ${token}`,
            }
          : {}),

        ...(headers ?? {}),
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
      await removeAccessToken();
    }

    const message =
      Array.isArray(data?.message)
        ? data.message.join(', ')
        : data?.message ??
          'Something went wrong';

    throw new ApiError(
      message,
      response.status,
      data,
    );
  }

  return data as T;
}