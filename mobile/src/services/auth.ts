import {
  apiRequest,
  ApiError,
} from './api';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  createdAt?: string;
};

type LoginResponse = {
  user: AuthUser;
};

type MeResponse = {
  data: AuthUser & {
    createdAt: string;
  };
};

type SignupResponse = AuthUser & {
  createdAt: string;
};

export async function login(
  email: string,
  password: string,
) {
  await apiRequest<LoginResponse>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    },
  );

  try {
    return await getMe();
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 401
    ) {
      throw new ApiError(
        'Sign in succeeded, but the device could not establish a session. Please try again.',
        401,
        error.data,
      );
    }

    throw error;
  }
}

export async function getMe() {
  const result = await apiRequest<MeResponse>(
    '/auth/me',
  );

  return result.data;
}

export async function updateProfile(
  displayName: string,
) {
  const result = await apiRequest<MeResponse>(
    '/auth/me',
    {
      method: 'PATCH',
      body: JSON.stringify({
        displayName,
      }),
    },
  );

  return result.data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  const result = await apiRequest<LoginResponse>(
    '/auth/change-password',
    {
      method: 'POST',
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    },
  );

  return result.user;
}

export async function logout() {
  await apiRequest<{ ok: true }>(
    '/auth/logout',
    {
      method: 'POST',
    },
  );
}

export async function signup(
  displayName: string,
  email: string,
  password: string,
) {
  return apiRequest<SignupResponse>(
    '/auth/signup',
    {
      method: 'POST',
      body: JSON.stringify({
        displayName,
        email,
        password,
      }),
    },
  );
}

export async function forgotPassword(
  email: string,
) {
  return apiRequest<{ ok: true }>(
    '/auth/forgot-password',
    {
      method: 'POST',
      body: JSON.stringify({
        email,
      }),
    },
  );
}

export async function resetPassword(
  token: string,
  newPassword: string,
) {
  return apiRequest<{ ok: true }>(
    '/auth/reset-password',
    {
      method: 'POST',
      body: JSON.stringify({
        token,
        newPassword,
      }),
    },
  );
}
