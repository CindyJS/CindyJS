/**
 * A binary file of fixed size.
 * @param {number} bufferSize The size of the binary file in bytes.
 */
var BinaryFileWriter = function(bufferSize) {
	this.offset = 0;
	this.buffer = new ArrayBuffer(bufferSize);
	this.dataView = new DataView(this.buffer);
}

/**
 * @return {Blob} A blob object containing the file contents
 */
BinaryFileWriter.prototype.toBlob = function() {
	return new Blob([this.dataView], {type: 'application/octet-binary'});
}

/**
 * Write a number as an unsigned 32-bit value.
 */
BinaryFileWriter.prototype.writeUint32 = function(val) {
	this.dataView.setUint32(this.offset, val, true);
	this.offset += 4;
}

/**
 * Write a number as an unsigned 16-bit value.
 */
BinaryFileWriter.prototype.writeUint16 = function(val) {
	this.dataView.setUint16(this.offset, val, true);
	this.offset += 2;
}

/**
 * Write a number as an unsigned 8-bit value.
 */
BinaryFileWriter.prototype.writeUint8 = function(val) {
	this.dataView.setUint8(this.offset, val, true);
	this.offset += 1;
}

/**
 * Write a number as a 32-bit floating-point value.
 */
BinaryFileWriter.prototype.writeFloat32 = function(val) {
	this.dataView.setFloat32(this.offset, val, true);
	this.offset += 4;
}

/**
 * Write a number as a 3D vector object.
 * @param {vec3} val The vector object.
 */
BinaryFileWriter.prototype.writeVec3 = function(val) {
	this.writeFloat32(val.x);
	this.writeFloat32(val.y);
	this.writeFloat32(val.z);
}