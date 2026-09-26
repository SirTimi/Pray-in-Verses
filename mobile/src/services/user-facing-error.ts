import { ApiError } from './api';

type UserFacingErrorOptions = {
  fallback: string;
  networkMessage?: string;
  statusMessages?: Partial<Record<number, string>>;
  allowServerMessageForStatuses?: number[];
};

const TECHNICAL_MESSAGE =
  /(?:prisma|sql|stack|exception|trace|econn|enotfound|fetch failed|network request failed|internal server error|status code|undefined|null reference|syntaxerror|typeerror|referenceerror|<html|<!doctype)/i;

function safeServerMessage(error: ApiError) {
  const message = error.message?.trim();

  if (
    !message ||
    message.length > 180 ||
    TECHNICAL_MESSAGE.test(message)
  ) {
    return null;
  }

  return message;
}

export function getUserFacingError(
  error: unknown,
  options: UserFacingErrorOptions,
) {
  if (!(error instanceof ApiError)) {
    return options.networkMessage ?? options.fallback;
  }

  const mapped = options.statusMessages?.[error.status];
  if (mapped) return mapped;

  if (error.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (error.status === 403) {
    return 'You do not have permission to do that.';
  }

  if (error.status === 429) {
    return 'You have tried too many times. Wait a moment and try again.';
  }

  if (error.status >= 500) {
    return 'Something went wrong on our side. Please try again.';
  }

  if (options.allowServerMessageForStatuses?.includes(error.status)) {
    return safeServerMessage(error) ?? options.fallback;
  }

  return options.fallback;
}
