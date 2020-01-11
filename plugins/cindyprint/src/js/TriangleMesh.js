/**
 * The class @ref TriangleMesh represents a three-dimensional triangle mesh.
 * This class is used for storing geometric information of models for exporting to a 3D printer.
 * Thus, only vertex positions (here simply called @ref vertices) and their @ref normals are stored
 * together with an optional index list.
 */
function TriangleMesh() {
	/**
	 * The list of vertex positions.
	 * @type {vec3[]}
	 */
	this.vertices = [];
	/**
	 * The list of vertex normals.
	 * @type {vec3[]}
	 */
	this.normals = [];
	/**
	 * The list of integer triangle indices. Three consecutive indices form one triangle.
	 * @type {number[]}
	 */
	this.indices = [];
}


/**
 * Scales the mesh vertices by the specified factor.
 * @param {number} factor The factor to scale the vertices by.
 */
TriangleMesh.prototype.scale = function(factor) {
	for (let i = 0; i < this.vertices.length; i++) {
		this.vertices[i] = vec3mul(factor, this.vertices[i]);
	}
}

/**
 * Computes smooth normals using the indexed triangles.
 * NOTE: If a vertex is indexed by more than one triangle, then the average normal is stored per vertex.
 * If you want to have non-smooth normals, then make sure each vertex is only referenced by one face.
 */
TriangleMesh.prototype.computeSmoothNormals = function() {
	let epsilon = 0.000001;
	// TODO: Write faster code. See C++ code from Christoph as reference:
	/*
    std::multimap<size_t, size_t> indexMap;
    for (size_t j = 0; j < indices.size(); j++) {
        indexMap.insert(std::make_pair(indices.at(j), (j/3)*3));
    }

    normals.reserve(vertices.size());
    for (size_t i = 0; i < vertices.size(); i++) {
        glm::vec3 normal(0.0f, 0.0f, 0.0f);
        int numTrianglesSharedBy = 0;
        auto triangleRange = indexMap.equal_range(i);
        for (auto it = triangleRange.first; it != triangleRange.second; it++) {
            size_t j = it->second;
            size_t i1 = indices.at(j), i2 = indices.at(j+1), i3 = indices.at(j+2);
            glm::vec3 faceNormal = glm::cross(vertices.at(i1) - vertices.at(i2), vertices.at(i1) - vertices.at(i3));
            faceNormal = glm::normalize(faceNormal);
            normal += faceNormal;
            numTrianglesSharedBy++;
        }

        if (numTrianglesSharedBy == 0) {
            Logfile::get()->writeError("Error in createNormals: numTrianglesSharedBy == 0");
            exit(1);
        }
        normal /= (float)numTrianglesSharedBy;
        normals.push_back(normal);
    }
	*/
	
	this.normals = [];
    for (let i = 0; i < this.vertices.length; i++) {
        let normal = new vec3(0.0, 0.0, 0.0);
        let numTrianglesSharedBy = 0;
        // Naive code, O(n^2)
        for (let j = 0; j < this.indices.length; j += 3) {
            // Does this triangle contain vertex #i?
            if (this.indices[j] == i || this.indices[j+1] == i || this.indices[j+2] == i) {
                let i1 = this.indices[j];
				let i2 = this.indices[j+1];
				let i3 = this.indices[j+2];
				let dir1 = vec3sub(this.vertices[i2], this.vertices[i1]);
				let dir2 = vec3sub(this.vertices[i3], this.vertices[i1]);
                let faceNormal = vec3cross(dir1, dir2);
				let normalLength = vec3length(faceNormal);
				if (normalLength > epsilon) {
					faceNormal = vec3mul(1.0/normalLength, faceNormal);
				}
                normal = vec3add(normal, faceNormal);
                numTrianglesSharedBy++;
            }
        }

        if (numTrianglesSharedBy == 0) {
            alert("Error in createNormals: numTrianglesSharedBy == 0");
        }
        normal = vec3mul(1.0/numTrianglesSharedBy, normal);
        this.normals.push(normal);
    }
}


/**
 * Saves the triangle mesh in the .obj format.
 * @param filename {string} The name of the file (which will be downloaded to the computer of the user).
 */
TriangleMesh.prototype.saveToObjFile = function(filename) {
	let fileContent = "o printmesh\ns 1\n";
	
	// Output vertices and normals
	for (let i = 0; i < this.vertices.length; i++) {
		let vertex = this.vertices[i];
		fileContent = fileContent + "v " + vertex.x + " " + vertex.y + " "
			+ vertex.z + "\n";
		if (this.normals.length > 0) {
			let normal = this.normals[i];
			fileContent = fileContent + "vn " + normal.x + " " + normal.y + " "
				+ normal.z + "\n";
		}
	}
	
	// Output triangle faces
	for (let i = 0; i < this.indices.length; i += 3) {
		let i1 = this.indices[i];
		let i2 = this.indices[i+1];
		let i3 = this.indices[i+2];
		fileContent = fileContent + "f " + i1 + "//" + i1 + " " + i2 + "//"
			+ i2 + " " + i3 + "//" + i3 + "\n";
	}
	
	downloadTextFile(filename, fileContent);
}

/**
 * Saves the triangle mesh in the ASCII .stl format.
 * @param filename The name of the file (which will be downloaded to the computer of the user).
 */
TriangleMesh.prototype.saveToAsciiStlFile = function(filename) {
	let fileContent = "solid printmesh\n\n";
	
	for (let i = 0; i < this.indices.length; i += 3) {
		// Compute the facet normal (ignore stored normal data)
		let v0 = this.vertices[this.indices[i]];
		let v1 = this.vertices[this.indices[i+1]];
		let v2 = this.vertices[this.indices[i+2]];
		let dir0 = vec3sub(v1, v0);
		let dir1 = vec3sub(v2, v0);
		let facetNormal = vec3normalize(vec3cross(dir0, dir1));
		
		fileContent = fileContent + "facet normal "
			+ facetNormal.x + " " + facetNormal.y + " " + facetNormal.z + "\n";
		fileContent = fileContent + "\touter loop\n";
		for (let j = 0; j < 3; j++) {
			let vertex = this.vertices[this.indices[i+j]];
			fileContent = fileContent + "\t\tvertex "
				+ vertex.x + " " + vertex.y + " " + vertex.z + "\n";
		}
		fileContent = fileContent + "\tendloop\nendfacet\n";
	}
		
	fileContent = fileContent + "\nendsolid printmesh\n";
	
	downloadTextFile(filename, fileContent);
}

TriangleMesh.prototype.saveToBinaryStlFile = function(filename) {
	let numTriangles = this.indices.length/3;
	let fileSizeBytes = 80 + 4 + ((4*3*4 + 2) * numTriangles);
	let stlBinaryFile = new BinaryFileWriter(fileSizeBytes);

	// Write empty header
	for (let i = 0; i < 80/4; i++) {
		stlBinaryFile.writeUint32(0);
	}
	// Write number of triangles
	stlBinaryFile.writeUint32(this.indices.length/3);

	// Write all facets
	for (let i = 0; i < this.indices.length; i += 3) {
		// Compute the facet normal (ignore stored normal data)
		let v0 = this.vertices[this.indices[i]];
		let v1 = this.vertices[this.indices[i+1]];
		let v2 = this.vertices[this.indices[i+2]];
		let dir0 = vec3sub(v1, v0);
		let dir1 = vec3sub(v2, v0);
		let facetNormal = vec3normalize(vec3cross(dir0, dir1));
		
		stlBinaryFile.writeVec3(facetNormal);
		stlBinaryFile.writeVec3(v0);
		stlBinaryFile.writeVec3(v1);
		stlBinaryFile.writeVec3(v2);
		stlBinaryFile.writeUint16(0);
	}

	downloadBlobAsFile(filename, stlBinaryFile.toBlob());
}

/**
 * Saves the triangle mesh in one of the supported formats.
 * Before saving, the mesh is checked for validity.
 * @param filename The name of the file (which will be downloaded to the computer of the user).
 */
TriangleMesh.prototype.saveToFile = function(filename) {
	// Test whether the mesh is valid
	let meshGraph = new MeshGraph(this);
	
	// Assert that the mesh is not empty
	if (this.vertices.length <= 0) {
	    alert("TriangleMesh.prototype.saveToFile: The mesh is empty.");
	    return;
	}

	// TODO: Well, this is useless for csg objects, as vertices may lay on an unrelated edge...
	// See in Blender: https://blender.stackexchange.com/questions/20956/is-there-a-way-to-check-a-mesh-for-problems
	// Ctrl + Alt + Shift + M
	if (!meshGraph.hasNoHoles()) {
		alert("TriangleMesh.prototype.saveToFile: The mesh has holes or is not a closed surface.");
	}
	if (!meshGraph.isFullyConnected()) {
		alert("TriangleMesh.prototype.saveToFile: The mesh consists of multiple components.");
	}
	
	// Now save the mesh
	if (filename.endsWith(".obj")) {
		this.saveToObjFile(filename);
	} else if (filename.endsWith(".stl")) {
		this.saveToBinaryStlFile(filename);
	} else {
		alert("TriangleMesh.prototype.saveToFile: Unsupported mesh format.");
	}
}

