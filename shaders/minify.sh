#!/bin/bash

# Copyright 2020 (c) Felix Palmer
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.
#
# Script that builds up shaders that use includes (writing to e.g. shader.full.vert)
# and then minifies the result. Final minified shaders are placed in the `min` directory
mkdir -p min

# Check if any files have been changed
# If last changed file contains `full` then
# assume it is a previous minification artifact
# and that we don't need to re-minify
LAST_EDITED=`ls -tr | tail -n 1`
if [ `echo $LAST_EDITED | grep full` ]
then
  echo "No changes to shaders, skipping minification"
  exit
fi
echo "Minifying shaders..."

# First build up shaders that use includes
glsl-validate.py --write beacon.frag
glsl-validate.py --write beacon.vert
glsl-validate.py --write line.frag
glsl-validate.py --write line.vert
glsl-validate.py --write marker.frag
glsl-validate.py --write marker.vert
glsl-validate.py --write picker.vert
glsl-validate.py --write raycast.vert
glsl-validate.py --write sky.frag
glsl-validate.py --write skybox.frag
glsl-validate.py --write skySpheremap.frag

# Terrain
glsl-validate.py --write terrain.frag
glsl-validate.py --write terrain.vert
glsl-validate.py --write terrainPicker.frag
glsl-validate.py --write terrainPicker.vert

# Minify complete shaders
glslmin beacon.full.frag -o min/beacon.frag
glslmin beacon.full.vert -o min/beacon.vert
glslmin line.full.frag -o min/line.frag
glslmin line.full.vert -o min/line.vert
glslmin marker.full.frag -o min/marker.frag
glslmin marker.full.vert -o min/marker.vert
glslmin picker.frag -o min/picker.frag
glslmin picker.full.vert -o min/picker.vert
glslmin raycast.frag -o min/raycast.frag
glslmin raycast.full.vert -o min/raycast.vert

# Sky
glslmin sky.full.frag -o min/sky.frag
glslmin sky.vert -o min/sky.vert
glslmin skybox.full.frag -o min/skybox.frag
glslmin skySpheremap.full.frag -o min/skySpheremap.frag

# Postprocess
glslmin postprocess.frag -o min/postprocess.frag
glslmin quad.vert -o min/quad.vert
glslmin quad_uv.vert -o min/quad_uv.vert

# Terrain
glslmin terrain.full.frag -o min/terrain.frag
glslmin terrain.full.vert -o min/terrain.vert
glslmin terrainPicker.full.vert -o min/terrainPicker.vert
glslmin terrainPicker.full.frag -o min/terrainPicker.frag
echo "Shaders minified"
