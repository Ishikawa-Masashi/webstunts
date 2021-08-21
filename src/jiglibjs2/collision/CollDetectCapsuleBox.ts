import { CollDetectFunctor } from './CollDetectFunctor';

export class CollDetectCapsuleBox extends CollDetectFunctor {
  constructor() {
    super('CapsuleBox', 'CAPSULE', 'BOX');
  }

  collDetect(info, collArr) {}
}
