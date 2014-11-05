package quickhull3d;

/**
 * Simple example usage of QuickHull3D. Run as the command
 * <pre>
 *   java quickhull3d.SimpleExample
 * </pre>
 */
public class SimpleExample
{
	/**
	 * Run for a simple demonstration of QuickHull3D.
	 */
	public static void main (String[] args)
	 {
           // x y z coordinates of 6 points
	   Point3d[] points = new Point3d[] 
	      { new Point3d (0.0,  0.0,  0.0),
		new Point3d (1.0,  0.5,  0.0),
		new Point3d (2.0,  0.0,  0.0),
		new Point3d (0.5,  0.5,  0.5),
		new Point3d (0.0,  0.0,  2.0),
		new Point3d (0.1,  0.2,  0.3),
		new Point3d (0.0,  2.0,  0.0),
	      };

	   QuickHull3D hull = new QuickHull3D();
	   hull.build (points);

	   System.out.println ("Vertices:");
	   Point3d[] vertices = hull.getVertices();
	   for (int i=0; i<vertices.length; i++)
	    { Point3d pnt = vertices[i];
	      System.out.println (pnt.x + " " + pnt.y + " " + pnt.z);
	    }

	   System.out.println ("Faces:");
	   int[][] faceIndices = hull.getFaces();
	   for (int i=0; i<vertices.length; i++)
	    { for (int k=0; k<faceIndices[i].length; k++)
	       { System.out.print (faceIndices[i][k] + " ");
	       }
	      System.out.println ("");
	    }
	 }
}
