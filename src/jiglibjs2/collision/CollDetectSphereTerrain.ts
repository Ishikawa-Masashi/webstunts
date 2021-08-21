import { JConfig } from '../cof/JConfig';
import { JSphere } from '../geometry/JSphere';
import { JTerrain } from '../geometry/JTerrain';
import { JNumber3D } from '../math/JNumber3D';
import { MaterialProperties } from '../physics/MaterialProperties';
import { CollDetectFunctor } from './CollDetectFunctor';
import { CollDetectInfo } from './CollDetectInfo';
import { CollisionInfo } from './CollisionInfo';
import { CollPointInfo } from './CollPointInfo';

export class CollDetectSphereTerrain extends CollDetectFunctor {
  constructor() {
    super('SphereTerrain', 'SPHERE', 'TERRAIN');
  }

  collDetect(info: CollDetectInfo, collArr) {
    var tempBody;
    if (info.body0.get_type() == 'TERRAIN') {
      tempBody = info.body0;
      info.body0 = info.body1;
      info.body1 = tempBody;
    }

    var sphere = <JSphere>info.body0;
    var terrain = <JTerrain>info.body1;

    var obj = terrain.getHeightAndNormalByPoint(
      sphere.get_currentState().position
    );
    if (obj.height < JConfig.collToll + sphere.get_radius()) {
      var dist = terrain.getHeightByPoint(sphere.get_oldState().position);
      var depth = sphere.get_radius() - dist;

      var Pt = sphere
        .get_oldState()
        .position.subtract(
          JNumber3D.getScaleVector(obj.normal, sphere.get_radius())
        );

      var collPts = [];
      var cpInfo = new CollPointInfo();
      cpInfo.r0 = Pt.subtract(sphere.get_oldState().position);
      cpInfo.r1 = Pt.subtract(terrain.get_oldState().position);
      cpInfo.initialPenetration = depth;
      collPts[0] = cpInfo;

      var collInfo = new CollisionInfo();
      collInfo.objInfo = info;
      collInfo.dirToBody = obj.normal;
      collInfo.pointInfo = collPts;

      var mat = new MaterialProperties();
      mat.restitution =
        0.5 *
        (sphere.get_material().restitution +
          terrain.get_material().restitution);
      mat.friction =
        0.5 *
        (sphere.get_material().friction + terrain.get_material().friction);
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
