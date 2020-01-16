/**
 * Stores settings for generation of a 3D triangle mesh for printing the user can change.
 */
var PrintUiSettings = function () {
	// Cindy3D
	this.exportSpheres = true; // Export spheres?
	this.exportCylinders = true; // Export cylinder?
	this.exportTriangles = true; // Export triangle meshes?
	this.sphereQuality = 16; // Quality of triangular approximation.
	this.cylinderQuality = 16; // Quality of triangular approximation.
	this.lineSubdivisions = 1; // For tube export. Line subdivision factor.
	this.radiusFactor = 1.0; // Quality of triangular approximation.

	// Cindy3D + CindyGL
	this.modelScale = 10.0; // Scale of the model for exporting.
	this.extrudeSurfaces = true; // Extrude the {triangular, iso} surfaces?
	this.extrusionRadius = 0.1; // Radius used for extrusion.
	this.smoothEdges = true; // Use smooth edges (tubes) when extruding?

	// CindyGL
	this.clipToSphere = false; // Clip the iso surface to a sphere.
	this.isoOffset = 0.01; // Percentual offset of the 
	this.gridResolution = 50; // Resolution of the Cartesian grid for iso surface generation.
	this.reconstructionAlgorithm = reconstructionAlgorithms.SNAPMC; // Variant of the marching cubes algorithm which should be used
	this.gamma = 0.1; //Value at which a vertex is napped to a grid vertex
}

const reconstructionAlgorithms = {
	SNAPMC: 'snapMC',
	MARCHINGCUBES: 'marchingCubes'
}


var printUiSettings = new PrintUiSettings();

function cindyPrintUpdateExportSpheres() {
	let checkBox = document.getElementById("exportSpheres");
	printUiSettings.exportSpheres = checkBox.checked;
}
function cindyPrintUpdateExportCylinders() {
	let checkBox = document.getElementById("exportCylinders");
	printUiSettings.exportCylinders = checkBox.checked;
}
function cindyPrintUpdateExportTriangles() {
	let checkBox = document.getElementById("exportTriangles");
	printUiSettings.exportTriangles = checkBox.checked;
}
function cindyPrintUpdateSphereQuality() {
	let slider = document.getElementById("sphereQuality");
	printUiSettings.sphereQuality = slider.value * 1;
}
function cindyPrintUpdateCylinderQuality() {
	let slider = document.getElementById("cylinderQuality");
	printUiSettings.cylinderQuality = slider.value * 1;
}
function cindyPrintUpdateLineSubdivisions() {
	let slider = document.getElementById("lineSubdivisions");
	printUiSettings.lineSubdivisions = slider.value / 50;
}
function cindyPrintUpdateRadiusFactor() {
	let slider = document.getElementById("radiusFactor");
	printUiSettings.radiusFactor = slider.value / 50;
}
function cindyPrintUpdateModelScale() {
	let slider = document.getElementById("modelScale");
	printUiSettings.modelScale = slider.value * 1;
}
function cindyPrintUpdateExtrudeSurfaces() {
	let checkBox = document.getElementById("extrudeSurfaces");
	printUiSettings.extrudeSurfaces = checkBox.checked;
}
function cindyPrintUpdateExtrusionRadius() {
	let slider = document.getElementById("extrusionRadius");
	printUiSettings.extrusionRadius = slider.value / 100;
}
function cindyPrintUpdateSmoothEdges() {
	let checkBox = document.getElementById("smoothEdges");
	printUiSettings.smoothEdges = checkBox.checked;
}
function cindyPrintUpdateClipToSphere() {
	let checkBox = document.getElementById("clipToSphere");
	printUiSettings.clipToSphere = checkBox.checked;
}
function cindyPrintUpdateIsoOffset() {
	let slider = document.getElementById("isoOffset");
	printUiSettings.isoOffset = slider.value / 100;
	self['cdy']['evokeCS']("F(p) := (fun(p.x, p.y, p.z) - " + printUiSettings.isoOffset + ");");
}
function cindyPrintUpdateGridResolution() {
	let slider = document.getElementById("gridResolution");
	printUiSettings.gridResolution = slider.value * 1;
}
function cindyPrintUpdateReconstructionAlgorithm() {
	let dropdown = document.getElementById("reconstructionAlgorithm");
	switch (dropdown.value) {
		case "marchingCubes":
			printUiSettings.reconstructionAlgorithm = reconstructionAlgorithms.MARCHINGCUBES;
			break;
		case "snapmc0.0":
			printUiSettings.reconstructionAlgorithm = reconstructionAlgorithms.SNAPMC;
			printUiSettings.gamma = 0.0;
			break;
		case "snapmc0.1":
			printUiSettings.reconstructionAlgorithm = reconstructionAlgorithms.SNAPMC;
			printUiSettings.gamma = 0.1;
			break;
		case "snapmc0.2":
			printUiSettings.reconstructionAlgorithm = reconstructionAlgorithms.SNAPMC;
			printUiSettings.gamma = 0.2;
			break;
		case "snapmc0.3":
			printUiSettings.reconstructionAlgorithm = reconstructionAlgorithms.SNAPMC;
			printUiSettings.gamma = 0.3;
			break;
		case "snapmc0.4":
			printUiSettings.reconstructionAlgorithm = reconstructionAlgorithms.SNAPMC;
			printUiSettings.gamma = 0.4;
			break;
		case "snapmc0.5":
			printUiSettings.reconstructionAlgorithm = reconstructionAlgorithms.SNAPMC;
			printUiSettings.gamma = 0.5;
			break;
	}
}

self['cindyPrintUpdateExportSpheres'] = cindyPrintUpdateExportSpheres;
self['cindyPrintUpdateExportCylinders'] = cindyPrintUpdateExportCylinders;
self['cindyPrintUpdateExportTriangles'] = cindyPrintUpdateExportTriangles;
self['cindyPrintUpdateSphereQuality'] = cindyPrintUpdateSphereQuality;
self['cindyPrintUpdateCylinderQuality'] = cindyPrintUpdateCylinderQuality;
self['cindyPrintUpdateLineSubdivisions'] = cindyPrintUpdateLineSubdivisions;
self['cindyPrintUpdateRadiusFactor'] = cindyPrintUpdateRadiusFactor;
self['cindyPrintUpdateModelScale'] = cindyPrintUpdateModelScale;
self['cindyPrintUpdateExtrudeSurfaces'] = cindyPrintUpdateExtrudeSurfaces;
self['cindyPrintUpdateExtrusionRadius'] = cindyPrintUpdateExtrusionRadius;
self['cindyPrintUpdateSmoothEdges'] = cindyPrintUpdateSmoothEdges;
self['cindyPrintUpdateClipToSphere'] = cindyPrintUpdateClipToSphere;
self['cindyPrintUpdateIsoOffset'] = cindyPrintUpdateIsoOffset;
self['cindyPrintUpdateGridResolution'] = cindyPrintUpdateGridResolution;
self['cindyPrintUpdateReconstructionAlgorithm'] = cindyPrintUpdateReconstructionAlgorithm;

/**
 * Print preview UI HTML code for use with Cindy3D when exporting CSG meshes.
 */
function uiStringCindy3D(meshFilename) {
	let imageFolder = CindyJS.getBaseDir() + "images/cindyprint/";
	return "<input type=\"checkbox\" id=\"exportSpheres\" onclick=\"cindyPrintUpdateExportSpheres()\" checked> Spheres <image class='smallimg' src='" + imageFolder + "SphereHighRes.png'/>" +
		"<input type=\"checkbox\" id=\"exportCylinders\" onclick=\"cindyPrintUpdateExportCylinders()\" checked> Cylinders <image class='smallimg' src='" + imageFolder + "CylinderHighRes.png'/>" +
		"<input type=\"checkbox\" id=\"exportTriangles\" onclick=\"cindyPrintUpdateExportTriangles()\" checked> Triangles  <image class='smallimg' src='" + imageFolder + "Triangles.png'/>" +
		"<br>" +
		"<table>" +
		"    <tr><th>Sphere quality</th><th><image src='" + imageFolder + "SphereLowRes.png'/></th><th><div class=\"slidecontainer\"><input type=\"range\" min=\"8\" max=\"64\" value=\"16\" class=\"slider\" id=\"sphereQuality\" oninput=\"cindyPrintUpdateSphereQuality()\"></th><th><image src='" + imageFolder + "SphereHighRes.png'/></th></tr>" +
		"    <tr><th>Cylinder quality</th><th><image src='" + imageFolder + "CylinderLowRes.png'/></th><th><div class=\"slidecontainer\"><input type=\"range\" min=\"8\" max=\"64\" value=\"16\" class=\"slider\" id=\"cylinderQuality\" oninput=\"cindyPrintUpdateCylinderQuality()\"></th><th><image src='" + imageFolder + "CylinderHighRes.png'/></th></tr>" +
		"    <tr><th>Radius factor</th><th><image src='" + imageFolder + "SphereSmall.png'/></th><th><div class=\"slidecontainer\"><input type=\"range\" min=\"1\" max=\"100\" value=\"50\" class=\"slider\" id=\"radiusFactor\" oninput=\"cindyPrintUpdateRadiusFactor()\"></th><th><image src='" + imageFolder + "SphereHighRes.png'/></th></tr>" +
		"    <tr><th>Model scale</th><th><image src='" + imageFolder + "SizeSmall.png'/></th><th><div class=\"slidecontainer\"><input type=\"range\" min=\"1\" max=\"100\" value=\"10\" class=\"slider\" id=\"modelScale\" oninput=\"cindyPrintUpdateModelScale()\"></th><th><image src='" + imageFolder + "SizeLarge.png'/></th></tr>" +
		"</table>" +
		"<input type=\"checkbox\" id=\"extrudeSurfaces\" onclick=\"cindyPrintUpdateExtrudeSurfaces()\" checked> Extrude the triangle surfaces" +
		"<table>" +
		"    <tr><th>Extrusion radius</th><th><image src='" + imageFolder + "ExtrudeSurfaceSmall.png'/></th><th><div class=\"slidecontainer\"><input type=\"range\" min=\"0\" max=\"100\" value=\"10\" class=\"slider\" id=\"extrusionRadius\" oninput=\"cindyPrintUpdateExtrusionRadius()\"></th><th><image src='" + imageFolder + "ExtrudeSurfaceLarge.png'/></th></tr>" +
		"</table>" +
		"<input type=\"checkbox\" id=\"smoothEdges\" onclick=\"cindyPrintUpdateSmoothEdges()\" checked> Smooth extrusion edges<br>" +
		"<button onclick=\"cdy.evokeCS('savecsgmesh(&quot;" + meshFilename + "&quot;)');\">Export mesh</button>" +
		"<button onclick=\"cdy.evokeCS('updatepreviewcdy3d()');\">Update Preview</button>";
}

/**
 * Print preview UI HTML code for use with Cindy3D when exporting tube meshes.
 */
function uiStringTubes(meshFilename, computeTubePointsFunctionName, numTubePointsString, radiusString, tubeClosed) {
	let imageFolder = CindyJS.getBaseDir() + "images/cindyprint/";
	let tubeClosedString = "true";
	if (!tubeClosed) {
		tubeClosedString = "false";
	}
	return "<table>" +
		"    <tr><th>Cylinder quality</th><th><image src='" + imageFolder + "CylinderLowRes.png'/></th><th><div class=\"slidecontainer\"><input type=\"range\" min=\"8\" max=\"64\" value=\"16\" class=\"slider\" id=\"cylinderQuality\" oninput=\"cindyPrintUpdateCylinderQuality()\"></th><th><image src='" + imageFolder + "CylinderHighRes.png'/></th></tr>" +
		"    <tr><th>Line subdivisions</th><th><image src='" + imageFolder + "LineSubdivisionLow.png'/></th><th><div class=\"slidecontainer\"><input type=\"range\" min=\"1\" max=\"100\" value=\"50\" class=\"slider\" id=\"lineSubdivisions\" oninput=\"cindyPrintUpdateLineSubdivisions()\"></th><th><image src='" + imageFolder + "LineSubdivisionHigh.png'/></th></tr>" +
		"    <tr><th>Radius factor</th><th><image src='" + imageFolder + "TubeThin.png'/></th><th><div class=\"slidecontainer\"><input type=\"range\" min=\"1\" max=\"100\" value=\"50\" class=\"slider\" id=\"radiusFactor\" oninput=\"cindyPrintUpdateRadiusFactor()\"></th><th><image src='" + imageFolder + "TubeThick.png'/></th></tr>" +
		"    <tr><th>Model scale</th><th><image src='" + imageFolder + "SizeSmall.png'/></th><th><div class=\"slidecontainer\"><input type=\"range\" min=\"1\" max=\"100\" value=\"10\" class=\"slider\" id=\"modelScale\" oninput=\"cindyPrintUpdateModelScale()\"></th><th><image src='" + imageFolder + "SizeLarge.png'/></th></tr>" +
		"</table>" +
		/*
		 * For radius scaling factor 1/20 see Appearance.POINT_SCALE in Cindy3D.
		 */
		"<button onclick=\"cdy.evokeCS('savetubemesh(&quot;" + meshFilename + "&quot;, " + computeTubePointsFunctionName + "(' + document.getElementById('lineSubdivisions').value/50 + '*(" + numTubePointsString + ")), " + radiusString + "/20, " + tubeClosedString + ");');\">Export mesh</button>" +
		"<button onclick=\"cdy.evokeCS('updatepreviewtubes(" + computeTubePointsFunctionName + "(' + document.getElementById('lineSubdivisions').value/50 + '*(" + numTubePointsString + ")), " + radiusString + "/20, " + tubeClosedString + ");');\">Update Preview</button>";
}

/**
 * Print preview UI HTML code for use with CindyGL/iso surface generation from scalar functions.
 */
function uiStringCindyGL(meshFilename, updatepreviewcdyglArguments) {
	let imageFolder = CindyJS.getBaseDir() + "images/cindyprint/";
	return "<input type=\"checkbox\" id=\"extrudeSurfaces\" onclick=\"cindyPrintUpdateExtrudeSurfaces()\" checked> Extrude the triangle surfaces" +
		"<table>" +
		"    <tr><th>Extrusion radius</th><th><image src='" + imageFolder + "ExtrudeSurfaceSmall.png'/></th><th><div class=\"slidecontainer\"><input type=\"range\" min=\"0\" max=\"100\" value=\"10\" class=\"slider\" id=\"extrusionRadius\" oninput=\"cindyPrintUpdateExtrusionRadius()\"></th><th><image src='" + imageFolder + "ExtrudeSurfaceLarge.png'/></th></tr>" +
		"</table>" +
		"<input type=\"checkbox\" id=\"smoothEdges\" onclick=\"cindyPrintUpdateSmoothEdges()\" checked> Smooth extrusion edges" +
		"<input type=\"checkbox\" id=\"clipToSphere\" onclick=\"cindyPrintUpdateClipToSphere()\"> Clip geometry to sphere" +
		"<table>" +
		"    <tr><th>Sphere quality</th><th><image src='" + imageFolder + "SphereLowRes.png'/></th><th><div class=\"slidecontainer\"><input type=\"range\" min=\"8\" max=\"32\" value=\"16\" class=\"slider\" id=\"sphereQuality\" oninput=\"cindyPrintUpdateSphereQuality()\"></th><th><image src='" + imageFolder + "SphereHighRes.png'/></th></tr>" +
		"    <tr><th>Model scale</th><th><image src='" + imageFolder + "SizeSmall.png'/></th><th><div class=\"slidecontainer\"><input type=\"range\" min=\"1\" max=\"100\" value=\"10\" class=\"slider\" id=\"modelScale\" oninput=\"cindyPrintUpdateModelScale()\"></th><th><image src='" + imageFolder + "SizeLarge.png'/></th></tr>" +
		"    <tr><th>Iso offset</th><th><image src='" + imageFolder + "IsoA.png'/></th><th><div class=\"slidecontainer\"><input type=\"range\" min=\"0\" max=\"100\" value=\"0\" class=\"slider\" id=\"isoOffset\" oninput=\"cindyPrintUpdateIsoOffset()\"></th><th><image src='" + imageFolder + "IsoB.png'/></tr>" +
		"    <tr><th>Grid resolution</th><th><image src='" + imageFolder + "GridResLow.png'/></th><th><div class=\"slidecontainer\"><input type=\"range\" min=\"16\" max=\"128\" value=\"50\" class=\"slider\" id=\"gridResolution\" oninput=\"cindyPrintUpdateGridResolution()\"></th><th><image src='" + imageFolder + "ExtrudeSurfaceSmall.png'/></th></tr>" +
		"</table>" +
		"Implicit surface reconstruction algorithm <select name=\"reconstructionAlgorithm\" id=\"reconstructionAlgorithm\" onchange=\"cindyPrintUpdateReconstructionAlgorithm()\"> <option value=\"marchingCubes\">Marching Cubes</option><option value=\"snapmc0.0\">SnapMC (&gamma;=0.0)</option><option selected value=\"snapmc0.1\">SnapMC (&gamma;=0.1)</option><option value=\"snapmc0.2\">SnapMC (&gamma;=0.2)</option><option value=\"snapmc0.3\">SnapMC (&gamma;=0.3)</option><option value=\"snapmc0.4\">SnapMC (&gamma;=0.4)</option><option value=\"snapmc0.5\">SnapMC (&gamma;=0.5)</option></select><br>" +
		"<button onclick=\"cdy.evokeCS('saveisomeshtofile(&quot;" + meshFilename + "&quot;, " + updatepreviewcdyglArguments + ");');\">Export Mesh</button>" +
		"<button onclick=\"cdy.evokeCS('updatepreviewcdygl(" + updatepreviewcdyglArguments + ")');\">Update Preview</button>";
}

/**
 * CSS style sheet for nice looking sliders in the print settings UI.
 * Idea from: https://www.w3schools.com/howto/howto_js_rangeslider.asp
 */
var uiStringStyle =
	"<style>" +
	".vertaligncontainer {" +
	"  display: flex;" +
	"}" +
	"table {" +
	"  border-collapse: collapse;" +
	"  text-align:left;" +
	"}" +
	"th {" +
	"    font-weight: normal;" +
	"}" +
	"" +
	"" +
	"/* https://www.w3schools.com/howto/howto_js_rangeslider.asp */" +
	".slidecontainer {" +
	"  width: 220px;" +
	"  display:inline-block;" +
	"  margin-left:10px;" +
	"  vertical-align: baseline;" +
	"}" +
	"" +
	".slider {" +
	"  -webkit-appearance: none;" +
	"  width: 100%;" +
	"  height: 15px;" +
	"  border-radius: 5px;" +
	"  background: #d3d3d3;" +
	"  outline: none;" +
	"  opacity: 0.7;" +
	"  -webkit-transition: .2s;" +
	"  transition: opacity .2s;" +
	"}" +
	"" +
	".slider:hover {" +
	"  opacity: 1;" +
	"}" +
	"" +
	".slider::-webkit-slider-thumb {" +
	"  -webkit-appearance: none;" +
	"  appearance: none;" +
	"  width: 20px;" +
	"  height: 20px;" +
	"  border-radius: 50%;" +
	"  background: #4CAF50;" +
	"  cursor: pointer;" +
	"}" +
	"" +
	".slider::-moz-range-thumb {" +
	"  width: 20px;" +
	"  height: 20px;" +
	"  border-radius: 50%;" +
	"  background: #4CAF50;" +
	"  cursor: pointer;" +
	"}" +
	"" +
	"th > img {" +
	//"  display: block;" +
	"  width: 22px;" +
	"  height: 22px;" +
	//"  display:table-cell;"+
	"  text-align:center;" +
	"  vertical-align:middle;" +
	"  margin-left:5px;" +
	"  margin-right:-8px;" +
	"}" +
	".smallimg {" +
	"  width: 22px;" +
	"  height: 22px;" +
	"  text-align:center;" +
	"  vertical-align:middle;" +
	"  margin-left:1px;" +
	"  margin-right:14px;" +
	"}" +
	"th {" +
	"  display: table-cell;" +
	"  text-align:center;" +
	"  vertical-align:middle;" +
	"}" +
	"</style>";

// Copy of CindyJS.getBaseDir()
let cindyBaseDir = null;
function getCindyBaseDir() {
	if (cindyBaseDir !== null)
		return cindyBaseDir;
	var scripts = document.getElementsByTagName("script");
	for (var i = 0; i < scripts.length; ++i) {
		var script = scripts[i];
		var src = script.src;
		if (!src) continue;
		var match = /Cindy\.js$/.exec(src);
		if (match) {
			cindyBaseDir = src.substr(0, match.index);
			return cindyBaseDir;
		}
	}
	console.error("Could not find <script> tag for Cindy.js");
	return cindyBaseDir;
}
