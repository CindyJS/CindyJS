JAVA=java

all: build/js/Cindy.js

clean:
	$(RM) -r build

.PHONY: all clean

libcs := src/js/libcs/Namespace.js src/js/libcs/Accessors.js src/js/libcs/CSNumber.js src/js/libcs/List.js src/js/libcs/Essentials.js src/js/libcs/General.js src/js/libcs/Operators.js src/js/libcs/OpDrawing.js src/js/libcs/OpImageDrawing.js src/js/libcs/Parser.js src/js/libcs/OpSound.js

libgeo := src/js/libgeo/GeoState.js src/js/libgeo/GeoBasics.js src/js/libgeo/GeoOps.js src/js/libgeo/GeoScripts.js

liblab := src/js/liblab/LabBasics.js src/js/liblab/LabObjects.js

lib := src/js/lib/numeric-1.2.6.js src/js/lib/clipper.js

closure_args = \
	--language_in ECMASCRIPT5 \
	--create_source_map $@.map \
	--source_map_format V3 \
	--source_map_location_mapping "src/js/|../../src/js/" \
	--output_wrapper_file $(filter %.wrapper,$^) \
	--js_output_file $@ \
	--js $(filter %.js,$^)

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

build/js/Cindy.js: src/js/Setup.js src/js/Events.js src/js/Timer.js
build/js/Cindy.js: $(libcs) $(libgeo) $(liblab) $(lib) src/js/Cindy.js.wrapper

ifeq ($(js_compiler), closure)
build/js/Cindy.js: compiler.jar
	mkdir -p $(@D)
	$(JAVA) -jar $(filter %compiler.jar,$^) $(closure_args)
else
build/js/Cindy.js:
	mkdir -p $(@D)
	awk '/%output%/{exit}{print}' $(filter %.wrapper,$^) > $@
	cat $(filter %.js,$^) >> $@
	awk '/%output%/{i=1;getline}{if(i)print}' $(filter %.wrapper,$^) >> $@
endif
