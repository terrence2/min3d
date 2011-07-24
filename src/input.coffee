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


class M3.Input
	constructor: (@M, agent) ->
		# map keycodes to a string for mapping to commands
		@code2name = 
			16: "shift"
			32: "space"
			37: "left"
			38: "up"
			39: "right"
			40: "down"
		az = "abcdefghijklmnopqrstuvwxyz"
		for i in [0..26]
			@code2name[65 + i] = az[i]
		az = "0123456789"
		for i in [0..10]
			@code2name[48 + i] = az[i]

		# key presses (by name for ease of use) to actions
		@keydown2action = {}
		@keyup2action = {}
		defaultActions =
			"w": "+forward"
			"a": "+left"
			"s": "+backward"
			"d": "+right"
			"left": "+turnleft"
			"right": "+turnright"
			"up": "+turnup"
			"down": "+turndown"
			"space": "+up"
			"r": "+up"
			"f": "+down"
		for keyname, action of defaultActions
			@bind keyname, action

		# the DOM gives us key-repeats... which we want to squelch, so record any
		#	explicitly held action that we are inside of.
		@heldActions = {}

		# actions to callback functions -- the function table we use can be specified
		# by setting a mode, and new modes can be added, e.g. when we add a vehicle,
		# we can attach a new mode to get callbacks for it.
		@mode = "skin"
		@actionMap = 
			"skin": 
				"+forward": agent.forward_on
				"-forward": agent.forward_off
				"+backward": agent.backward_on
				"-backward": agent.backward_off
				"+left": agent.left_on
				"-left": agent.left_off
				"+right": agent.right_on
				"-right": agent.right_off
				"+up": agent.up_on
				"-up": agent.up_off
				"+down": agent.down_on
				"-down": agent.down_off
				"+turnleft": agent.turnleft_on
				"-turnleft": agent.turnleft_off
				"+turnright": agent.turnright_on
				"-turnright": agent.turnright_off
				"+turnup": agent.turnup_on
				"-turnup": agent.turnup_off
				"+turndown": agent.turndown_on
				"-turndown": agent.turndown_off

		@mouseDragState = false # false, or e.button when dragging
		@mouseMap =
			"skin":
				"0": agent.mouse_leftclick
				"1": agent.mouse_middleclick
				"2": agent.mouse_rightclick
				"+drag0": agent.mouse_dragturn_on
				"@drag0": agent.mouse_dragturn_event
				"-drag0": agent.mouse_dragturn_off
				"+drag1": agent.mouse_joyturn_on
				"@drag1": agent.mouse_joyturn_event
				"-drag1": agent.mouse_joyturn_off

		# track the mouse position
		# x=x, y=y, z=state(0 for outside, 1 for inside canvas)
		@mousePosition = vec3.create()

		# bind to dom
		$( @M.canvas ).click(@onClick)
		$( @M.canvas ).mousedown(@onMouseDown)
		$( @M.canvas ).mouseup(@onMouseUp)
		$( @M.canvas ).mousemove(@onMouseMove)
		$( @M.canvas ).mouseover(@onMouseOver)
		$( @M.canvas ).mouseout(@onMouseOut)
		$( @M.canvas ).keydown(@onKeyDown)
		$( @M.canvas ).keyup(@onKeyUp)


	# Map the given action to be performed when the given key is pressed.
	bind: (keyname, action) ->
		@keydown2action[keyname] = action
		if action[0] == "+"
			@keyup2action[keyname] = "-" + action[1...action.length]


	## Event Handlers	
	onClick: (e) =>
		console.log("click")

		callback = @actionMap[@mode][e.button]
		callback(e.clientX, e.clientY) if callback?


	onMouseDown: (e) =>
		console.log("mousedown: " + String(e.button))

		if 0 <= e.button <= 1
			return if @mouseDragState isnt false
			
			@mouseDragState = e.button

			callback = @mouseMap[@mode][ "+drag" + String(e.button) ]
			callback(e.clientX, e.clientY) if callback?


	onMouseUp: (e) =>
		console.log("mouseup: " + String(e.button))

		if @mouseDragState isnt false
			# call with last event position before calling -
			callback = @mouseMap[@mode][ "@drag" + String(@mouseDragState) ]
			callback(e.clientX, e.clientY) if callback?

			callback = @mouseMap[@mode][ "-drag" + String(@mouseDragState) ]
			callback() if callback?

			@mouseDragState = false


	onMouseOver: (e) =>
		@mousePosition[2] = 1


	onMouseOut: (e) =>
		@mousePosition[2] = 0
	
		#TODO: is there something better we can do here?
		console.log("mouseout: " + String(e.button))
		@onMouseUp(e)
	

	onMouseMove: (e) =>
		@mousePosition[0] = e.clientX
		@mousePosition[1] = e.clientY
		if @mouseDragState isnt false
			callback = @mouseMap[@mode][ "@drag" + String(@mouseDragState) ]
			callback(e.clientX, e.clientY) if callback?


	onKeyDown: (e) =>
		# code -> name
		keyname = @code2name[e.which]
		return if not keyname?

		# name -> action
		action = @keydown2action[keyname]
		return if not action?

		# de-keyrepeat held actions
		if action[0] == "+"
			subaction = action[1..action.length]
			return if @heldActions[subaction]?
			@heldActions[subaction] = true

		# action -> callback
		console.log(action)
		callback = @actionMap[@mode][action]
		return if not callback?

		callback(action)
	
	
	onKeyUp: (e) =>
		# code -> name
		keyname = @code2name[e.which]
		return if not keyname?

		# name -> action
		action = @keyup2action[keyname]
		return if not action?

		# remove keyrepeat masker
		if action[0] == "-"
			subaction = action[1..action.length]
			delete @heldActions[subaction]

		# action -> callback
		console.log(action)
		callback = @actionMap[@mode][action]
		return if not callback?

		callback(action)

