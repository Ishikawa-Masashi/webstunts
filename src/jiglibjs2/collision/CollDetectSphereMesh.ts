import { JConfig } from '../cof/JConfig';
import { Vector3D } from '../geom/Vector3D';
import { JTriangle } from '../geometry/JTriangle';
import { JMath3D } from '../math/JMath3D';
import { JNumber3D } from '../math/JNumber3D';
import { MaterialProperties } from '../physics/MaterialProperties';
import { CollDetectFunctor } from './CollDetectFunctor';
import { CollisionInfo } from './CollisionInfo';
import { CollPointInfo } from './CollPointInfo';

export class CollDetectSphereMesh extends CollDetectFunctor {
  constructor() {
    super('SphereMesh', 'SPHERE', 'TRIANGLEMESH');
    //this.name = "SphereMesh";
    //this.type0 = "SPHERE";
    //this.type1 = "TRIANGLEMESH";
  }
  collDetectSphereStaticMeshOverlap(
    sphere,
    mesh,
    info,
    collTolerance,
    collArr
  ) {
    var body0Pos = info.body0.get_oldState().position;
    var body1Pos = info.body1.get_oldState().position;

    var sphereTolR = collTolerance + sphere.get_radius();
    var sphereTolR2 = sphereTolR * sphereTolR;

    var collNormal = new Vector3D();
    var collPts = [];

    var potentialTriangles = [];
    var numTriangles = mesh
      .get_octree()
      .getTrianglesIntersectingtAABox(
        potentialTriangles,
        sphere.get_boundingBox()
      );

    var newD2,
      distToCentre,
      oldD2,
      dist,
      depth,
      tiny = JMath3D.NUM_TINY;
    var meshTriangle;
    var vertexIndices;
    var arr;
    var triangle;
    for (var iTriangle = 0; iTriangle < numTriangles; ++iTriangle) {
      meshTriangle = mesh
        .get_octree()
        .getTriangle(potentialTriangles[iTriangle]);
      distToCentre = meshTriangle
        .get_plane()
        .pointPlaneDistance(sphere.get_currentState().position);
      if (distToCentre <= 0) continue;
      if (distToCentre >= sphereTolR) continue;

      vertexIndices = meshTriangle.get_vertexIndices();
      triangle = new JTriangle(
        mesh.get_octree().getVertex(vertexIndices[0]),
        mesh.get_octree().getVertex(vertexIndices[1]),
        mesh.get_octree().getVertex(vertexIndices[2])
      );
      arr = [];
      newD2 = triangle.pointTriangleDistanceSq(
        arr,
        sphere.get_currentState().position
      );

      if (newD2 < sphereTolR2) {
        // have overlap - but actually report the old intersection
        oldD2 = triangle.pointTriangleDistanceSq(
          arr,
          sphere.get_oldState().position
        );
        dist = Math.sqrt(oldD2);
        depth = sphere.get_radius() - dist;
        var collisionN =
          dist > tiny
            ? sphere
                .get_oldState()
                .position.subtract(triangle.getPoint(arr[0], arr[1]))
            : triangle.get_normal().clone();
        collisionN.normalize();
        // since impulse get applied at the old position
        var pt = sphere
          .get_oldState()
          .position.subtract(
            JNumber3D.getScaleVector(collisionN, sphere.get_radius())
          );

        var cpInfo = new CollPointInfo();
        cpInfo.r0 = pt.subtract(body0Pos);
        cpInfo.r1 = pt.subtract(body1Pos);
        cpInfo.initialPenetration = depth;
        collPts.push(cpInfo);
        collNormal = collNormal.add(collisionN);
        collNormal.normalize();
      }
    }
    if (collPts.length > 0) {
      var collInfo = new CollisionInfo();
      collInfo.objInfo = info;
      collInfo.dirToBody = collNormal;
      collInfo.pointInfo = collPts;

      var mat = new MaterialProperties();
      mat.restitution =
        0.5 *
        (sphere.get_material().restitution + mesh.get_material().restitution);
      mat.friction =
        0.5 * (sphere.get_material().friction + mesh.get_material().friction);
      collInfo.mat = mat;
      collArr.push(collInfo);
      info.body0.collisions.push(collInfo);
      info.body1.collisions.push(collInfo);
      info.body0.addCollideBody(info.body1);
      info.body1.addCollideBody(info.body0);
    } else {
      info.body0.removeCollideBodies(info.body1);
      info.body1.removeCollideBodies(info.body0);
    }
  }

  collDetect(info, collArr) {
    var tempBody;
    if (info.body0.get_type() == 'TRIANGLEMESH') {
      tempBody = info.body0;
      info.body0 = info.body1;
      info.body1 = tempBody;
    }

    var sphere = info.body0;
    var mesh = info.body1;

    this.collDetectSphereStaticMeshOverlap(
      sphere,
      mesh,
      info,
      JConfig.collToll,
      collArr
    );
  }
}
