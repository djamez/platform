<script lang="ts">
  import { PersonAccount } from '@hcengineering/contact'
  import { DocumentQuery, Ref, SortingOrder, WithLookup, getCurrentAccount, IdMap, toIdMap } from '@hcengineering/core'
  import { IntlString } from '@hcengineering/platform'
  import { createQuery } from '@hcengineering/presentation'
  import { Scroller, areDatesEqual, todosSP, defaultSP, Header, ButtonIcon, Label } from '@hcengineering/ui'
  import { ToDo, WorkSlot } from '@hcengineering/time'
  import { ToDosMode } from '..'
  import time from '../plugin'
  import { getNearest } from '../utils'
  import CreateToDo from './CreateToDo.svelte'
  import ToDoGroup from './ToDoGroup.svelte'
  import IconDiff from './icons/Diff.svelte'
  import tags, { TagElement } from '@hcengineering/tags'
  import IconMenu from './icons/Menu.svelte'
  import tracker, { Project } from '@hcengineering/tracker'
  import view from '@hcengineering/view-resources/src/plugin'

  export let mode: ToDosMode
  export let tag: Ref<TagElement> | undefined
  export let currentDate: Date

  const acc = getCurrentAccount() as PersonAccount
  const user = acc.person
  let largeSize: boolean = false

  const doneQuery = createQuery()
  const inboxQuery = createQuery()
  const activeQuery = createQuery()

  const tagsQuery = createQuery()
  const projectsQuery = createQuery()

  let projects: IdMap<Project> = new Map()
  projectsQuery.query(tracker.class.Project, { archived: false }, (result) => {
    projects = toIdMap(result)
  })

  let ids: Ref<ToDo>[] = []

  $: updateTags(mode, tag)

  function updateTags (mode: ToDosMode, tag: Ref<TagElement> | undefined): void {
    if (mode !== 'tag' || tag === undefined) {
      tagsQuery.unsubscribe()
      ids = []
      return
    }
    tagsQuery.query(
      tags.class.TagReference,
      {
        tag
      },
      (res) => {
        ids = res.map((p) => p.attachedTo as Ref<ToDo>)
      }
    )
  }

  function update (mode: ToDosMode, currentDate: Date, ids: Ref<ToDo>[]): void {
    let activeQ: DocumentQuery<ToDo> | undefined = undefined
    let doneQ: DocumentQuery<ToDo> | undefined = undefined
    let inboxQ: DocumentQuery<ToDo> | undefined = undefined
    if (mode === 'unplanned') {
      activeQ = undefined
      doneQ = undefined
      inboxQ = {
        user,
        doneOn: null,
        workslots: 0
      }
    } else if (mode === 'planned') {
      inboxQ = undefined
      doneQ = {
        doneOn: { $gte: currentDate.setHours(0, 0, 0, 0), $lte: currentDate.setHours(23, 59, 59, 999) },
        user
      }
      activeQ = {
        user,
        doneOn: null,
        workslots: { $gt: 0 }
      }
    } else if (mode === 'all') {
      inboxQ = {
        doneOn: null,
        workslots: 0,
        user
      }
      doneQ = {
        doneOn: { $ne: null },
        user
      }
      activeQ = {
        user,
        doneOn: null,
        workslots: { $gt: 0 }
      }
    } else if (mode === 'tag') {
      inboxQ = {
        doneOn: null,
        workslots: 0,
        user,
        _id: { $in: ids }
      }
      doneQ = {
        doneOn: { $ne: null },
        user,
        _id: { $in: ids }
      }
      activeQ = {
        user,
        doneOn: null,
        workslots: { $gt: 0 },
        _id: { $in: ids }
      }
    }
    if (activeQ !== undefined) {
      activeQuery.query(
        time.class.ToDo,
        activeQ,
        (res) => {
          rawActive = res
        },
        {
          limit: 200,
          sort: { modifiedOn: SortingOrder.Ascending },
          lookup: { _id: { workslots: time.class.WorkSlot } }
        }
      )
    } else {
      activeQuery.unsubscribe()
      rawActive = []
    }

    if (inboxQ !== undefined) {
      inboxQuery.query(
        time.class.ToDo,
        inboxQ,
        (res) => {
          inbox = res
        },
        {
          limit: 200,
          sort: { modifiedOn: SortingOrder.Ascending }
        }
      )
    } else {
      inboxQuery.unsubscribe()
      inbox = []
    }

    if (doneQ !== undefined) {
      doneQuery.query(
        time.class.ToDo,
        doneQ,
        (res) => {
          done = res
        },
        { limit: 200, sort: { doneOn: SortingOrder.Descending }, lookup: { _id: { workslots: time.class.WorkSlot } } }
      )
    } else {
      doneQuery.unsubscribe()
      done = []
    }
  }

  $: update(mode, currentDate, ids)

  let inbox: WithLookup<ToDo>[] = []
  let done: WithLookup<ToDo>[] = []
  let rawActive: WithLookup<ToDo>[] = []
  $: active = filterActive(mode, rawActive, currentDate)

  $: groups = group(inbox, done, active)

  function filterActive (mode: ToDosMode, raw: WithLookup<ToDo>[], currentDate: Date): WithLookup<ToDo>[] {
    if (mode === 'planned') {
      const today = areDatesEqual(new Date(), currentDate)
      const res: WithLookup<ToDo>[] = []
      const endDay = new Date().setHours(23, 59, 59, 999)
      for (const todo of raw) {
        const nearest = getNearest(getWorkslots(todo))
        if (nearest === undefined) {
          res.push(todo)
        } else {
          if (today) {
            if (nearest.dueDate < endDay) {
              res.push(todo)
            }
          } else if (areDatesEqual(new Date(nearest.date), currentDate)) {
            res.push(todo)
          }
        }
      }
      return res
    } else {
      return raw
    }
  }

  function getWorkslots (todo: WithLookup<ToDo>): WorkSlot[] {
    return (todo.$lookup?.workslots ?? []) as WorkSlot[]
  }

  function group (
    unplanned: WithLookup<ToDo>[],
    done: WithLookup<ToDo>[],
    active: WithLookup<ToDo>[]
  ): [IntlString, WithLookup<ToDo>[]][] {
    const groups = new Map<IntlString, WithLookup<ToDo>[]>([
      [time.string.Unplanned, unplanned],
      [time.string.ToDos, []],
      [time.string.Scheduled, []],
      [time.string.Done, done]
    ])
    const now = Date.now()
    const todos: {
      nearest: WorkSlot | undefined
      todo: WithLookup<ToDo>
    }[] = []
    const scheduled: {
      nearest: WorkSlot | undefined
      todo: WithLookup<ToDo>
    }[] = []
    for (const todo of active) {
      if (todo.$lookup?.workslots !== undefined) {
        todo.$lookup.workslots = getWorkslots(todo).sort((a, b) => a.date - b.date)
      }
      const nearest = getNearest(getWorkslots(todo))
      if (nearest === undefined || nearest.dueDate < now) {
        todos.push({
          nearest,
          todo
        })
      } else {
        scheduled.push({
          nearest,
          todo
        })
      }
    }
    todos.sort((a, b) => (a.nearest?.date ?? 0) - (b.nearest?.date ?? 0))
    scheduled.sort((a, b) => (a.nearest?.date ?? 0) - (b.nearest?.date ?? 0))
    groups.set(
      time.string.ToDos,
      todos.map((p) => p.todo)
    )
    groups.set(
      time.string.Scheduled,
      scheduled.map((p) => p.todo)
    )
    return Array.from(groups).filter((p) => p[1].length > 0)
  }
  const getDateStr = (date: Date): string => {
    return date.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })
  }
</script>

<div class="toDos-container">
  <Header type={'type-panel'} hideSeparator>
    <ButtonIcon icon={IconMenu} kind={'tertiary'} size={'small'} />
    <div class="heading-bold-20 ml-4">
      <Label label={time.string.ToDoColon} />
      {#if mode === 'date'}
        {getDateStr(currentDate)}
      {:else}
        <Label
          label={mode === 'all'
            ? time.string.All
            : mode === 'planned'
              ? time.string.Planned
              : mode === 'unplanned'
                ? time.string.Unplanned
                : view.string.Labels}
        />
      {/if}
    </div>
    <svelte:fragment slot="actions">
      <ButtonIcon
        icon={IconDiff}
        size={'small'}
        kind={'tertiary'}
        pressed={largeSize}
        on:click={() => (largeSize = !largeSize)}
      />
    </svelte:fragment>
  </Header>
  <CreateToDo fullSize />

  <Scroller fade={groups.length > 1 ? todosSP : defaultSP} noStretch>
    {#each groups as group}
      <ToDoGroup
        todos={group[1]}
        title={group[0]}
        showTitle={groups.length > 1}
        showDuration={group[0] !== time.string.Unplanned}
        {mode}
        {projects}
        {largeSize}
        on:dragstart
        on:dragend
      />
    {/each}
  </Scroller>
</div>

<style lang="scss">
  /* Global styles in components.scss */
  .toDos-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    // height: 100%;
    min-width: 0;
    min-height: 0;
  }
</style>
