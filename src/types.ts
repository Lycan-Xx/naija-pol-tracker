export interface Education {
  degree: string;
  institution: string;
  year: string;
}

export interface ProfessionalBackground {
  role: string;
  organization: string;
  yearRange: string;
}

export interface ElectionRecord {
  year: number;
  type: 'Presidential' | 'Gubernatorial' | 'Senatorial' | 'House of Reps' | 'LGA';
  state: string;
  constituency?: string;
  party: string;
  result: 'WON' | 'LOST' | 'INCONCLUSIVE' | 'DISPUTED';
  votesReceived?: number;
  totalVotesCast?: number;
  wasChallenged: boolean;
  tribunalOutcome?: string;
  gavelIcon?: boolean;
  sourceUrl: string;
  sourceDate: string;
}

export interface PrimaryRecord {
  party: string;
  date: string;
  type: 'Direct' | 'Indirect' | 'Consensus';
  outcome: 'WON' | 'LOST' | 'CONTESTED';
  votesReceived?: number;
  wasChallenged: boolean;
  wasSubstituted: boolean;
  sourceUrl: string;
}

export interface PartyHistory {
  partyName: string;
  partyCode: string;
  fromYear: string;
  toYear: string;
  positionHeld?: string;
  reasonForLeaving?: string;
  sourceUrl: string;
}

export interface LegislativeRecord {
  sessionsAttended: number;
  sessionsExpected: number;
  billsSponsored: Array<{ id: string; title: string; url: string }>;
  billsPassed: number;
  committeesList: string[];
  sourceUrl: string;
}

export interface LegalRecord {
  type: 'efcc' | 'icpc' | 'court' | 'sanctions' | 'asset_declaration';
  title: string;
  description: string;
  caseNumber?: string;
  courtOrAgency: string;
  dateInitiated: string;
  status: 'ongoing' | 'resolved' | 'convicted' | 'acquitted' | 'dismissed';
  outcomeDescription?: string;
  sourceUrl: string;
  sourceDate: string;
  confidence: 'Primary' | 'Secondary';
}

export interface Source {
  name: string;
  url: string;
  dateAccessed: string;
  fieldsContributed: string[];
  confidence: 'Primary' | 'Secondary';
}

export interface PoliticianProfile {
  id: string; // uuid
  fullName: string;
  aliases: string[];
  photoUrl?: string;
  birthDate?: string;
  stateOfOrigin: string;
  is_active: boolean;
  currentPosition?: string;
  currentParty: string;
  bioNarrative: string;
  educationalBackground: Education[];
  professionalBackground: ProfessionalBackground[];
  electoralHistory: ElectionRecord[];
  primaryHistory: PrimaryRecord[];
  partyHistory: PartyHistory[];
  legislativeRecord?: LegislativeRecord;
  legalRecord: LegalRecord[];
  sources: Source[];
  completenessPercentage: number;
  legalFlags: {
    efcc: boolean;
    sanctions: boolean;
    tribunal: boolean;
  };
  lastResearched: string;
}

export interface AgentStep {
  type: 'THOUGHT' | 'ACTION' | 'OBSERVATION' | 'COMPLETE';
  text: string;
  component?: string;
}
