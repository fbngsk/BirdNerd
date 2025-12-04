// Schwarm Feature Types
export interface Swarm {
    id: string;
    name: string;
    inviteCode: string;
    founderId: string;
    createdAt: string;
    memberCount?: number;
    totalXp?: number;
    uniqueBirds?: number;
}

export interface SwarmMember {
    id: string;
    name: string;
    avatarSeed: string;
    xp: number;
    collectedCount: number;
    isFounder: boolean;
}

export type LeaderboardScope = 'friends' | 'swarm' | 'global';
