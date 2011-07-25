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


class M3.Agent
	X = 0
	Y = 1
	Z = 2

	YAW = 1
	PITCH = 0

	SPEED = 15.0
	ROT_SPEED = Math.PI / 180
	MOUSE_DRAG_SPEED = 1 / 500
	MOUSE_JOY_SPEED = 1 / 200
	
	constructor: (@M) ->
		# the current view state
		@pos = vec3.create()
		@ang = vec3.create()

		# the forward pointing unit vector; corresponds to ang at all times
		@forward = vec3.create([0, 0, -1])
		
		# the pointer in world coordinates; corresponds to forward (and draw settings)
		@worldPointer = new M3.Ray(@pos, @forward)

		# set from other inputs, like key state
		@mvReq = vec3.create()
		@angReq = vec3.create()

		# drag state
		@dragCenter = vec3.create()
		@dragPrior = vec3.create()


	forward_on: (action) => @mvReq[Z] -= 1.0
	forward_off: (action) => @mvReq[Z] += 1.0
	backward_on: (action) => @mvReq[Z] += 1.0
	backward_off: (action) => @mvReq[Z] -= 1.0

	up_on: (action) => @mvReq[Y] += 1.0
	up_off: (action) => @mvReq[Y] -= 1.0
	down_on: (action) => @mvReq[Y] -= 1.0
	down_off: (action) => @mvReq[Y] += 1.0

	left_on: (action) => @mvReq[X] -= 1.0
	left_off: (action) => @mvReq[X] += 1.0
	right_on: (action) => @mvReq[X] += 1.0
	right_off: (action) => @mvReq[X] -= 1.0


	turnup_on: (action) => @angReq[PITCH] += 1.0
	turnup_off: (action) => @angReq[PITCH] -= 1.0
	turndown_on: (action) => @angReq[PITCH] -= 1.0
	turndown_off: (action) => @angReq[PITCH] += 1.0

	turnleft_on: (action) => @angReq[YAW] += 1.0
	turnleft_off: (action) => @angReq[YAW] -= 1.0
	turnright_on: (action) => @angReq[YAW] -= 1.0
	turnright_off: (action) => @angReq[YAW] += 1.0


	browser_leftclick: (action) =>
	browser_middleclick: (action) =>
	browser_rightclick: (action) =>
	mouse_leftclick: (action) =>
		@M.board.clear_current()
	mouse_middleclick: (action) =>
		@M.board.mark_current()
	mouse_rightclick: (action) =>

	mouse_dragturn_on: (x, y) => 
		@dragPrior[0] = x; @dragPrior[1] = y; @dragPrior[2] = (new Date).getTime()
		@M.canvas.style.cursor = "move";
	mouse_dragturn_off: () => 
		@angReq[YAW] = @angReq[PITCH] = 0;
		@M.canvas.style.cursor = "auto";
	mouse_dragturn_event: (x, y) =>
		dX = x - @dragPrior[0]
		dY = y - @dragPrior[1]
		@dragPrior[0] = x
		@dragPrior[1] = y
		@ang[YAW] += dX * MOUSE_DRAG_SPEED
		@ang[PITCH] += dY * MOUSE_DRAG_SPEED


	mouse_joyturn_on: (x, y) => 
		@dragCenter[0] = x; @dragCenter[1] = y;
		@dragPrior[0] = x; @dragPrior[1] = y; @dragPrior[2] = (new Date).getTime()
		@M.canvas.style.cursor = "crosshair";
	mouse_joyturn_off: () => 
		@angReq[YAW] = @angReq[PITCH] = 0;
		@M.canvas.style.cursor = "auto";
	mouse_joyturn_event: (x, y) =>
		dX = x - @dragPrior[0]
		dY = y - @dragPrior[1]
		@dragPrior[0] = x
		@dragPrior[1] = y
		@angReq[YAW] += dX * MOUSE_JOY_SPEED
		@angReq[PITCH] += dY * MOUSE_JOY_SPEED
		# switch the cursor type to one of the resize cursors depending on
		#	which side of the origin we are on
		ang = Math.atan2(x - @dragCenter[0], y - @dragCenter[1])
		D = Math.PI / 8
		if -D <= ang < D then @M.canvas.style.cursor = "s-resize"
		if D <= ang < 3 * D then @M.canvas.style.cursor = "se-resize"
		if 3 * D <= ang < 5 * D then @M.canvas.style.cursor = "e-resize"
		if 5 * D <= ang < 7 * D then @M.canvas.style.cursor = "ne-resize"
		if -3 * D <= ang < -D then @M.canvas.style.cursor = "sw-resize"
		if -5 * D <= ang < -3 * D then @M.canvas.style.cursor = "w-resize"
		if -7 * D <= ang < -5 * D then @M.canvas.style.cursor = "nw-resize"
		if ang >= 7 * D or ang < -7 * D then @M.canvas.style.cursor = "n-resize"
		#TODO: draw the origin of the click so that we know where center is easily


	# rotate a "forward" vector by angles
	_findForward: (ang, dir) ->
		cy = Math.cos ang[YAW]
		sy = Math.sin ang[YAW]
		cx = Math.cos ang[PITCH]
		sx = Math.sin ang[PITCH]

		delta = vec3.create()
		delta[X] = (dir[Z] * cx * sy) + (dir[Y] * sx * sy) + (dir[X] * cy)
		delta[Y] = (dir[Y] * cx) - (dir[Z] * sx)
		delta[Z] = (dir[Z] * cx * cy) + (dir[Y] * sx * cy) - (dir[X] * sy)

		return delta

	# work backwards from our view settings to map a screen coordinates to a
	#	ray in world space from the point to our far frustum
	_findPointerGeometry: (pos) ->
		# inputs
		vX = pos[0] - 8
		vY = pos[1] - 8
		vZ = 0
		w = @M.canvas.width
		h = @M.canvas.height

		# viewport to normalized device coordinates / clip coordinates
		# note: clip coordinates are NDC's with W==1, which we already have
		c = [
			2 * vX / w - 1
			1 - 2 * vY / h
			2 * vZ - 1
			1
		]

		# clip coordinates to view coordinates
		v = [0, 0, 0, 0]
		mInvP = mat4.create(@M.mP)
		mat4.inverse(mInvP)
		mat4.multiplyVec4(mInvP, c, v)
		
		# rescale v by vW
		v[0] /= v[3]
		v[1] /= v[3]
		v[2] /= v[3]
		v[3] /= v[3]
		
		# view coordinates to world coordinates
		w = [0, 0, 0, 0]
		mInvMV = mat4.create(@M.mMV)
		mat4.inverse(mInvMV)
		mat4.multiplyVec4(mInvMV, v, w)

		# get ray direction		
		dir = vec3.create(w)
		vec3.subtract(dir, @M.agent.pos)
		vec3.normalize(dir)

		# build ray		
		ray = new M3.Ray @M.agent.pos, dir
		return ray


	# update the view state from the move request
	move: (dt) ->
		# update angles from angle change request
		@ang[PITCH] += @angReq[PITCH] * ROT_SPEED
		@ang[YAW] += @angReq[YAW] * ROT_SPEED
		
		# clamp angles to range
		if @ang[PITCH] > Math.PI / 2 then @ang[PITCH] = Math.PI / 2
		if @ang[PITCH] < -Math.PI / 2 then @ang[PITCH] = -Math.PI / 2
		while @ang[YAW] < 0 then @ang[YAW] += (Math.PI * 2)
		@ang[YAW] %= (Math.PI * 2)
		
		# apply our move request vector on top of our angle
		tmp = vec3.create()
		vec3.normalize(@mvReq, tmp)
		vec3.scale(tmp, dt * SPEED)
		delta = @_findForward @ang, tmp
		vec3.add(@pos, delta)

		# set our new forward direction
		@forward = @_findForward @ang, [0, 0, -1]


	# do tasks that require the current state to be applied against the matricies
	draw: ->
		# update world pointer geometry
		@worldPointer = @_findPointerGeometry(@M.input.mousePosition)

		

