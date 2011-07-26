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

M3.World =
	makeStart: (M) ->
		b = new M3.Board(M, 28, 7, 1)
		b.initFromPlanarChars([[
			"xx   xx m x   x  xxx  xxxx  "
			"xx   xx   xx  x x   x x   x "
			"x x x x x x x x     x x    x"
			"x x x x x x x x   xx  x    x"
			"x  x  x x x  xx     x x    x"
			"x  x  x x x   x x   x x   x "
			"x     x x x   x  xxx  xxxx  "
		]])
		b.center = vec3.create([14 * 10, 3.5 * 10, 230])
		return b
