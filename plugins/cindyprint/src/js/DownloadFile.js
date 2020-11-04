/**
 * Downloads the specified text file to the computer of the user.
 * @arg filename {string} The name of the file (e.g. "mesh.obj").
 * @arg fileContent {string} The content of the file (a string).
 */
function downloadTextFile(filename, fileContent) {
	let blob = new Blob([fileContent], { type : "text/plain;charset=utf-8" });
	downloadBlobAsFile(filename, blob);
}

/**
 * Downloads the specified binary file to the computer of the user.
 * @arg filename {string} The name of the file (e.g. "mesh.obj").
 * @arg fileContent {Blob} The content of the file (a string).
 */
function downloadBlobAsFile(filename, blob) {
	var linkElement = document.createElement('a');
	document.body.appendChild(linkElement);
	linkElement.download = filename;
	linkElement.href = URL.createObjectURL(blob);
	linkElement.click();
}
