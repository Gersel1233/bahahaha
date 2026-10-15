import React from 'react';
import { Composition } from 'remotion';
import { W, H } from './common';
import { Spiis, SPIIS_S } from './Spiis';
import { Mosede, MOSEDE_S } from './Mosede';
import { Callster, CALLSTER_S } from './Callster';
import { TileApps, APPS_S, TW, TH } from './TileApps';
import { TileSys, SYS_S } from './TileSys';
import { TileInt, INT_S } from './TileInt';
import { TileWeb, WEB_S } from './TileWeb';

const FPS = 60;
export const AppsRoot: React.FC = () => (
  <>
    <Composition id="Spiis" component={Spiis} durationInFrames={Math.round(SPIIS_S * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="Mosede" component={Mosede} durationInFrames={Math.round(MOSEDE_S * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="Callster" component={Callster} durationInFrames={Math.round(CALLSTER_S * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="TileApps" component={TileApps} durationInFrames={Math.round(APPS_S * FPS)} fps={FPS} width={TW} height={TH} />
    <Composition id="TileSys" component={TileSys} durationInFrames={Math.round(SYS_S * FPS)} fps={FPS} width={TW} height={TH} />
    <Composition id="TileInt" component={TileInt} durationInFrames={Math.round(INT_S * FPS)} fps={FPS} width={TW} height={TH} />
    <Composition id="TileWeb" component={TileWeb} durationInFrames={Math.round(WEB_S * FPS)} fps={FPS} width={TW} height={TH} />
  </>
);
