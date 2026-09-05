export interface LeadMagnet {
  title: string;
  subtitle: string;
  target_audience: string;
  problem: string;
  solution: string;
  sections: { heading: string; content: string }[];
  slug: string;
  markdown: string;
}

export interface Offer {
  big_idea: string;
  hook: string;
  core_offer: string;
  value_stack: string[];
  bonuses: string[];
  guarantee: string;
  cta: string;
  slug: string;
}

export interface Funnel {
  funnel_name: string;
  slug: string;
  pages: any[];
  event: any;
}

export interface WorkflowBuildGuide {
  title: string;
  summary: string;
  ghl_area: string;
  estimated_time_minutes: number;
  steps: {
    step_number: number;
    step_title: string;
    ghl_navigation: string;
    goal: string;
    instructions: string;
    checklist: string[];
  }[];
  full_markdown: string;
}

export interface Post {
  platform: string;
  primary_post: string;
  comments: string[];
  image_prompt: string;
}

export interface GenieResponse {
  lead_magnet: LeadMagnet;
  offer: Offer;
  funnel: Funnel;
  workflow_build_guide: WorkflowBuildGuide;
  posts: Post[];
}
