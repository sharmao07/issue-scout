"use client";

import type { ScoutIssue } from "@/types/issue";

type Props = {
  issue: ScoutIssue;
  isSaved: boolean;
  onSelect: (issue: ScoutIssue) => void;
  onToggleSaved: (issue: ScoutIssue) => void;
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function IssueCard({ issue, isSaved, onSelect, onToggleSaved }: Props) {
  const updatedDate = formatDate(issue.updatedAt);
  const level = issue.level && issue.level !== "unspecified" ? issue.level : "";

  return (
    <article className="issue-card">
      <div className="issue-card-top">
        <div className="issue-title-group">
          <a href={issue.url} target="_blank" rel="noreferrer" className="issue-title">
            {issue.title}
          </a>
          <div className="issue-repo">
            <a href={issue.repositoryUrl} target="_blank" rel="noreferrer">{issue.repository}</a>
            <span aria-hidden="true">·</span>
            <span>#{issue.number}</span>
          </div>
        </div>

        <span className={`issue-state${issue.state === "closed" ? " is-closed" : ""}`}>
          {issue.state}
        </span>
      </div>

      <div className="issue-card-bottom">
        <div className="issue-tags" aria-label="Issue labels and estimated difficulty">
          {issue.labels.slice(0, 4).map((item) => (
            <span key={item.name} className="issue-tag">{item.name}</span>
          ))}
          {level && <span className={`issue-tag level-${level}`}>{level}</span>}
        </div>

        <div className="issue-card-meta">
          {updatedDate && <span>Updated {updatedDate}</span>}
          <button
            type="button"
            onClick={() => onToggleSaved(issue)}
            className={`card-action${isSaved ? " is-saved" : ""}`}
            aria-pressed={isSaved}
            aria-label={isSaved ? "Remove saved issue" : "Save issue"}
          >
            <svg viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-3.7L6 21V4.8Z" />
            </svg>
            {isSaved ? "Saved" : "Save"}
          </button>
          <button type="button" onClick={() => onSelect(issue)} className="card-action">
            Details
          </button>
          <a href={issue.url} target="_blank" rel="noreferrer" className="card-action card-action-link">
            GitHub
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
}
