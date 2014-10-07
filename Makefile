all: js/Cindy.js

libcs := js/libcs/Namespace.js js/libcs/Accessors.js js/libcs/CSNumber.js js/libcs/List.js js/libcs/Essentials.js js/libcs/General.js js/libcs/Operators.js js/libcs/OpDrawing.js js/libcs/OpImageDrawing.js js/libcs/Parser.js js/libcs/OpSound.js

libgeo := js/libgeo/GeoState.js js/libgeo/GeoBasics.js js/libgeo/GeoOps.js js/libgeo/GeoScripts.js

liblab := js/liblab/LabBasics.js js/liblab/LabObjects.js

lib := js/lib/numeric-1.2.6.js js/lib/clipper.js

# by default compile with SIMPLE flag
optflags = SIMPLE
ifeq ($(O),1)
	optflags = ADVANCED
endif

js/Cindy.js js/Cindy.js.map: $(libgeo) js/Setup.js js/Events.js js/Timer.js $(libcs) $(liblab) $(lib)
	java -jar compiler.jar --compilation_level $(optflags) --language_in ECMASCRIPT5 --create_source_map $@.map --source_map_format V3 --source_map_location_mapping "js/|" --output_wrapper_file js/Cindy.js.wrapper --js_output_file $@ --js $^
