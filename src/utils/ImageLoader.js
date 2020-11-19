/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
class ImageLoader {
  load( url ) {
    return new Promise( ( resolve, reject ) => {
      let image = new Image();
      image.onload = () => {
        resolve( image );
        image.onload = null;
        image.onerror = null;
      };

      image.onerror = ( e ) => {
        reject( e );
        image.onload = null;
        image.onerror = null;
      };

      image.crossOrigin = 'Anonymous';
      image.src = url;
    } );
  }
}

export default new ImageLoader();
