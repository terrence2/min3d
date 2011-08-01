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

class M3.Menu
	constructor: (@M) ->
		@machine =
			start: [@enterStart, @leaveStart]
			main:  [@enterMain, @leaveMain]
			play:  [@enterPlay, @leavePlay]
			death: [@enterDeath, @leaveDeath]
			win:   [@enterWin, @leaveWin]

		# setup all states
		@prepareStart()
		@prepareMain()
		@preparePlay()
		@prepareDeath()
		@prepareWin()
	
		@state = 'start'
		@enterStart()


	nextState: (n) ->
		@machine[@state][1]() # leave prior
		@state = n
		@machine[@state][0]() # enter new



	prepareStart: () ->
		b = $("#start.menu")
		b.button()
		b.click => @nextState 'main'
		b.position {
				of: $(window)
				my: "center center"
				at: "center bottom"
				offset: "0 -100"
				collision: "fit fit"
			}

	enterStart: () =>
		$("#start.menu").fadeIn()

	leaveStart: () =>
		$("#start.menu").fadeOut()
		


	prepareMain: () ->
		MIN_SIZE = 1
		MAX_SIZE = 20
		m = $("#main.menu")
		m.show()

		w = $("#main-custom-slider-width-current")
		h = $("#main-custom-slider-height-current")
		d = $("#main-custom-slider-depth-current")
		maxMines = () =>
			return Number(w.html()) * Number(h.html()) * Number(d.html())

		minesCurrent = $("#main-custom-slider-mines-current")
		updateMines = () =>
			elmt = $("#main-custom-slider-mines")
			currentPos = elmt.slider('value')
			currentMax = elmt.slider('option', 'max')
			maxM = Math.floor(maxMines() / 2)
			elmt.slider('option', "max", maxM)
			elmt.slider('value', Math.floor(currentPos / currentMax * maxM))
			minesCurrent.html(elmt.slider('value'))
		minesCurrent.html(Math.floor(0.2 * maxMines()))
			
		$("#main-custom-slider-width").slider {
			min: MIN_SIZE, max: MAX_SIZE, step: 1, value: Number(d.html()),
			change: (e, ui) =>
				w.html(ui.value); updateMines()
		}
		$("#main-custom-slider-height").slider {
			min: MIN_SIZE, max: MAX_SIZE, step: 1, value: Number(d.html()),
			change: (e, ui) =>
				h.html(ui.value); updateMines()
		}
		$("#main-custom-slider-depth").slider {
			min: MIN_SIZE, max: MAX_SIZE, step: 1, value: Number(d.html()),
			change: (e, ui) =>
				d.html(ui.value); updateMines()
		}
		$("#main-custom-slider-mines").slider {
			min: 0, max: maxMines(), step: 1, value: Number(minesCurrent.html()),
			change: (e, ui) =>
				minesCurrent.html(ui.value)
		}
		$("#main-custom-play").button()
		$("#main-custom-play").click =>
			# NOTE: we have a different orientation between x,y,z (webgl native)
			#	and the coordinate system we use in the game menu where depth is
			#	the height of the mines in "layers" up/down.
			@M.loadCustomLevel(
				Number(w.html()), 
				Number(d.html()), 
				Number(h.html()), 
				Number(minesCurrent.html())
			)
			@nextState 'play'

		a = $("#main-accordian")
		a.accordion()
		
		m.hide()
		m.position {
			of: $(window)
			my: "center center"
			at: "center center"
			collision: "fit fit"
		}

	
	enterMain: (e) =>
		$("#main.menu").fadeIn()
		
	leaveMain: (e) =>
		$("#main.menu").fadeOut()


	preparePlay: () ->
	enterPlay: (e) =>
		$('#mined-canvas').focus()
	leavePlay: (e) =>


	prepareDeath: () ->
		undo = $('#death-undo')
		undo.button()
		undo.click => @nextState 'play'

		restart = $('#death-restart')
		restart.button()
		restart.click => @M.doRestart()

		quit = $('#death-quit')
		quit.button()
		quit.click => @M.doStart()

		m = $('#death.menu')
		m.position {
			of: $(window)
			my: "center center"
			at: "center center"
			collision: "fit fit"
		}
		
		overlay = $('#death-overlay.menu')
		overlay.css {
			width: $(window).width(), 
			height: $(window).height(),
			'background-color': 'white',
			top: '0px',
			left: '0px',
		}

	enterDeath: (e) =>
		$('#death-overlay.menu').fadeIn('slow')
		$('#death.menu').fadeIn()
	leaveDeath: (e) =>
		$('#death.menu').fadeOut()
		$('#death-overlay.menu').hide()


	prepareWin: () ->
		renew = $('#win-new')
		renew.button()
		renew.click => @M.doNewGame()

		replay = $('#win-replay')
		replay.button()
		replay.click => @M.doRestart()

		cont = $('#win-continue')
		cont.button()
		cont.click => @nextState 'play'

		quit = $('#win-quit')
		quit.button()
		quit.click => @M.doStart()

		m = $('#win.menu')
		m.position {
			of: $(window)
			my: "center center"
			at: "center center"
			collision: "fit fit"
		}
		
		overlay = $('#win-overlay.menu')
		overlay.css {
			width: $(window).width(), 
			height: $(window).height(),
			'background-color': 'black',
			top: '0px',
			left: '0px',
		}

	enterWin: (e) =>
		$('#win-overlay.menu').fadeIn('slow')
		$('#win.menu').fadeIn()
	leaveWin: (e) =>
		$('#win.menu').fadeOut()
		$('#win-overlay.menu').hide()

