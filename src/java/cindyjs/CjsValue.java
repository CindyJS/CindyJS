package cindyjs;

import com.google.gwt.core.client.JavaScriptObject;
import com.google.gwt.core.client.JsArray;

public class CjsValue extends JavaScriptObject {

    protected CjsValue() {
    }

    public final native String ctype() /*-{
        return this.ctype;
    }-*/;

    public final native boolean isList() /*-{
        return this.ctype === "list";
    }-*/;

    public final native boolean isNumber() /*-{
        return this.ctype === "number";
    }-*/;

    public final native JsArray<CjsValue> listValue() /*-{
        return this.ctype === "list" ? this.value : null;
    }-*/;

    public final native double realValue() /*-{
        return this.ctype === "number" ? this.value.real : NaN;
    }-*/;

    public static native CjsValue makeNumber(double real, double imag) /*-{
        return {ctype: "number", value: {real: real, imag: imag}};
    }-*/;

    public static native CjsValue makeNumber(double real) /*-{
        return {ctype: "number", value: {real: real, imag: 0}};
    }-*/;

    public static native CjsValue makeList(JsArray<CjsValue> value) /*-{
        return {ctype: "list", value: value};
    }-*/;

}
