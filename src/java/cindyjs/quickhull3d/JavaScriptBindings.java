package cindyjs.quickhull3d;

import com.google.gwt.core.client.EntryPoint;
import com.google.gwt.core.client.GWT;
import com.google.gwt.core.client.JavaScriptObject;
import com.google.gwt.core.client.JsArray;
import com.google.gwt.core.client.JsArrayNumber;
import com.google.gwt.core.client.JsArrayMixed;

/**
 * Entry point classes define <code>onModuleLoad()</code>.
 */
public class JavaScriptBindings implements EntryPoint {

    public void onModuleLoad() {
        publish();
    }

    private native void publish() /*-{
        $wnd.convexhull =
          $entry(@cindyjs.quickhull3d.JavaScriptBindings::convexhull([D));
    }-*/;

    public static JsArrayMixed convexhull(double[] coords) {
        if (coords.length % 3 != 0)
            return null;
        Point3d[] points = new Point3d[coords.length/3];
        int j = 0;
        for (int i = 0; i <= coords.length - 3; i += 3) {
            points[j++] = new Point3d(coords[i], coords[i+1], coords[i+2]);
        }
        QuickHull3D hull = new QuickHull3D();
        hull.build(points);

        Point3d[] vertices = hull.getVertices();
        JsArrayNumber vcoords
            = JavaScriptObject.createArray(vertices.length*3).cast();
        j = 0;
        for (Point3d pnt: vertices) {
            vcoords.set(j++, pnt.x);
            vcoords.set(j++, pnt.y);
            vcoords.set(j++, pnt.z);
        }

        int[][] faceIndices = hull.getFaces();
        JsArray<JsArrayNumber> faces =
            JavaScriptObject.createArray(faceIndices.length).cast();
        for (int i = 0; i < faceIndices.length; i++) {
            int[] curface = faceIndices[i];
            JsArrayNumber ff
                = JavaScriptObject.createArray(curface.length).cast();
            for (j = 0; j < curface.length; ++j)
                ff.set(j, curface[j]);
            faces.set(i, ff);
        }

        JsArrayMixed res = JavaScriptObject.createArray(2).cast();
        res.set(0, vcoords);
        res.set(1, faces);
        return res;
    }

}
