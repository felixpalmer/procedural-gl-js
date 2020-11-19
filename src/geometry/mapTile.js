/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
export default class MapTileGeometry {
  constructor( dimensions, segments ) {
    let position = [ 0, 0 ];
    dimensions = dimensions || [ 1, 1 ];
    segments = segments || 1;

    let x = position[ 0 ];
    let y = position[ 1 ];
    let width = dimensions[ 0 ];
    let height = dimensions[ 1 ];

    let segments1 = segments + 1;
    let N1 = segments1 * segments1;
    let grid = new Array( N1 );
    let i, j;

    for ( i = 0; i < segments1; i++ ) {
      for ( j = 0; j < segments1; j++ ) {
        let n = i * segments1 + j;
        grid[ n ] = {
          x: x + i * ( width / segments ),
          y: y - j * ( height / segments ),
          uvx: i / segments,
          uvy: j / segments
        };
      }
    }

    let addSkirt = true;

    // Define faces
    let N = 6 * segments * segments;

    if ( addSkirt ) {
      N += 4 * 6 * segments;
    }

    this.positions = new Float32Array( 4 * N );
    this.index = new Array( N );
    let n = 0;

    // Add two triangles (abc, cbd) to the geometry at array offset
    let addQuad = ( offset, ia, ib, ic, id ) => {
      // Get four vertices in grid square
      let a = grid[ ia ];
      let b = grid[ ib ];
      let c = grid[ ic ];
      let d = grid[ id ];

      const stride = 4;
      // Push into positions attribute buffer
      let pack = vertex => [ vertex.x, vertex.y, vertex.uvx, vertex.uvy ];
      this.positions.set( pack( a ), stride * ( offset + 0 ) );
      this.positions.set( pack( b ), stride * ( offset + 1 ) );
      this.positions.set( pack( c ), stride * ( offset + 2 ) );
      this.positions.set( pack( c ), stride * ( offset + 3 ) );
      this.positions.set( pack( b ), stride * ( offset + 4 ) );
      this.positions.set( pack( d ), stride * ( offset + 5 ) );

      // Add indices
      this.index[ offset + 0 ] = ia;
      this.index[ offset + 1 ] = ib;
      this.index[ offset + 2 ] = ic;
      this.index[ offset + 3 ] = ic;
      this.index[ offset + 4 ] = ib;
      this.index[ offset + 5 ] = id;
    };

    for ( i = 0; i < segments; i++ ) {
      for ( j = 0; j < segments; j++, n++ ) {
        // Get indices to form square tile
        let ia = i * segments1 + j;
        let ib = i * segments1 + j + 1;
        let ic = ( i + 1 ) * segments1 + j;
        let id = ( i + 1 ) * segments1 + j + 1;
        let offset = 6 * n;
        addQuad( offset, ia, ib, ic, id );
      }
    }

    if ( addSkirt ) {
      for ( let skirt = 0; skirt < 4; skirt++ ) {
        for ( let s = 0; s < segments; s++, n++ ) {
          if ( skirt === 0 ) {
            i = 0; j = s; // left
          } else if ( skirt === 1 ) {
            i = segments; j = s; // right
          } else if ( skirt === 2 ) {
            i = s; j = 0; // top
          } else if ( skirt === 3 ) {
            i = s; j = segments; // bottom
          }

          // Vertices for top of skirt
          let a, b;
          if ( skirt < 2 ) {
            a = grid[ i * segments1 + j ];
            b = grid[ i * segments1 + j + 1 ];
          } else {
            a = grid[ i * segments1 + j ];
            b = grid[ ( i + 1 ) * segments1 + j ];
          }

          // Get triangles facing the right way
          if ( skirt === 0 || skirt === 3 ) {
            [ a, b ] = [ b, a ];
          }

          // Vertices that will form base of skirt
          let c = a;
          let d = b;

          // Triangles acb, bcd
          this.positions[ 4 * 6 * n ] = a.x;
          this.positions[ 4 * 6 * n + 1 ] = a.y;
          this.positions[ 4 * ( 6 * n + 1 ) ] = b.x;
          this.positions[ 4 * ( 6 * n + 1 ) + 1 ] = b.y;
          this.positions[ 4 * ( 6 * n + 2 ) ] = c.x;
          this.positions[ 4 * ( 6 * n + 2 ) + 1 ] = c.y;

          this.positions[ 4 * ( 6 * n + 3 ) ] = c.x;
          this.positions[ 4 * ( 6 * n + 3 ) + 1 ] = c.y;
          this.positions[ 4 * ( 6 * n + 4 ) ] = b.x;
          this.positions[ 4 * ( 6 * n + 4 ) + 1 ] = b.y;
          this.positions[ 4 * ( 6 * n + 5 ) ] = d.x;
          this.positions[ 4 * ( 6 * n + 5 ) + 1 ] = d.y;

          // Put uvs in wz channel of position
          // For skirt we add 10 to the values
          this.positions[ 4 * 6 * n + 2 ] = a.uvx;
          this.positions[ 4 * 6 * n + 3 ] = a.uvy;
          this.positions[ 4 * ( 6 * n + 1 ) + 2 ] = b.uvx;
          this.positions[ 4 * ( 6 * n + 1 ) + 3 ] = b.uvy;
          this.positions[ 4 * ( 6 * n + 2 ) + 2 ] = c.uvx + 10;
          this.positions[ 4 * ( 6 * n + 2 ) + 3 ] = c.uvy + 10;

          this.positions[ 4 * ( 6 * n + 3 ) + 2 ] = c.uvx + 10;
          this.positions[ 4 * ( 6 * n + 3 ) + 3 ] = c.uvy + 10;
          this.positions[ 4 * ( 6 * n + 4 ) + 2 ] = b.uvx;
          this.positions[ 4 * ( 6 * n + 4 ) + 3 ] = b.uvy;
          this.positions[ 4 * ( 6 * n + 5 ) + 2 ] = d.uvx + 10;
          this.positions[ 4 * ( 6 * n + 5 ) + 3 ] = d.uvy + 10;
        }
      }
    }

    // Dump out grid
    N = grid.length;
    this.grid = new Float32Array( 4 * N );
    for ( i = 0; i < N; i++ ) {
      let v = grid[ i ];
      this.grid[ 4 * i + 0 ] = v.x;
      this.grid[ 4 * i + 1 ] = v.y;
      this.grid[ 4 * i + 2 ] = v.uvx;
      this.grid[ 4 * i + 3 ] = v.uvy;
    }
  }
}
