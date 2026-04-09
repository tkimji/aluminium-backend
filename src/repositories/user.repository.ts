import type { Prisma, Role, SubscriptionPlan, UserStatus } from '@prisma/client';

import { prisma } from '../prisma';

export type CreateRegisteredUserParams = {
  email: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  phone?: string;
  profile: {
    firstName: string;
    lastName: string;
    prefix?: string;
    houseNo?: string;
    moo?: string;
    road?: string;
    province?: string;
    district?: string;
    subdistrict?: string;
    postalCode?: string;
  };
  techExtras?: {
    subscriptionPlan: SubscriptionPlan;
  };
};

const buildProfileCreate = (profile: CreateRegisteredUserParams['profile']): Prisma.UserProfileCreateWithoutUserInput => {
  const data: Prisma.UserProfileCreateWithoutUserInput = {
    firstName: profile.firstName,
    lastName: profile.lastName,
  };
  if (profile.prefix) data.prefix = profile.prefix;
  if (profile.houseNo) data.houseNo = profile.houseNo;
  if (profile.moo) data.moo = profile.moo;
  if (profile.road) data.road = profile.road;
  if (profile.province) data.province = profile.province;
  if (profile.district) data.district = profile.district;
  if (profile.subdistrict) data.subdistrict = profile.subdistrict;
  if (profile.postalCode) data.postalCode = profile.postalCode;
  return data;
};

export const userRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  },

  async createRegisteredUser(params: CreateRegisteredUserParams) {
    const profileData = buildProfileCreate(params.profile);

    const userData: Prisma.UserCreateInput = {
      email: params.email,
      passwordHash: params.passwordHash,
      role: params.role,
      status: params.status,
      profile: { create: profileData },
    };
    if (params.phone) userData.phone = params.phone;

    return prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: userData,
        select: { id: true },
      });

      if (params.role === 'tech' && params.techExtras) {
        await tx.adminApproval.create({
          data: {
            userId: created.id,
            type: 'tech_registration',
            status: 'pending',
          },
        });

        await tx.subscription.create({
          data: {
            userId: created.id,
            plan: params.techExtras.subscriptionPlan,
            status: 'pending',
          },
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          profile: true,
          subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });
    });
  },
};
