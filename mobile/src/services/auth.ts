import {
  apiRequest,
  removeAccessToken,
  saveAccessToken,
} from './api';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
};

type LoginResponse = {
  user: AuthUser;
  accessToken: string;
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
  const result =
    await apiRequest<LoginResponse>(
      '/auth/mobile/login',
      {
        method: 'POST',

        authenticated: false,

        body: JSON.stringify({
          email,
          password,
        }),
      },
    );

  await saveAccessToken(
    result.accessToken,
  );

  return result.user;
}

export async function getMe() {
  const result =
    await apiRequest<MeResponse>(
      '/auth/me',
    );

  return result.data;
}

export async function logout() {
  try {
    await apiRequest(
      '/auth/logout',
      {
        method: 'POST',
      },
    );
  } catch {
    // Native authentication is bearer-token based.
    // Clearing the local token is what ends
    // the mobile session.
  } finally {
    await removeAccessToken();
  }
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
      authenticated: false,

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
      authenticated: false,
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
      authenticated: false,
      body: JSON.stringify({
        token,
        newPassword,
      }),
    },
  );
}