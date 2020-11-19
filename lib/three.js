import * as THREE from 'three.lib';

// Optimized version of getInverse (5% boost in Chrome, 20% others)
// Probably not the most important optimization but we have it so
// keep it
THREE.Matrix4.prototype.getInverse = function ( m, throwOnDegenerate ) {
  // based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
  var te = this.elements,
  me = m.elements,

  n11 = me[ 0 ], n21 = me[ 1 ], n31 = me[ 2 ], n41 = me[ 3 ],
  n12 = me[ 4 ], n22 = me[ 5 ], n32 = me[ 6 ], n42 = me[ 7 ],
  n13 = me[ 8 ], n23 = me[ 9 ], n33 = me[ 10 ], n43 = me[ 11 ],
  n14 = me[ 12 ], n24 = me[ 13 ], n34 = me[ 14 ], n44 = me[ 15 ],

  // Precalculate common multiples (usage count in brackets)
  n11n22 = n11 * n22, // 3
  n11n23 = n11 * n23, // 2
  n11n24 = n11 * n24, // 2
  n11n32 = n11 * n32, // 2
  n12n21 = n12 * n21, // 4
  n12n23 = n12 * n23, // 4
  n12n24 = n12 * n24, // 3
  n12n31 = n12 * n31, // 2
  n13n21 = n13 * n21, // 2
  n13n22 = n13 * n22, // 4
  n13n24 = n13 * n24, // 3
  n13n31 = n13 * n31, // 2
  n13n32 = n13 * n32, // 3
  n14n23 = n14 * n23, // 3
  n14n33 = n14 * n33, // 4
  n14n41 = n14 * n41, // 2
  n14n43 = n14 * n43, // 4
  n21n32 = n21 * n32, // 3
  n21n42 = n21 * n42, // 3
  n22n31 = n22 * n31, // 3
  n22n33 = n22 * n33, // 2
  n23n31 = n23 * n31, // 2
  n23n32 = n23 * n32, // 4
  n23n34 = n23 * n34, // 2
  n24n31 = n24 * n31, // 2
  n24n32 = n24 * n32, // 4
  n24n33 = n24 * n33, // 4
  n33n44 = n33 * n44, // 4
  n34n41 = n34 * n41, // 3
  n34n42 = n34 * n42, // 4
  n34n43 = n34 * n43, // 4
  //                   = 62 multiplications saved
  t11 = n23 * n34n42 - n24n33 * n42 + n24n32 * n43 - n22 * n34n43 - n23n32 * n44 + n22 * n33n44,
  t12 = n14n33 * n42 - n13 * n34n42 - n14n43 * n32 + n12 * n34n43 + n13n32 * n44 - n12 * n33n44,
  t13 = n13n24 * n42 - n14n23 * n42 + n14n43 * n22 - n12n24 * n43 - n13n22 * n44 + n12n23 * n44,
  t14 = n14 * n23n32 - n13 * n24n32 - n14n33 * n22 + n12 * n24n33 + n13n22 * n34 - n12n23 * n34;

  var det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

  if ( det === 0 ) {

    var msg = 'THREE.Matrix4.getInverse(): can\'t invert matrix, determinant is 0';

    if ( throwOnDegenerate || false ) {

      throw new Error( msg );

    } else {

      console.warn( msg );

    }

    return this.identity();

  }

  te[ 0 ] = t11;
  te[ 1 ] = n24n33 * n41 - n23n34 * n41 - n24n31 * n43 + n21 * n34n43 + n23n31 * n44 - n21 * n33n44;
  te[ 2 ] = n22 * n34n41 - n24n32 * n41 + n24n31 * n42 - n21 * n34n42 - n22n31 * n44 + n21n32 * n44;
  te[ 3 ] = n23n32 * n41 - n22n33 * n41 - n23n31 * n42 + n21n42 * n33 + n22n31 * n43 - n21n32 * n43;

  te[ 4 ] = t12;
  te[ 5 ] = n13 * n34n41 - n14n33 * n41 + n14n43 * n31 - n11 * n34n43 - n13n31 * n44 + n11 * n33n44;
  te[ 6 ] = n14n41 * n32 - n12 * n34n41 - n14 * n31 * n42 + n11 * n34n42 + n12n31 * n44 - n11n32 * n44;
  te[ 7 ] = n12 * n33 * n41 - n13n32 * n41 + n13n31 * n42 - n11 * n33 * n42 - n12n31 * n43 + n11n32 * n43;

  te[ 8 ] = t13;
  te[ 9 ] = n14n23 * n41 - n13n24 * n41 - n14n43 * n21 + n11n24 * n43 + n13n21 * n44 - n11n23 * n44;
  te[ 10 ] = n12n24 * n41 - n14n41 * n22 + n14 * n21n42 - n11n24 * n42 - n12n21 * n44 + n11n22 * n44;
  te[ 11 ] = n13n22 * n41 - n12n23 * n41 - n13 * n21n42 + n11n23 * n42 + n12n21 * n43 - n11n22 * n43;

  te[ 12 ] = t14;
  te[ 13 ] = n13n24 * n31 - n14n23 * n31 + n14n33 * n21 - n11 * n24n33 - n13n21 * n34 + n11 * n23n34;
  te[ 14 ] = n14 * n22n31 - n12n24 * n31 - n14 * n21n32 + n11 * n24n32 + n12n21 * n34 - n11n22 * n34;
  te[ 15 ] = n12n23 * n31 - n13n22 * n31 + n13n32 * n21 - n11 * n23n32 - n12n21 * n33 + n11 * n22n33;

  return this.multiplyScalar( 1 / det );

};

export default THREE;
