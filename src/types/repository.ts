export type ContributionGuide = {
  path: string;
  url: string;
};

export type RepositoryPayload = {
  repository: {
    fullName: string;
    url: string;
    description: string | null;
    stars: number;
    forks: number;
    openItems: number;
    pushedAt: string | null;
    pushedDaysAgo: number | null;
    updatedAt: string;
    archived: boolean;
    disabled: boolean;
    defaultBranch: string;
    license: string | null;
  };
  contributionGuides: ContributionGuide[];
  contributionGuidesChecked: boolean;
};
