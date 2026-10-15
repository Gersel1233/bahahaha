import React from 'react';
import { Composition } from 'remotion';
import { W, H } from './common';
import { Spiis, SPIIS_S } from './Spiis';
import { Mosede, MOSEDE_S } from './Mosede';
import { Callster, CALLSTER_S } from './Callster';
import { TileApps, TILE_S, TW, TH } from './TileApps';
import { TileSys } from './TileSys';
import { TileInt } from './TileInt';
import { TileWeb } from './TileWeb';

const FPS = 60;
export const AppsRoot: React.FC = () => (
  <>
    <Composition id="Spiis" component={Spiis} durationInFrames={Math.round(SPIIS_S * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="Mosede" component={Mosede} durationInFrames={Math.round(MOSEDE_S * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="Callster" component={Callster} durationInFrames={Math.round(CALLSTER_S * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="TileApps" component={TileApps} durationInFrames={TILE_S * FPS} fps={FPS} width={TW} height={TH} />
    <Composition id="TileSys" component={TileSys} durationInFrames={TILE_S * FPS} fps={FPS} width={TW} height={TH} />
    <Composition id="TileInt" component={TileInt} durationInFrames={TILE_S * FPS} fps={FPS} width={TW} height={TH} />
    <Composition id="TileWeb" component={TileWeb} durationInFrames={TILE_S * FPS} fps={FPS} width={TW} height={TH} />
  </>
);
