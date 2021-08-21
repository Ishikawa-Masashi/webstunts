import { BodyPair } from '../physics/BodyPair';
import { CachedImpulse } from '../physics/CachedImpulse';

export class ContactData {
  pair: BodyPair = null; // BodyPair
  impulse: CachedImpulse = null; // CachedImpulse
}
