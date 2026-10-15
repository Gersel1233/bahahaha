import React from 'react';
import { Composition } from 'remotion';
import { W, H } from './common';
import { Spiis, SPIIS_S } from './Spiis';
import { Mosede, MOSEDE_S } from './Mosede';
import { Callster, CALLSTER_S } from './Callster';

const FPS = 60;
export const AppsRoot: React.FC = () => (
  <>
    <Composition id="Spiis" component={Spiis} durationInFrames={Math.round(SPIIS_S * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="Mosede" component={Mosede} durationInFrames={Math.round(MOSEDE_S * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="Callster" component={Callster} durationInFrames={Math.round(CALLSTER_S * FPS)} fps={FPS} width={W} height={H} />
  </>
);
