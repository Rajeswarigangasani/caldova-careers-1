/**
 * Pure, side-effect-free helpers for working with job postings.
 *
 * These operate on plain `Job[]` arrays (already loaded from the content
 * collection by the calling page) so they can be unit tested without the Astro
 * content runtime or a database.
 */
import type { EmploymentType, Job } from '../types/job';

/** Return jobs sorted by posted date, newest first (does not mutate input). */
export function sortByNewest(jobs: Job[]): Job[] {
    return [...jobs].sort(
        (a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime(),
    );
}

/**
 * Format an ISO-8601 date as a human-readable posted date,
 * e.g. "January 5, 2027". Falls back to the raw value if unparseable.
 */
export function formatPostedDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return iso;
    }
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    });
}

/** Facets a list of jobs can be narrowed by. Omitted facets are not applied. */
export interface JobFilters {
    /** Exact department name to match. */
    department?: string;
    /** Whether the role must (or must not) be remote. */
    remote?: boolean;
    /** Employment type to match. */
    type?: EmploymentType;
}

/**
 * Return jobs matching every provided facet (does not mutate input).
 *
 * @param jobs - The jobs to filter.
 * @param filters - The facets to apply; omitted facets match all jobs.
 * @returns A new array of the jobs that satisfy every provided facet.
 */
export function filterJobs(jobs: Job[], filters: JobFilters): Job[] {
    return jobs.filter(
        (job) =>
            (!filters.department || job.department === filters.department) &&
            (filters.remote === undefined || job.remote === filters.remote) &&
            (filters.type === undefined || job.type === filters.type),
    );
}

/**
 * Return the unique department names, sorted alphabetically.
 *
 * @param jobs - The jobs to read departments from.
 * @returns Sorted department names without duplicates.
 */
export function getDepartments(jobs: Job[]): string[] {
    return [...new Set(jobs.map((job) => job.department))].sort((a, b) =>
        a.localeCompare(b),
    );
}
