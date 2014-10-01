all: js/Cindy.js

js/Cindy.js: js/Events.js js/Setup.js js/libcs/Accessors.js js/libcs/CSNumber.js js/libcs/Essentials.js js/libcs/General.js js/libcs/List.js js/libcs/Namespace.js js/libcs/OpDrawing.js js/libcs/Operators.js js/libcs/OpImageDrawing.js js/libcs/OpSound.js js/libcs/Parser.js js/libgeo/GeoBasics.js js/libgeo/GeoOps.js js/libgeo/GeoScripts.js js/libgeo/GeoState.js js/liblab/LabBasics.js js/liblab/LabObjects.js
	java -jar compiler.jar --language_in ECMASCRIPT5 --js_output_file $@ --js $^
