import { BadRequestException } from '@nestjs/common';

// Deliberately conservative first-pass filtering: obvious abusive language,
// threats, commercial URLs and contact harvesting. Reports and moderators
// handle ambiguous cases; never auto-hide legitimate requests for help.
const hostileTerms = /\b(?:fuck|fucking|bitch|cunt|asshole)\b/i;
const threats = /\b(?:i\s+(?:will|am\s+going\s+to)|we\s+(?:will|are\s+going\s+to))\s+(?:kill|hurt|attack|murder)\s+(?:you|them|him|her)\b/i;
const externalLinks = /(?:https?:\/\/|www\.|(?:\S+\.)?(?:com|net|org)\/\S+)/i;

export function assertAcceptableWallText(...parts: string[]) {
  const text = parts.join(' ');
  if (hostileTerms.test(text) || threats.test(text) || externalLinks.test(text)) {
    throw new BadRequestException(
      'This message contains wording or links that are not allowed on the Prayer Wall. Please revise it.',
    );
  }
}
