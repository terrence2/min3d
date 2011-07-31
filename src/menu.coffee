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
		@enterStart()
	
	
	enterStart: () =>
		b = $("#start.menu")
		b.css 'position': 'absolute'
		b.button()
		b.click @enterMainMenu
		b.position {
				of: $(window)
				my: "center center"
				at: "center bottom"
				offset: "0 -100"
				collision: "fit fit"
			}

	enterMainMenu: (e) =>
		$("#start.menu").fadeOut()
		$("#main.menu").fadeIn()
		
