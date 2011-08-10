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

GOALS = \
	build/mined.js \
	build/debug.js \
	build/geometry.js \
	build/input.js \
	build/shader.js \
	build/buffer.js \
	build/texture.js \
	build/cubemap.js \
	build/agent.js \
	build/board.js \
	build/skybox.js \
	build/menu.js \
	build/world.js 
TARGET=public/release/min3d.js


all: ${GOALS}
	cat ${GOALS} > ${TARGET}

watch:
	while inotifywait src/*; do sleep 0.1; make; done

clean:
	rm -f build/*.js

build/%.js : src/%.coffee
	coffee -o build -b -c $<


