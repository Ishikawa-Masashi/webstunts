import { JConfig } from '../cof/JConfig';
import { Vector3D } from '../geom/Vector3D';
import { JSegment } from '../geometry/JSegment';
import { JMath3D } from '../math/JMath3D';
import { JMatrix3D } from '../math/JMatrix3D';
import { JNumber3D } from '../math/JNumber3D';
import { MaterialProperties } from '../physics/MaterialProperties';
import { CollDetectFunctor } from './CollDetectFunctor';
import { CollisionInfo } from './CollisionInfo';
import { CollPointInfo } from './CollPointInfo';

export class CollDetectSphereCapsule extends CollDetectFunctor {
  constructor() {
    super('SphereCapsule', 'SPHERE', 'CAPSULE');
  }

  public collDetect(info, collArr) {
    if (info.body0.get_type() == 'CAPSULE') {
      let tempBody = info.body0;
      info.body0 = info.body1;
      info.body1 = tempBody;
    }

    var sphere = info.body0;
    var capsule = info.body1;

    if (!sphere.hitTestObject3D(capsule)) {
      return;
    }

    if (!sphere.get_boundingBox().overlapTest(capsule.get_boundingBox())) {
      return;
    }

    var oldSeg = new JSegment(
      capsule.getBottomPos(capsule.get_oldState()),
      JNumber3D.getScaleVector(
        capsule.get_oldState().getOrientationCols()[1],
        capsule.get_length()
      )
    );
    var newSeg = new JSegment(
      capsule.getBottomPos(capsule.get_currentState()),
      JNumber3D.getScaleVector(
        capsule.get_currentState().getOrientationCols()[1],
        capsule.get_length()
      )
    );
    var radSum = sphere.get_radius() + capsule.get_radius();

    var oldObj = [];
    var oldDistSq = oldSeg.pointSegmentDistanceSq(
      oldObj,
      sphere.get_oldState().position
    );
    var newObj = [];
    var newDistSq = newSeg.pointSegmentDistanceSq(
      newObj,
      sphere.get_currentState().position
    );

    if (
      Math.min(oldDistSq, newDistSq) < Math.pow(radSum + JConfig.collToll, 2)
    ) {
      var segPos = oldSeg.getPoint(oldObj[0]);
      var delta = sphere.get_oldState().position.subtract(segPos);

      var dist = Math.sqrt(oldDistSq);
      var depth = radSum - dist;

      if (dist > JMath3D.NUM_TINY) {
        delta = JNumber3D.getDivideVector(delta, dist);
      } else {
        delta = JMatrix3D.getRotationMatrix(
          0,
          0,
          1,
          360 * Math.random()
        ).transformVector(Vector3D.Y_AXIS);
      }

      var worldPos = segPos.add(
        JNumber3D.getScaleVector(delta, capsule.get_radius() - 0.5 * depth)
      );

      var collPts: CollPointInfo[] = [];
      var cpInfo = new CollPointInfo();
      cpInfo.r0 = worldPos.subtract(sphere.get_oldState().position);
      cpInfo.r1 = worldPos.subtract(capsule.get_oldState().position);
      cpInfo.initialPenetration = depth;
      collPts[0] = cpInfo;

      var collInfo = new CollisionInfo();
      collInfo.objInfo = info;
      collInfo.dirToBody = delta;
      collInfo.pointInfo = collPts;

      var mat = new MaterialProperties();
      mat.restitution =
        0.5 *
        (sphere.get_material().restitution +
          capsule.get_material().restitution);
      mat.friction =
        0.5 *
        (sphere.get_material().friction + capsule.get_material().friction);
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
}
