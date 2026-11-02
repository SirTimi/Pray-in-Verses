/// <reference types="jest" />

import { BadRequestException } from '@nestjs/common';
import { assertAcceptableWallText } from './content-filter';

describe('Prayer Wall preventive content filter', () => {
  it('allows sincere requests involving difficult subjects', () => {
    expect(() => assertAcceptableWallText(
      'Please pray for me',
      'I am afraid for my safety and need healing.',
    )).not.toThrow();
  });

  it('rejects direct violent threats', () => {
    expect(() => assertAcceptableWallText('I will kill you')).toThrow(BadRequestException);
  });

  it('rejects explicit abusive language', () => {
    expect(() => assertAcceptableWallText('Stop being an asshole')).toThrow(BadRequestException);
  });

  it('rejects soliciting external URLs', () => {
    expect(() => assertAcceptableWallText('Click https://spam.example.com now')).toThrow(BadRequestException);
  });
});
