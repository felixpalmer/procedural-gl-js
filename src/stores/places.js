/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import alt from '/alt';
import SetterStore from '/utils/setterStore';
import UserActions from '/actions/user';
var PlacesStore = SetterStore( [
  [ UserActions.setCurrentPlace, {} ]
] );
PlacesStore.displayName = 'PlacesStore';
export default alt.createStore( PlacesStore );
