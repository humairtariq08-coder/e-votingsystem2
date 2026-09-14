import { db } from '@/lib/db';

export type OrgRole = 'OWNER' | 'ADMIN' | 'MANAGER';

const ROLE_HIERARCHY: Record<OrgRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  MANAGER: 1,
};

/**
 * Check if a user is a member of an organization with at least the specified role.
 * Throws an error if the user doesn't have sufficient permissions.
 */
export async function requireOrgRole(
  userId: string,
  orgId: string,
  minRole: OrgRole
): Promise<{ member: { id: string; role: string }; organization: { id: string; slug: string; name: string } }> {
  const member = await db.organizationMember.findUnique({
    where: {
      userId_organizationId: { userId, organizationId: orgId },
    },
    include: {
      organization: { select: { id: true, slug: true, name: true } },
    },
  });

  if (!member) {
    throw new Error('You are not a member of this organization.');
  }

  const userLevel = ROLE_HIERARCHY[member.role as OrgRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[minRole];

  if (userLevel < requiredLevel) {
    throw new Error(`Insufficient permissions. Required: ${minRole}, Current: ${member.role}`);
  }

  return { member, organization: member.organization };
}

/**
 * Resolve organization by slug and verify user membership.
 */
export async function resolveOrgBySlug(
  userId: string,
  orgSlug: string,
  minRole: OrgRole = 'MANAGER'
) {
  const org = await db.organization.findUnique({
    where: { slug: orgSlug },
  });

  if (!org) {
    throw new Error('Organization not found.');
  }

  return requireOrgRole(userId, org.id, minRole);
}

/**
 * Check if a user has voting eligibility for a specific election.
 */
export async function checkVoterEligibility(
  userId: string,
  electionId: string
): Promise<{ eligible: boolean; reason?: string }> {
  const election = await db.election.findUnique({
    where: { id: electionId },
    select: { id: true, status: true, visibility: true, startDate: true, endDate: true },
  });

  if (!election) {
    return { eligible: false, reason: 'Election not found.' };
  }

  if (election.status !== 'ACTIVE') {
    return { eligible: false, reason: 'This election is not currently active.' };
  }

  const now = new Date();
  if (now < election.startDate || now > election.endDate) {
    return { eligible: false, reason: 'This election is outside its voting window.' };
  }

  // For PUBLIC elections, any authenticated user can vote
  if (election.visibility === 'PUBLIC') {
    return { eligible: true };
  }

  // For PRIVATE / INVITE_ONLY, check voter roll
  const voterEntry = await db.voterRoll.findFirst({
    where: {
      electionId,
      userId,
      status: 'APPROVED',
    },
  });

  if (!voterEntry) {
    return { eligible: false, reason: 'You are not on the voter roll for this election.' };
  }

  return { eligible: true };
}
