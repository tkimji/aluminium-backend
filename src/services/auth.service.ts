import bcrypt from 'bcryptjs';

import { ConflictError } from '../errors/AppError';
import { userRepository } from '../repositories/user.repository';
import type { RegisterBody } from '../validation/auth.validation';

export const authService = {
  async register(body: RegisterBody) {
    const existing = await userRepository.findByEmail(body.email);
    if (existing) {
      throw new ConflictError('Email already in use');
    }

    const role = body.role ?? 'user';
    const status = role === 'tech' ? 'inactive' : 'active';
    const subscriptionPlan = body.subscriptionPlan ?? 'monthly';

    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = await userRepository.createRegisteredUser({
      email: body.email,
      passwordHash,
      role,
      status,
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      profile: {
        firstName: body.firstName,
        lastName: body.lastName,
        ...(body.prefix !== undefined ? { prefix: body.prefix } : {}),
        ...(body.houseNo !== undefined ? { houseNo: body.houseNo } : {}),
        ...(body.moo !== undefined ? { moo: body.moo } : {}),
        ...(body.road !== undefined ? { road: body.road } : {}),
        ...(body.province !== undefined ? { province: body.province } : {}),
        ...(body.district !== undefined ? { district: body.district } : {}),
        ...(body.subdistrict !== undefined ? { subdistrict: body.subdistrict } : {}),
        ...(body.postalCode !== undefined ? { postalCode: body.postalCode } : {}),
      },
      ...(role === 'tech' ? { techExtras: { subscriptionPlan } } : {}),
    });

    const subscription = role === 'tech' ? user.subscriptions[0] ?? null : null;

    return {
      id: user.id,
      role: user.role,
      status: user.status,
      email: user.email,
      profile: user.profile,
      subscription,
    };
  },
};
