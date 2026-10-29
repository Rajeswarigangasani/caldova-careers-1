import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Derive the expected posting count from the job content collection so this
// assertion stays correct as roles are added or removed.
const jobsDir = fileURLToPath(new URL('../src/content/jobs', import.meta.url));
const expectedRoleCount = readdirSync(jobsDir).filter((f) => f.endsWith('.md')).length;

const departmentCounts = new Map<string, number>();
for (const file of readdirSync(jobsDir).filter((f) => f.endsWith('.md'))) {
    const department = /^department:\s*"(.+)"$/m.exec(readFileSync(`${jobsDir}/${file}`, 'utf8'))![1];
    departmentCounts.set(department, (departmentCounts.get(department) ?? 0) + 1);
}
const [sampleDepartment, sampleCount] = [...departmentCounts.entries()][0];

test.describe('Open roles listing', () => {
    test('shows the roles grid with all postings', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { name: 'Open roles' })).toBeVisible();

        const grid = page.getByTestId('roles-grid');
        await expect(grid).toBeVisible();
        await expect(page.getByTestId('role-card')).toHaveCount(expectedRoleCount);
    });

    test('links through to a role detail page', async ({ page }) => {
        await page.goto('/');
        const firstCard = page.getByTestId('role-card').first();
        const title = await firstCard.getByTestId('role-title').textContent();
        await firstCard.click();
        await expect(page.getByTestId('role-detail-title')).toHaveText(title!.trim());
        await expect(page.getByTestId('apply-form')).toBeVisible();
    });

    for (const { title, location } of [
        { title: 'Senior Frontend Engineer', location: 'Remote (US & Canada)' },
        { title: 'Financial Analyst', location: 'Woodinville, WA, USA' },
    ]) {
        test(`keeps ${title} location on details, not starter cards`, async ({ page }) => {
            await page.goto('/');
            const card = page.getByTestId('role-card').filter({
                has: page.getByRole('heading', { name: title, exact: true }),
            });

            await expect(card).toBeVisible();
            await expect(card.getByText(location, { exact: true })).toHaveCount(0);
            await card.click();
            await expect(page.getByText(location, { exact: true })).toBeVisible();
        });
    }

    test('filters roles by department', async ({ page }) => {
        await page.goto('/');
        const visibleCards = page.locator('[data-testid="role-card"]:visible');
        const filter = page.getByTestId('department-filter');

        await test.step('select a department', async () => {
            await filter.selectOption(sampleDepartment);
            await expect(visibleCards).toHaveCount(sampleCount);
            await expect(page).toHaveURL(/department=/);
        });

        await test.step('reset to all departments', async () => {
            await filter.selectOption('');
            await expect(visibleCards).toHaveCount(expectedRoleCount);
        });
    });

    test('preselects the department from the URL', async ({ page }) => {
        await page.goto(`/?department=${encodeURIComponent(sampleDepartment)}`);
        await expect(page.getByTestId('department-filter')).toHaveValue(sampleDepartment);
        await expect(page.locator('[data-testid="role-card"]:visible')).toHaveCount(sampleCount);
    });

    test('has no automatically detectable accessibility violations', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();
        expect(results.violations).toEqual([]);
    });
});
