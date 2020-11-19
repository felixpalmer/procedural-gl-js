/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import { BufferAttribute, BufferGeometry, Color } from 'three.lib';
// Helper Geometry for merging together buffer geometries
var BufferMergeGeometry = function ( vertexCount, attributes, tag ) {
  BufferGeometry.call( this );

  // Some defaults for now, later maybe split up into smaller geometries? then can use 16bit uint index?
  vertexCount = vertexCount || 1024 * 1024;
  attributes = attributes || [ 'position' ];

  this.type = 'BufferMergeGeometry';

  this.indices = [];
  var self = this;
  var buffer;
  for ( var a = 0; a < attributes.length; a++ ) {
    var attribute = attributes[ a ];
    // For now assume vec3
    // TODO investigate if we can switch to Int16 here?
    // TODO or even Int8 for normals
    //var buffer = new Int16Array( 3 * vertexCount );
    if ( attribute === 'normal' ) {
      buffer = new Int8Array( 3 * vertexCount );
      self.setAttribute( attribute, new BufferAttribute( buffer, 3, true ) );
    } else if ( attribute === 'tangent' ) {
      buffer = new Int8Array( 4 * vertexCount );
      self.setAttribute( attribute, new BufferAttribute( buffer, 4, true ) );
    } else if ( attribute === 'color' ) {
      buffer = new Uint8Array( 4 * vertexCount );
      self.setAttribute( attribute, new BufferAttribute( buffer, 4, true ) );
    } else {
      buffer = new Float32Array( 3 * vertexCount );
      self.setAttribute( attribute, new BufferAttribute( buffer, 3 ) );
    }
  }

  if ( tag ) { // For GPU picking
    buffer = new Uint8Array( 3 * vertexCount );
    self.setAttribute( 'tag', new BufferAttribute( buffer, 3, true ) );
  }

  this.attributeOffset = 0;
  this.indexOffset = 0;
};

BufferMergeGeometry.prototype = Object.create( BufferGeometry.prototype );

BufferMergeGeometry.prototype._mergeIndices = function ( geometry ) {
  // Copy across indices, offseting by previous additions
  var dstArray = this.indices;
  var srcArray = geometry.index.array;
  var count = geometry.index.array.length;
  for ( var i = 0, j = this.indexOffset; i < count; i++, j++ ) {
    dstArray[ j ] = this.attributeOffset + srcArray[ i ];
  }

  this.indexOffset += count;
};

// Expects to merge in BufferGeometry
BufferMergeGeometry.prototype.merge = function ( geometry, tag ) {
  this._mergeIndices( geometry );

  var i, j, il, dstArray, srcArray, count;

  // Construct tag value
  var color = new Color( tag );
  color = new Uint8Array( [ 255 * color.r, 255 * color.g, 255 * color.b ] );

  // Copy across attributes
  var self = this;
  var attrKeys = Object.keys( this.attributes );
  for ( var a = 0; a < attrKeys.length; a++ ) {
    var key = attrKeys[ a ];
    var value = this.attributes[ key ];
    dstArray = value.array;

    if ( key === 'tag' && tag ) {
      // Fill array with color
      for ( i = 0, j = 3 * self.attributeOffset, il = 3 * count; i < il; i += 3, j += 3 ) {
        dstArray.set( color, j );
      }
    } else if ( geometry.attributes[ key ] ) {
      srcArray = geometry.attributes[ key ].array;
      count = geometry.attributes[ key ].count;
      dstArray.set( srcArray,
        value.itemSize * self.attributeOffset );
    }
  }

  this.attributeOffset += count;

  return this;
};

// How many more vertices we can accept
BufferMergeGeometry.prototype.capacity = function () {
  return this.attributes.position.count - this.attributeOffset;
};

// When constructing of this geometry is complete, freeze it
// by capping the index array
BufferMergeGeometry.prototype.freeze = function () {
  var TypeArray = this.attributes.position.count > 65535 ? Uint32Array : Uint16Array;
  var index = new TypeArray( this.indices );
  this.setIndex( new BufferAttribute( index, 1 ) );

  // Clip attribute arrays, massively saving on memory
  // TODO, could we just create the buffer the correct size at the beginning?
  var attrKeys = Object.keys( this.attributes );
  var key, value, end;
  for ( var a = 0; a < attrKeys.length; a++ ) {
    key = attrKeys[ a ];
    value = this.attributes[ key ];
    end = value.itemSize * this.attributeOffset;
    value.set( value.array.subarray( 0, end ) );
    this.setAttribute( key,
      new BufferAttribute(
        value.array.subarray( 0, end ),
        value.itemSize,
        value.normalized ) );
  }

  return this;
};

export default BufferMergeGeometry;
