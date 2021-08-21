import { Vector3D } from '../geom/Vector3D';
import { MaterialProperties } from '../physics/MaterialProperties';
import { CollDetectInfo } from './CollDetectInfo';
import { CollPointInfo } from './CollPointInfo';

export class CollisionInfo {
  mat = new MaterialProperties(); // MaterialProperties
  objInfo: CollDetectInfo = null; // CollDetectInfo
  dirToBody: Vector3D = null; // Vector3D
  pointInfo: CollPointInfo[] = null; // CollPointInfo
  satisfied: boolean = null; // Boolean
}
