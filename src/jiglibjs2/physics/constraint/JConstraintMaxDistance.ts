import { JMath3D } from '../../math/JMath3D';
import { JNumber3D } from '../../math/JNumber3D';
import { PhysicsSystem } from '../PhysicsSystem';
import { JConstraint } from './JConstraint';

export class JConstraintMaxDistance extends JConstraint {
  _maxVelMag = 20; // Number
  _minVelForProcessing = 0.01; // Number
  _body0 = null; // RigidBody
  _body1 = null; // RigidBody
  _body0Pos = null; // Vector3D
  _body1Pos = null; // Vector3D
  _maxDistance = null; // Number
  r0 = null; // Vector3D
  r1 = null; // Vector3D
  _worldPos = null; // Vector3D
  _currentRelPos0 = null; // Vector3D

  constructor(body0, body0Pos, body1, body1Pos, maxDistance) {
    //   jiglib.JConstraint.apply(this, []);
    super();
    this._body0 = body0;
    this._body0Pos = body0Pos;
    this._body1 = body1;
    this._body1Pos = body1Pos;
    this._maxDistance = maxDistance;

    this._constraintEnabled = false;
    this.enableConstraint();
  }

  enableConstraint() {
    if (this._constraintEnabled) {
      return;
    }
    this._constraintEnabled = true;
    this._body0.addConstraint(this);
    this._body1.addConstraint(this);
    PhysicsSystem.getInstance().addConstraint(this);
  }

  disableConstraint() {
    if (!this._constraintEnabled) {
      return;
    }
    this._constraintEnabled = false;
    this._body0.removeConstraint(this);
    this._body1.removeConstraint(this);
    PhysicsSystem.getInstance().removeConstraint(this);
  }

  preApply(dt) {
    this.satisfied = false;

    this.r0 = this._body0
      .get_currentState()
      .orientation.transformVector(this._body0Pos);
    this.r1 = this._body1
      .get_currentState()
      .orientation.transformVector(this._body1Pos);

    var worldPos0, worldPos1;
    worldPos0 = this._body0.get_currentState().position.add(this.r0);
    worldPos1 = this._body1.get_currentState().position.add(this.r1);
    this._worldPos = JNumber3D.getScaleVector(worldPos0.add(worldPos1), 0.5);

    this._currentRelPos0 = worldPos0.subtract(worldPos1);
  }

  apply(dt) {
    this.satisfied = true;

    if (!this._body0.isActive && !this._body1.isActive) {
      return false;
    }

    var clampedRelPos0Mag,
      normalVel,
      denominator,
      tiny = JMath3D.NUM_TINY;
    var currentVel0,
      currentVel1,
      predRelPos0,
      clampedRelPos0,
      desiredRelVel0,
      Vr,
      N,
      tempVec1,
      tempVec2,
      normalImpulse;

    currentVel0 = this._body0.getVelocity(this.r0);
    currentVel1 = this._body1.getVelocity(this.r1);

    predRelPos0 = this._currentRelPos0.add(
      JNumber3D.getScaleVector(currentVel0.subtract(currentVel1), dt)
    );
    clampedRelPos0 = predRelPos0.clone();
    clampedRelPos0Mag = clampedRelPos0.get_length();
    if (clampedRelPos0Mag <= tiny) {
      return false;
    }
    if (clampedRelPos0Mag > this._maxDistance) {
      clampedRelPos0 = JNumber3D.getScaleVector(
        clampedRelPos0,
        this._maxDistance / clampedRelPos0Mag
      );
    }

    desiredRelVel0 = JNumber3D.getDivideVector(
      clampedRelPos0.subtract(this._currentRelPos0),
      dt
    );
    Vr = currentVel0.subtract(currentVel1).subtract(desiredRelVel0);

    normalVel = Vr.get_length();
    if (normalVel > this._maxVelMag) {
      Vr = JNumber3D.getScaleVector(Vr, this._maxVelMag / normalVel);
      normalVel = this._maxVelMag;
    } else if (normalVel < this._minVelForProcessing) {
      return false;
    }

    N = JNumber3D.getDivideVector(Vr, normalVel);
    tempVec1 = this.r0.crossProduct(N);
    tempVec1 = this._body0.get_worldInvInertia().transformVector(tempVec1);
    tempVec2 = this.r1.crossProduct(N);
    tempVec2 = this._body1.get_worldInvInertia().transformVector(tempVec2);
    denominator =
      this._body0.get_invMass() +
      this._body1.get_invMass() +
      N.dotProduct(tempVec1.crossProduct(this.r0)) +
      N.dotProduct(tempVec2.crossProduct(this.r1));
    if (denominator < tiny) {
      return false;
    }

    normalImpulse = JNumber3D.getScaleVector(N, -normalVel / denominator);
    this._body0.applyWorldImpulse(normalImpulse, this._worldPos, false);
    this._body1.applyWorldImpulse(
      JNumber3D.getScaleVector(normalImpulse, -1),
      this._worldPos,
      false
    );

    this._body0.setConstraintsAndCollisionsUnsatisfied();
    this._body1.setConstraintsAndCollisionsUnsatisfied();
    this.satisfied = true;
    return true;
  }
}
