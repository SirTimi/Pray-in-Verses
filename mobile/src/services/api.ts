const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  'https://api.prayinverses.com/api';

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

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const {
    headers,
    ...rest
  } = options;

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...rest,

      // Match the web application's authentication contract.
      // The server owns the HTTP-only auth cookie and the native app
      // sends it back on protected requests just like the web client.
      credentials: 'include',

      headers: {
        Accept: 'application/json',

        ...(rest.body
          ? {
              'Content-Type':
                'application/json',
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
    const message =
      Array.isArray(data?.message)
        ? data.message.join(', ')
        : data?.message ??
          data?.error ??
          'Something went wrong';

    throw new ApiError(
      message,
      response.status,
      data,
    );
  }

  return data as T;
}
