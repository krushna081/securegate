import { IUser } from '../models/User';

export function toPublicUser(user: IUser) {
  const object = user.toObject ? user.toObject() : user;
  const {
    tokenVersion: _tokenVersion,
    pushToken: _pushToken,
    isActive: _isActive,
    __v: _version,
    ...safe
  } = object as Record<string, unknown>;
  return safe;
}

export function toPublicUserList(user: IUser) {
  return {
    _id: user._id,
    email: user.email,
    fullName: user.fullName,
    phoneNumber: user.phoneNumber,
    phoneNumber2: user.phoneNumber2,
    photoUrl: user.photoUrl,
    role: user.role,
    societyId: user.societyId,
    flatId: user.flatId,
    gateNumber: user.gateNumber,
  };
}
