/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import alt from '/alt';

export default alt.generateActions(
  'animateAlongFeature',
  'doubleTapZoom',
  'featureClicked',
  'featureSelected',
  'focusOnBounds',
  'focusOnFeature',
  'focusOnLocation',
  'focusOnTarget',
  'inputEnded',
  'inputStarted',
  'orbitTarget',
  'panToPosition',
  'rotateLeft',
  'rotateRight',
  'selectFeatures',
  'setCamera',
  'setCameraMode',
  'setCameraPosition',
  'setCameraTarget',
  'setCurrentPlace',
  'setEnvironment',
  'setGeography',
  'setSecondaryParams',
  'setTerrainEffectContours',
  'setTerrainEffectFlats',
  'setTerrainEffectGrade',
  'setTerrainEffectHeight',
  'setTerrainEffectNone',
  'startFlyover',
  'toggleWidgets',
  'zoomIn',
  'zoomOut'
);
