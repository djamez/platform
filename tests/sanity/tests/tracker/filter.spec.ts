import { expect, test } from '@playwright/test'
import { generateId, iterateLocator, PlatformSetting, PlatformURI } from '../utils'
import { LeftSideMenuPage } from '../model/left-side-menu-page'
import { IssuesPage } from '../model/tracker/issues-page'
import { DateDivided, NewIssue } from '../model/tracker/types'
import { DEFAULT_STATUSES, DEFAULT_STATUSES_ID, PRIORITIES } from './tracker.utils'
import { IssuesDetailsPage } from '../model/tracker/issues-details-page'

test.use({
  storageState: PlatformSetting
})

test.describe('Tracker filters tests', () => {
  test.beforeEach(async ({ page }) => {
    await (await page.goto(`${PlatformURI}/workbench/sanity-ws`))?.finished()
  })

  test('Modified date', async ({ page }) => {
    const newIssue: NewIssue = {
      title: `Issue for the Modified filter-${generateId()}`,
      description: 'Issue for the Modified filter',
      status: 'In Progress',
      priority: 'Urgent',
      assignee: 'Appleseed John',
      createLabel: true,
      component: 'No component',
      estimation: '2',
      milestone: 'No Milestone',
      duedate: 'today',
      filePath: 'cat.jpeg'
    }

    const leftSideMenuPage = new LeftSideMenuPage(page)
    await leftSideMenuPage.buttonTracker.click()

    const issuesPage = new IssuesPage(page)
    await issuesPage.modelSelectorAll.click()
    await issuesPage.createNewIssue(newIssue)

    await test.step('Check Filter Today', async () => {
      await issuesPage.selectFilter('Modified date', 'Today')
      await issuesPage.checkFilter('Modified date', 'Today')

      await issuesPage.checkFilteredIssueExist(newIssue.title)
    })

    await test.step('Check Filter Yesterday', async () => {
      await issuesPage.updateFilterDimension('Yesterday')
      await issuesPage.checkFilter('Modified date', 'Yesterday')

      await issuesPage.checkFilteredIssueNotExist(newIssue.title)
    })

    await test.step('Check Filter This week', async () => {
      await issuesPage.updateFilterDimension('This week')
      await issuesPage.checkFilter('Modified date', 'This week')

      await issuesPage.checkFilteredIssueExist(newIssue.title)
    })

    await test.step('Check Filter This month', async () => {
      await issuesPage.updateFilterDimension('This month')
      await issuesPage.checkFilter('Modified date', 'This month')

      await issuesPage.checkFilteredIssueExist(newIssue.title)
    })

    await test.step('Check Filter Exact date - Today', async () => {
      await issuesPage.updateFilterDimension('Exact date', 'Today')
      await issuesPage.checkFilter('Modified date', 'is', 'Today')

      await issuesPage.checkFilteredIssueExist(newIssue.title)
    })

    await test.step('Check Filter Before date - Today', async () => {
      await issuesPage.updateFilterDimension('Before date')
      await issuesPage.checkFilter('Modified date', 'Before', 'Today')

      await issuesPage.checkFilteredIssueNotExist(newIssue.title)
    })

    await test.step('Check Filter After date - Today', async () => {
      await issuesPage.updateFilterDimension('After date')
      await issuesPage.checkFilter('Modified date', 'After', 'Today')

      await issuesPage.checkFilteredIssueExist(newIssue.title)
    })

    await test.step('Check Filter Between Dates', async () => {
      await issuesPage.updateFilterDimension('Between dates')
      const dateYesterday = new Date()
      dateYesterday.setDate(dateYesterday.getDate() - 1)
      const dateTomorrow = new Date()
      dateTomorrow.setDate(dateTomorrow.getDate() + 1)
      const dateYesterdayDivided: DateDivided = {
        day: dateYesterday.getDate().toString(),
        month: (dateYesterday.getMonth() + 1).toString(),
        year: dateYesterday.getFullYear().toString()
      }
      const dateTomorrowDivided: DateDivided = {
        day: dateTomorrow.getDate().toString(),
        month: (dateTomorrow.getMonth() + 1).toString(),
        year: dateTomorrow.getFullYear().toString()
      }

      await issuesPage.fillBetweenDate(dateYesterdayDivided, dateTomorrowDivided)
      await issuesPage.checkFilter('Modified date', 'is between', dateYesterday.getDate().toString())
      await issuesPage.checkFilter('Modified date', 'is between', dateTomorrow.getDate().toString())

      await issuesPage.checkFilteredIssueExist(newIssue.title)
    })
  })

  test('Created date', async ({ page }) => {
    const yesterdayIssueTitle = 'Issue for the Check Filter Yesterday'
    const newIssue: NewIssue = {
      title: `Issue for the Created filter-${generateId()}`,
      description: 'Issue for the Created filter',
      status: 'In Progress',
      priority: 'Urgent',
      assignee: 'Appleseed John',
      createLabel: true,
      component: 'No component',
      estimation: '2',
      milestone: 'No Milestone',
      duedate: 'today',
      filePath: 'cat.jpeg'
    }

    const leftSideMenuPage = new LeftSideMenuPage(page)
    await leftSideMenuPage.buttonTracker.click()

    const issuesPage = new IssuesPage(page)
    await issuesPage.modelSelectorAll.click()
    await issuesPage.createNewIssue(newIssue)

    await test.step('Check Filter Today', async () => {
      await issuesPage.selectFilter('Created date', 'Today')
      await issuesPage.checkFilter('Created date', 'Today')

      await issuesPage.checkFilteredIssueExist(newIssue.title)
      await issuesPage.checkFilteredIssueNotExist(yesterdayIssueTitle)
    })

    await test.step('Check Filter Yesterday', async () => {
      await issuesPage.updateFilterDimension('Yesterday')
      await issuesPage.checkFilter('Created date', 'Yesterday')

      await issuesPage.checkFilteredIssueExist(yesterdayIssueTitle)
      await issuesPage.checkFilteredIssueNotExist(newIssue.title)
    })

    await test.step('Check Filter This week', async () => {
      await issuesPage.updateFilterDimension('This week')
      await issuesPage.checkFilter('Created date', 'This week')

      await issuesPage.checkFilteredIssueExist(newIssue.title)
      // this week filter started on Monday, the yesterday created issue on Sunday
      if (new Date().getDay() !== 1) {
        await issuesPage.checkFilteredIssueExist(yesterdayIssueTitle)
      } else {
        await issuesPage.checkFilteredIssueNotExist(yesterdayIssueTitle)
      }
    })

    await test.step('Check Filter This month', async () => {
      await issuesPage.updateFilterDimension('This month')
      await issuesPage.checkFilter('Created date', 'This month')

      await issuesPage.checkFilteredIssueExist(newIssue.title)
      await issuesPage.checkFilteredIssueExist(yesterdayIssueTitle)
    })

    await test.step('Check Filter Exact date - Yesterday', async () => {
      const dateYesterday = new Date()
      dateYesterday.setDate(dateYesterday.getDate() - 1)
      await issuesPage.updateFilterDimension('Exact date', dateYesterday.getDate().toString())
      await issuesPage.checkFilter('Created date', 'is', dateYesterday.getDate().toString())

      await issuesPage.checkFilteredIssueExist(yesterdayIssueTitle)
      await issuesPage.checkFilteredIssueNotExist(newIssue.title)
    })

    await test.step('Check Filter Exact date - Today', async () => {
      await issuesPage.updateFilterDimension('Exact date', 'Today', true)
      await issuesPage.checkFilter('Created date', 'is', 'Today')

      await issuesPage.checkFilteredIssueExist(newIssue.title)
      await issuesPage.checkFilteredIssueNotExist(yesterdayIssueTitle)
    })

    await test.step('Check Filter Before date - Today', async () => {
      await issuesPage.updateFilterDimension('Before date')
      await issuesPage.checkFilter('Created date', 'Before', 'Today')

      await issuesPage.checkFilteredIssueNotExist(newIssue.title)
    })

    await test.step('Check Filter After date - Today', async () => {
      await issuesPage.updateFilterDimension('After date')
      await issuesPage.checkFilter('Created date', 'After', 'Today')

      await issuesPage.checkFilteredIssueExist(newIssue.title)
    })

    await test.step('Check Filter Between Dates', async () => {
      await issuesPage.updateFilterDimension('Between dates')
      const dateYesterday = new Date()
      dateYesterday.setDate(dateYesterday.getDate() - 1)
      const dateTomorrow = new Date()
      dateTomorrow.setDate(dateTomorrow.getDate() + 1)
      const dateYesterdayDivided: DateDivided = {
        day: dateYesterday.getDate().toString(),
        month: (dateYesterday.getMonth() + 1).toString(),
        year: dateYesterday.getFullYear().toString()
      }
      const dateTomorrowDivided: DateDivided = {
        day: dateTomorrow.getDate().toString(),
        month: (dateTomorrow.getMonth() + 1).toString(),
        year: dateTomorrow.getFullYear().toString()
      }

      await issuesPage.fillBetweenDate(dateYesterdayDivided, dateTomorrowDivided)
      await issuesPage.checkFilter('Created date', 'is between', dateYesterday.getDate().toString())
      await issuesPage.checkFilter('Created date', 'is between', dateTomorrow.getDate().toString())

      await issuesPage.checkFilteredIssueExist(newIssue.title)
    })
  })

  test('Status filter', async ({ page }) => {
    const leftSideMenuPage = new LeftSideMenuPage(page)
    await leftSideMenuPage.buttonTracker.click()

    const issuesPage = new IssuesPage(page)
    await issuesPage.modelSelectorAll.click()

    for (const status of DEFAULT_STATUSES) {
      await test.step(`Status Filter ${status}`, async () => {
        await issuesPage.selectFilter('Status', status)
        await issuesPage.inputSearch.press('Escape')

        await issuesPage.checkFilter('Status', 'is')
        await issuesPage.checkAllIssuesInStatus(DEFAULT_STATUSES_ID.get(status), status)
        await issuesPage.buttonClearFilers.click()
      })
    }
  })

  test('Priority filter', async ({ page }) => {
    const leftSideMenuPage = new LeftSideMenuPage(page)
    await leftSideMenuPage.buttonTracker.click()

    const issuesPage = new IssuesPage(page)
    await issuesPage.modelSelectorAll.click()

    for (const priority of PRIORITIES) {
      await test.step(`Priority Filter ${priority}`, async () => {
        await issuesPage.selectFilter('Priority', priority)
        await issuesPage.inputSearch.press('Escape')

        await issuesPage.checkFilter('Priority', 'is')
        await issuesPage.checkAllIssuesByPriority(priority.toLowerCase().replaceAll(' ', ''))
        await issuesPage.buttonClearFilers.click()
      })
    }
  })

  test('Created by filter', async ({ page }) => {
    const createdBy = 'Appleseed John'
    const leftSideMenuPage = new LeftSideMenuPage(page)
    await leftSideMenuPage.buttonTracker.click()

    const issuesPage = new IssuesPage(page)
    await issuesPage.modelSelectorAll.click()

    await issuesPage.selectFilter('Created by', createdBy)
    await issuesPage.inputSearch.press('Escape')

    await issuesPage.checkFilter('Created by', 'is')
    for await (const issue of iterateLocator(issuesPage.issuesList)) {
      await issue.locator('span.list > a').click()

      const issuesDetailsPage = new IssuesDetailsPage(page)
      await expect(issuesDetailsPage.buttonCreatedBy).toHaveText(createdBy)
      await issuesDetailsPage.buttonCloseIssue.click()
    }
  })

  test('Component filter', async ({ page }) => {
    const defaultComponent = 'Default component'
    const leftSideMenuPage = new LeftSideMenuPage(page)
    await leftSideMenuPage.buttonTracker.click()

    const issuesPage = new IssuesPage(page)
    await issuesPage.modelSelectorAll.click()

    await issuesPage.selectFilter('Component', defaultComponent)
    await issuesPage.inputSearch.press('Escape')

    await issuesPage.checkFilter('Component', 'is')
    for await (const issue of iterateLocator(issuesPage.issuesList)) {
      await issue.locator('span.list > a').click()

      const issuesDetailsPage = new IssuesDetailsPage(page)
      await expect(issuesDetailsPage.buttonComponent).toHaveText(defaultComponent)

      await issuesDetailsPage.buttonCloseIssue.click()
    }
  })

  test('Title filter', async ({ page }) => {
    const firstSearch = 'issue'
    const secondSearch = 'done'
    const leftSideMenuPage = new LeftSideMenuPage(page)
    await leftSideMenuPage.buttonTracker.click()

    const issuesPage = new IssuesPage(page)
    await issuesPage.modelSelectorAll.click()

    await test.step(`Check Title filter for ${firstSearch}`, async () => {
      await issuesPage.selectFilter('Title', firstSearch)
      await issuesPage.checkFilter('Title', 'contains', firstSearch)

      for await (const issue of iterateLocator(issuesPage.issuesList)) {
        await expect(issue.locator('span.presenter-label > a')).toContainText(firstSearch, { ignoreCase: true })
      }
    })

    await test.step(`Check Title filter for ${secondSearch}`, async () => {
      await issuesPage.buttonClearFilters.click()
      await issuesPage.selectFilter('Title', secondSearch)
      await issuesPage.checkFilter('Title', 'contains', secondSearch)

      for await (const issue of iterateLocator(issuesPage.issuesList)) {
        await expect(issue.locator('span.presenter-label > a')).toContainText(secondSearch, { ignoreCase: true })
      }
    })
  })

  test('Modified by filter', async ({ page }) => {
    const modifierName = 'Appleseed John'
    const leftSideMenuPage = new LeftSideMenuPage(page)
    await leftSideMenuPage.buttonTracker.click()

    const issuesPage = new IssuesPage(page)
    await issuesPage.modelSelectorAll.click()

    await issuesPage.selectFilter('Modified by', modifierName)
    await issuesPage.inputSearch.press('Escape')
    await issuesPage.checkFilter('Modified by', 'is')

    for await (const issue of iterateLocator(issuesPage.issuesList)) {
      await issue.locator('span.list > a').click()

      const issuesDetailsPage = new IssuesDetailsPage(page)
      await expect(issuesDetailsPage.buttonCreatedBy).toHaveText(modifierName)

      await issuesDetailsPage.buttonCloseIssue.click()
    }
  })

  test('Milestone filter', async ({ page }) => {
    const filterMilestoneName = 'Filter Milestone'
    const milestoneIssue: NewIssue = {
      title: `Issue for the Milestone filter-${generateId()}`,
      description: 'Issue for the Milestone filter',
      milestone: filterMilestoneName
    }

    const leftSideMenuPage = new LeftSideMenuPage(page)
    await leftSideMenuPage.buttonTracker.click()

    const issuesPage = new IssuesPage(page)
    await issuesPage.modelSelectorAll.click()
    await issuesPage.createNewIssue(milestoneIssue)

    await test.step('Check Milestone filter for Filter Milestone', async () => {
      await issuesPage.selectFilter('Milestone', filterMilestoneName)
      await issuesPage.inputSearch.press('Escape')
      await issuesPage.checkFilter('Milestone', 'is', '1 state')

      for await (const issue of iterateLocator(issuesPage.issuesList)) {
        await expect(issue.locator('div.compression-bar button span.label')).toContainText(filterMilestoneName)
      }
    })

    await test.step('Check Milestone filter for Not selected', async () => {
      await issuesPage.buttonClearFilters.click()
      await issuesPage.selectFilter('Milestone', 'Not selected')
      await issuesPage.inputSearch.press('Escape')
      await issuesPage.checkFilter('Milestone', 'is', '1 state')

      for await (const issue of iterateLocator(issuesPage.issuesList)) {
        await issue.locator('span.list > a').click()

        const issuesDetailsPage = new IssuesDetailsPage(page)
        await expect(issuesDetailsPage.buttonMilestone).toHaveText('Milestone')

        await issuesDetailsPage.buttonCloseIssue.click()
      }
    })
  })
})
