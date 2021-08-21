import { RigidBody } from '../physics/RigidBody';

export class JCollisionEvent {
  body: RigidBody = null; // RigidBody
  constructor(type) {}
  static COLLISION_START = 'collisionStart'; // String
  static COLLISION_END = 'collisionEnd'; // String
}
