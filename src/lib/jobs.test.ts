import { describe, it, expect } from 'vitest';
import { sortByNewest, formatPostedDate, filterJobs, getDepartments } from './jobs';
import type { Job } from '../types/job';

function makeJob(slug: string, postedDate: string): Job {
    return {
        slug,
        title: `Role ${slug}`,
        department: 'Technology',
        location: 'Remote',
        type: 'Full-time',
        remote: true,
        postedDate,
        summary: 'A role.',
    };
}

describe('sortByNewest', () => {
    it('orders jobs by posted date, newest first', () => {
        const jobs = [
            makeJob('a', '2027-01-01'),
            makeJob('b', '2027-03-15'),
            makeJob('c', '2027-02-10'),
        ];
        expect(sortByNewest(jobs).map((j) => j.slug)).toEqual(['b', 'c', 'a']);
    });

    it('does not mutate the input array', () => {
        const jobs = [makeJob('a', '2027-01-01'), makeJob('b', '2027-03-15')];
        const original = jobs.map((j) => j.slug);
        sortByNewest(jobs);
        expect(jobs.map((j) => j.slug)).toEqual(original);
    });
});

describe('formatPostedDate', () => {
    it('formats an ISO date as a readable string', () => {
        expect(formatPostedDate('2027-01-05')).toBe('January 5, 2027');
    });

    it('returns the raw value when the date is unparseable', () => {
        expect(formatPostedDate('not-a-date')).toBe('not-a-date');
    });
});

describe('filterJobs', () => {
    const jobs: Job[] = [
        { ...makeJob('a', '2027-01-01'), department: 'Finance', remote: false },
        { ...makeJob('b', '2027-01-02'), department: 'Technology', remote: true },
        { ...makeJob('c', '2027-01-03'), department: 'Technology', remote: false, type: 'Contract' },
    ];

    it('returns all jobs when no facets are provided', () => {
        expect(filterJobs(jobs, {})).toHaveLength(3);
    });

    it('filters by department', () => {
        expect(filterJobs(jobs, { department: 'Technology' }).map((j) => j.slug)).toEqual(['b', 'c']);
    });

    it('returns an empty array when nothing matches', () => {
        expect(filterJobs(jobs, { department: 'Legal' })).toEqual([]);
    });

    it('combines facets', () => {
        expect(filterJobs(jobs, { department: 'Technology', remote: false }).map((j) => j.slug)).toEqual(['c']);
        expect(filterJobs(jobs, { type: 'Contract' }).map((j) => j.slug)).toEqual(['c']);
    });

    it('does not mutate the input array', () => {
        const copy = [...jobs];
        filterJobs(jobs, { department: 'Finance' });
        expect(jobs).toEqual(copy);
    });
});

describe('getDepartments', () => {
    it('returns unique departments sorted alphabetically', () => {
        const jobs = [
            { ...makeJob('a', '2027-01-01'), department: 'Technology' },
            { ...makeJob('b', '2027-01-02'), department: 'Finance' },
            { ...makeJob('c', '2027-01-03'), department: 'Technology' },
        ];
        expect(getDepartments(jobs)).toEqual(['Finance', 'Technology']);
    });
});
