all: build/js/Cindy.js

clean:
	$(RM) -r build
	cd GWT && ant clean

.PHONY: all clean

libcs := src/js/libcs/Namespace.js src/js/libcs/Accessors.js src/js/libcs/CSNumber.js src/js/libcs/List.js src/js/libcs/Essentials.js src/js/libcs/General.js src/js/libcs/Operators.js src/js/libcs/OpDrawing.js src/js/libcs/OpImageDrawing.js src/js/libcs/Parser.js src/js/libcs/OpSound.js

libgeo := src/js/libgeo/GeoState.js src/js/libgeo/GeoBasics.js src/js/libgeo/GeoOps.js src/js/libgeo/GeoScripts.js

liblab := src/js/liblab/LabBasics.js src/js/liblab/LabObjects.js

lib := src/js/lib/numeric-1.2.6.js src/js/lib/clipper.js

# by defaul compile with SIMPLE flag
optflags = SIMPLE
ifeq ($(O),1)
	optflags = ADVANCED
endif

#by default use closure compiler
js_compiler = closure

ifeq ($(plain),1)
	js_compiler = plain 
endif

ifeq ($(js_compiler), closure)
build/js/Cindy.js: $(libgeo) src/js/Setup.js src/js/Events.js src/js/Timer.js $(libcs) $(liblab) $(lib)
	mkdir -p $(@D)
	java -jar compiler.jar --language_in ECMASCRIPT5 --create_source_map $@.map --source_map_format V3 --source_map_location_mapping "src/js/|../../src/js/" --output_wrapper_file src/js/Cindy.js.wrapper --js_output_file $@ --js $^
else
build/js/Cindy.js: $(libgeo) src/js/Setup.js src/js/Events.js src/js/Timer.js $(libcs) $(liblab) $(lib)
	mkdir -p $(@D)
	cat $^ > $@
endif

GWT/war/quickhull3d/quickhull3d.nocache.js: src/java/cindyjs/quickhull3d.gwt.xml $(wildcard src/java/cindyjs/quickhull3d/*.java)
	cd GWT && ant -Dcjs.module=quickhull3d

build/js/quickhull3d/quickhull3d.nocache.js: GWT/war/quickhull3d/quickhull3d.nocache.js
	rm -rf build/js/quickhull3d
	cp -r GWT/war/quickhull3d build/js/

all: build/js/quickhull3d/quickhull3d.nocache.js
