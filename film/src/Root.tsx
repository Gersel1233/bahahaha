import React from 'react';
import { Composition } from 'remotion';
import { Intro, DURATION } from './Intro';

export const Root: React.FC = () => (
  <>
    <Composition id="Desktop" component={Intro} durationInFrames={DURATION * 60} fps={60} width={1280} height={720} />
    <Composition id="Phone" component={Intro} durationInFrames={DURATION * 60} fps={60} width={360} height={640} />
  </>
);
