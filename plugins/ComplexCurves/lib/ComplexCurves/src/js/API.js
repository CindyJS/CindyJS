import {
    ComplexCurves,
    ComplexCurvesFromEquation,
    ComplexCurvesFromFile
}
from './ComplexCurves';

import {
    PolynomialParser
}
from './PolynomialParser';

window['ComplexCurves'] = ComplexCurves;
ComplexCurves['fromEquation'] = ComplexCurvesFromEquation;
ComplexCurves['fromFile'] = ComplexCurvesFromFile;
ComplexCurves.prototype['domainColouring'] = ComplexCurves.prototype.domainColouring;
ComplexCurves.prototype['exportBinary'] = ComplexCurves.prototype.exportBinary;
ComplexCurves.prototype['exportDomainColouring'] = ComplexCurves.prototype.exportDomainColouring;
ComplexCurves.prototype['exportScreenshot'] = ComplexCurves.prototype.exportScreenshot;
ComplexCurves.prototype['exportSurface'] = ComplexCurves.prototype.exportSurface;
ComplexCurves.prototype['rotateBack'] = ComplexCurves.prototype.rotateBack;
ComplexCurves.prototype['rotateBottom'] = ComplexCurves.prototype.rotateBottom;
ComplexCurves.prototype['rotateDefault'] = ComplexCurves.prototype.rotateDefault;
ComplexCurves.prototype['rotateFront'] = ComplexCurves.prototype.rotateFront;
ComplexCurves.prototype['rotateLatLong'] = ComplexCurves.prototype.rotateLatLong;
ComplexCurves.prototype['rotateLeft'] = ComplexCurves.prototype.rotateLeft;
ComplexCurves.prototype['rotateRight'] = ComplexCurves.prototype.rotateRight;
ComplexCurves.prototype['rotateTop'] = ComplexCurves.prototype.rotateTop;
ComplexCurves.prototype['setAntialiasing'] = ComplexCurves.prototype.setAntialiasing;
ComplexCurves.prototype['setAutorotate'] = ComplexCurves.prototype.setAutorotate;
ComplexCurves.prototype['setClipping'] = ComplexCurves.prototype.setClipping;
ComplexCurves.prototype['setLatLong'] = ComplexCurves.prototype.setLatLong;
ComplexCurves.prototype['setOrtho'] = ComplexCurves.prototype.setOrtho;
ComplexCurves.prototype['setTransparency'] = ComplexCurves.prototype.setTransparency;
ComplexCurves.prototype['setZoom'] = ComplexCurves.prototype.setZoom;
ComplexCurves.prototype['toggleAntialiasing'] = ComplexCurves.prototype.toggleAntialiasing;
ComplexCurves.prototype['toggleAutorotate'] = ComplexCurves.prototype.toggleAutorotate;
ComplexCurves.prototype['toggleClipping'] = ComplexCurves.prototype.toggleClipping;
ComplexCurves.prototype['toggleOrtho'] = ComplexCurves.prototype.toggleOrtho;
ComplexCurves.prototype['toggleTransparency'] = ComplexCurves.prototype.toggleTransparency;
ComplexCurves.prototype['unregisterEventHandlers'] = ComplexCurves.prototype.unregisterEventHandlers;

window['PolynomialParser'] = PolynomialParser;
PolynomialParser['parse'] = PolynomialParser.parse;
