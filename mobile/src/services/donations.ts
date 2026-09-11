import * as SecureStore from 'expo-secure-store';

import { apiRequest } from './api';

const PENDING_DONATION_KEY =
  'piv.pending-donation.v1';

export type DonationInitPayload = {
  email: string;
  amount: number;
  name?: string;
  message?: string;
};

export type DonationInitResponse = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export type DonationStatus = {
  reference: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
};

export type PendingDonation = {
  reference: string;
  amount: number;
  createdAt: string;
};

export async function initializeDonation(
  payload: DonationInitPayload,
) {
  return apiRequest<DonationInitResponse>(
    '/donations/initialize',
    {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        source: 'mobile',
        callbackPath:
          '/donations/thank-you',
        metadata: {
          surface: 'mobile_support',
        },
      }),
    },
  );
}

export async function getDonationStatus(
  reference: string,
) {
  return apiRequest<DonationStatus>(
    `/donations/${encodeURIComponent(reference)}/status`,
  );
}

export async function savePendingDonation(
  donation: PendingDonation,
) {
  await SecureStore.setItemAsync(
    PENDING_DONATION_KEY,
    JSON.stringify(donation),
  );
}

export async function loadPendingDonation(): Promise<PendingDonation | null> {
  const raw =
    await SecureStore.getItemAsync(
      PENDING_DONATION_KEY,
    );

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);

    if (
      typeof parsed?.reference !==
        'string' ||
      typeof parsed?.amount !==
        'number' ||
      typeof parsed?.createdAt !==
        'string'
    ) {
      throw new Error(
        'Invalid pending donation',
      );
    }

    return parsed as PendingDonation;
  } catch {
    await clearPendingDonation();
    return null;
  }
}

export async function clearPendingDonation() {
  await SecureStore.deleteItemAsync(
    PENDING_DONATION_KEY,
  );
}
