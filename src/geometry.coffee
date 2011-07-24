###
# Copyright 2011, Terrence Cole
# 
# This file is part of MIN3D.
# 
# MIN3D is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# MIN3D is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
# 
# You should have received a copy of the GNU Affero General Public License
# along with MIN3D.  If not, see <http://www.gnu.org/licenses/>.
###


class M3.Ray
	# pos:vec3 - origin of the ray
	# dir:vec3 - unit vector specifying direction
	constructor: (@pos, @dir) ->

	toString: () ->
		return "@(#{@pos[0]}, #{@pos[1]}, #{@pos[2]}) ->(#{@dir[0]}, #{@dir[1]}, #{@dir[2]})"


# An axis-aligned bounding box
class M3.AABB
	constructor: (@lo, @hi) ->

	intersectPoint: (v) ->
		for axis in [0..2]
			if v[axis] < @lo[axis] or v[axis] > @hi[axis]
				return 0
		return 1

	# Takes an M3.Ray and casts it into this box.
	# return: -1 no intersection
	# return: 0 for inside or directly adjacent
	# return: >0 for minimum distance to box
	intersectRay: (ray) ->
		tNear = -1000000000
		tFar = 1000000000
	
		if @intersectPoint(ray.pos)
			return 0
		
		for a in [0..2]
			# axis-aligned non-intertersecting case
			if ray.dir[a] == 0 and (ray.pos[a] > @hi[a] or ray.pos[a] < @lo[a])
				return -1
			
			# distance to each plane on this axis
			t1 = (@lo[a] - ray.pos[a]) / ray.dir[a]
			t2 = (@hi[a] - ray.pos[a]) / ray.dir[a]
			
			# t2 is always the further plane
			if t1 > t2 then [t2, t1] = [t1, t2]
			
			# update tNear and tFar for the box
			if t1 > tNear then tNear = t1
			if t2 < tFar then tFar = t2
			
			# nonintersection cases
			if tNear > tFar or tFar < 0
				return -1
		
		if tNear < 0
			return -1
		return tNear
		
###
	byte a;
	float t1, t2, temp;
	float tnear = -999999.9f;
	float tfar = 999999.9f;
	*tNear = 0.0f;
	*tFar = 0.0f;

	if( m_PointInBox( start, bbox ) ) return 1;
	
	for( a=0 ; a<3 ; a++ )
	{
		// check for simple exclusions
		if( (dir[a] == 0) && ( (start[a] > bbox->hibounds[a]) || (start[a] < bbox->lobounds[a]) ) )
			return 0;

		// get a distance to each plane
		t1 = ( bbox->lobounds[a] - start[a] ) / dir[a];
		t2 = ( bbox->hibounds[a] - start[a] ) / dir[a];

		// the farther plane is always t2
		if( t1 > t2 ) // swap
		{
			temp = t1;
			t1 = t2;
			t2 = temp;
		}

		// we need to cross the near plane first on EVERY axis
		if( t1 > tnear ) tnear = t1;
		if( t2 < tfar ) tfar = t2;

		if( tnear > tfar ) return 0;
		if( tfar < 0 ) return 0;
	}

	*tNear = tnear;
	*tFar = tfar;
	return 1;
###


class M3.Edge
	constructor: (i0, i1) ->
		if i0 < i1
			@i0 = i0
			@i1 = i1
		else
			@i0 = i1
			@i1 = i0
		@tris = []
	
	toString: () -> "#{@i0}-#{@i1}"
	

class M3.Tri
	constructor: (@a, @b, @c) ->
		@edges = []

	toString: () -> "#{@a}-#{@b}-#{@c}"


cart2polar = (x, y, z) ->
	r = Math.sqrt(x * x + y * y + z * z)
	phi = Math.atan2(x, z)
	theta = Math.acos(y / r)
	return [r, phi, theta]


polar2cart = (r, phi, theta) ->
	z = r * Math.sin(theta) * Math.cos(phi)
	x = r * Math.sin(theta) * Math.sin(phi)
	y = r * Math.cos(theta)
	return [x, y, z]

