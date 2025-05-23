<!--
// Copyright © 2023 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
-->
<script lang="ts">
  import { DateRangeMode, convertToDay } from '@hcengineering/core'
  import { IntlString } from '@hcengineering/platform'
  import { createEventDispatcher } from 'svelte'
  import {
    ActionIcon,
    Button,
    IconClose,
    Label,
    Scroller,
    checkAdaptiveMatching,
    deviceOptionsStore as deviceInfo,
    getUserTimezone
  } from '../..'
  import ui from '../../plugin'
  import DateInputBox from './DateInputBox.svelte'
  import MonthSquare from './MonthSquare.svelte'
  import Shifts from './Shifts.svelte'

  export let currentDate: Date | null
  export let withTime: boolean = false
  export let mondayStart: boolean = true
  export let label = currentDate != null ? ui.string.EditDueDate : ui.string.AddDueDate
  export let detail: IntlString | undefined = undefined
  export let noShift: boolean = false
  export let timeZone: string = getUserTimezone()

  const dispatch = createEventDispatcher()

  const today: Date = new Date(Date.now())
  $: devSize = $deviceInfo.size
  $: oneMonth = checkAdaptiveMatching(devSize, 'sm')

  $: docHeight = $deviceInfo.docHeight
  const rem = (n: number, fs: number): number => n * fs
  $: scrolled = docHeight < rem(39, $deviceInfo.fontSize)

  let viewDate: Date = currentDate ?? today
  let viewDateSec: Date
  let dateInput: DateInputBox

  const saveDate = (withTime: boolean = false): void => {
    if (currentDate) {
      if (!withTime) {
        currentDate = convertToDay(currentDate)
      } else {
        currentDate.setSeconds(0, 0)
      }
      viewDate = currentDate = currentDate
      dispatch('update', currentDate)
    }
  }
  const closeDP = (withTime: boolean = false): void => {
    if (!dateInput.isNull(currentDate, withTime)) saveDate(withTime)
    else {
      currentDate = null
      dispatch('update', null)
    }
    dispatch('close', { value: currentDate })
  }

  const updateDate = (date: Date | null): void => {
    if (date) {
      currentDate = date
      closeDP()
    }
  }
  const navigateMonth = (result: any): void => {
    if (result) {
      viewDate.setDate(1)
      viewDate.setMonth(viewDate.getMonth() + result)
      viewDate = viewDate
    }
  }
  const changeMonth = (date: Date): Date => {
    // We should use the second day to protect the result of the month-shifted against the effects of time zone changes.
    const secondDay = 2
    return new Date(date.getFullYear(), date.getMonth() + 1, secondDay)
  }

  $: if (viewDate) viewDateSec = changeMonth(viewDate)
</script>

<div class="date-popup-container">
  <div class="header">
    <span class="fs-title overflow-label"><Label {label} /></span>
    <ActionIcon
      icon={IconClose}
      size={'small'}
      action={() => {
        dispatch('close')
      }}
    />
  </div>
  <div class="content">
    {#if detail}
      <div class="label"><Label label={detail} /></div>
    {/if}

    <DateInputBox
      bind:this={dateInput}
      bind:currentDate
      {withTime}
      {timeZone}
      kind={'plain'}
      on:close={() => {
        closeDP(withTime)
      }}
      on:save={() => {
        saveDate(withTime)
      }}
    />
    <div class="divider" class:x2={!scrolled} />
    {#if scrolled}
      <Scroller thinScrollBars>
        <div class="divider" />
        <div class="month-group">
          <MonthSquare
            bind:currentDate
            {viewDate}
            {timeZone}
            {mondayStart}
            viewUpdate={false}
            hideNavigator={'all'}
            noPadding
            on:update={(result) => {
              updateDate(result.detail)
            }}
          />
          {#if !oneMonth}
            <div class="space" />
            <MonthSquare
              bind:currentDate
              viewDate={viewDateSec}
              {mondayStart}
              {timeZone}
              viewUpdate={false}
              noPadding
              on:update={(result) => {
                updateDate(result.detail)
              }}
              on:navigation={(result) => {
                navigateMonth(result.detail)
              }}
            />
          {/if}
        </div>
      </Scroller>
    {:else}
      <div class="month-group">
        <MonthSquare
          bind:currentDate
          {viewDate}
          {mondayStart}
          {timeZone}
          viewUpdate={false}
          hideNavigator={'all'}
          noPadding
          on:update={(result) => {
            updateDate(result.detail)
          }}
        />
        {#if !oneMonth}
          <div class="space" />
          <MonthSquare
            bind:currentDate
            {timeZone}
            viewDate={viewDateSec}
            {mondayStart}
            viewUpdate={false}
            noPadding
            on:update={(result) => {
              updateDate(result.detail)
            }}
            on:navigation={(result) => {
              navigateMonth(result.detail)
            }}
          />
        {/if}
      </div>
    {/if}
  </div>
  <div class="footer">
    <Button
      kind={'primary'}
      label={ui.string.Save}
      size={'large'}
      on:click={() => {
        closeDP(withTime)
      }}
    />
  </div>
</div>
<Shifts
  {currentDate}
  on:change={(evt) => {
    currentDate = evt.detail
    closeDP(withTime)
  }}
  shift={!noShift}
  mode={withTime ? DateRangeMode.DATETIME : DateRangeMode.DATE}
/>

<style lang="scss">
  .date-popup-container {
    display: flex;
    flex-direction: column;
    min-height: 0;
    max-width: calc(100vw - 2rem);
    max-height: calc(100vh - 2rem);
    width: max-content;
    height: max-content;
    color: var(--theme-caption-color);
    background: var(--theme-popup-color);
    border-radius: 0.5rem;
    box-shadow: var(--theme-popup-shadow);

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
    }

    .content {
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding: 0 1.5rem 1.5rem;
      min-height: 0;

      .label {
        margin-bottom: 0.25rem;
        font-size: 0.875rem;
        color: var(--theme-dark-color);
      }

      .month-group {
        display: flex;
        flex-wrap: nowrap;

        .space {
          flex-shrink: 0;
          width: 2rem;
        }
      }
    }
    .divider {
      flex-shrink: 0;
      height: 0.75rem;

      &.x2 {
        height: 1.5rem;
      }
    }

    .footer {
      display: flex;
      flex-direction: row-reverse;
      align-items: center;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--theme-popup-divider);
    }
  }
</style>
