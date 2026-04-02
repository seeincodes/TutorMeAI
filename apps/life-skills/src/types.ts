export type Domain = 'money' | 'time' | 'health' | 'social' | 'combo';
export type Tier = 1 | 2 | 3 | 4;
export type Screen = 'picker' | 'simulation' | 'recap';

export interface ScenarioInfo {
  id: string;
  title: string;
  domain: Domain;
  icon: string;
  description: string;
}

export interface ChoiceOption {
  id: string;
  label: string;
  icon: string;
  cost?: number;
  effect?: string;
}

export interface VisualUpdate {
  scene: string;
  balance?: number;
  items?: string[];
  progress?: number;
  animationCue?: string;
}

export interface DecisionRecord {
  turn: number;
  choice: string;
  outcome: string;
}

export interface RecapSummary {
  domain: string;
  scenarioTitle: string;
  decisions: DecisionRecord[];
  takeaway: string;
  illustration: string;
}

export interface SimulationState {
  tier: Tier;
  scenarioId: string;
  scenarioTitle: string;
  domain: Domain;
  balance: number;
  items: string[];
  progress: number;
  currentEvent: {
    eventType: 'choice' | 'info' | 'surprise';
    description: string;
    choices?: ChoiceOption[];
    visualUpdate: VisualUpdate;
  } | null;
  decisions: DecisionRecord[];
}
