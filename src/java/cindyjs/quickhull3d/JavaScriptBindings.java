package cindyjs.quickhull3d;

import com.google.gwt.core.client.EntryPoint;
import com.google.gwt.core.client.GWT;
import com.google.gwt.core.client.JavaScriptObject;
import com.google.gwt.core.client.JsArray;
import com.google.gwt.core.client.JsArrayNumber;
import com.google.gwt.core.client.JsArrayMixed;

import cindyjs.CjsValue;

/**
 * Entry point classes define <code>onModuleLoad()</code>.
 */
public class JavaScriptBindings implements EntryPoint {

    public void onModuleLoad() {
        register();
    }

    private native void register() /*-{
        $wnd.CindyJS.registerPlugin(1, "quickhull3d", function(api) {
            var impl = $entry(@cindyjs.quickhull3d.JavaScriptBindings::convexhull(Lcindyjs/CjsValue;));
            api.defineFunction("convexhull3d", 1, function(args, modifs) {
                var v0 = api.evaluate(args[0]);
                var res = impl(v0);
                if (res !== null)
                    return res;
                return api.nada;
            });
        });
    }-*/;

    public static CjsValue convexhull(CjsValue val1) {
        JsArray<CjsValue> lst1 = val1.listValue();
        if (lst1 == null)
            return null;
        if (lst1.length() < 4) {
            error("Less than four input points specified");
            return null;
        }
        Point3d[] points = new Point3d[lst1.length()];
        double[] arr = new double[3];
        LOOP1: for (int i = 0; i < points.length; ++i) {
            CjsValue val2 = lst1.get(i);
            JsArray<CjsValue> lst2 = val2.listValue();
            if (lst2 == null || lst2.length() != 3)
                continue;
            for (int j = 0; j < 3; ++j) {
                CjsValue val3 = lst2.get(j);
                if (!val3.isNumber())
                    continue LOOP1;
                arr[j] = val3.realValue();
            }
            points[i] = new Point3d(arr[0], arr[1], arr[2]);
        }

        QuickHull3D hull = new QuickHull3D();
        hull.build(points);

        Point3d[] vertices = hull.getVertices();
        JsArray<CjsValue> vcoords
            = JavaScriptObject.createArray(vertices.length).cast();
        for (int i = 0; i < vertices.length; ++i) {
            Point3d pnt = vertices[i];
            JsArray<CjsValue> vec
                = JavaScriptObject.createArray(3).cast();
            vec.set(0, CjsValue.makeNumber(pnt.x));
            vec.set(1, CjsValue.makeNumber(pnt.y));
            vec.set(2, CjsValue.makeNumber(pnt.z));
            vcoords.set(i, CjsValue.makeList(vec));
        }
        
        int[][] faceIndices = hull.getFaces();
        JsArray<CjsValue> faces
            = JavaScriptObject.createArray(faceIndices.length).cast();
        for (int i = 0; i < faceIndices.length; i++) {
            int[] curface = faceIndices[i];
            JsArray<CjsValue> ff
                = JavaScriptObject.createArray(curface.length).cast();
            for (int j = 0; j < curface.length; ++j)
                ff.set(j, CjsValue.makeNumber(curface[j] + 1));
            faces.set(i, CjsValue.makeList(ff));
        }

        JsArray<CjsValue> res
            = JavaScriptObject.createArray(2).cast();
        res.set(0, CjsValue.makeList(vcoords));
        res.set(1, CjsValue.makeList(faces));
        return CjsValue.makeList(res);
    }

    private static native void error(String message) /*-{
        console.log(message);
    }-*/;

}
