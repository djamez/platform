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
  import activity, {
    ActivityMessageExtension,
    ActivityMessageViewlet,
    DisplayActivityMessage
  } from '@hcengineering/activity'
  import { Person } from '@hcengineering/contact'
  import { Avatar, EmployeePresenter, SystemAvatar } from '@hcengineering/contact-resources'
  import core, { getDisplayTime } from '@hcengineering/core'
  import { getClient } from '@hcengineering/presentation'
  import { Action, Label, tooltip } from '@hcengineering/ui'
  import { getActions, restrictionStore } from '@hcengineering/view-resources'
  import { getEmbeddedLabel } from '@hcengineering/platform'

  import ReactionsPresenter from '../reactions/ReactionsPresenter.svelte'
  import ActivityMessageExtensionComponent from './ActivityMessageExtension.svelte'
  import ActivityMessagePresenter from './ActivityMessagePresenter.svelte'
  import ActivityMessageActions from '../ActivityMessageActions.svelte'
  import { isReactionMessage } from '../../activityMessagesUtils'
  import Bookmark from '../icons/Bookmark.svelte'
  import { savedMessagesStore } from '../../activity'

  export let message: DisplayActivityMessage
  export let parentMessage: DisplayActivityMessage | undefined = undefined

  export let viewlet: ActivityMessageViewlet | undefined = undefined
  export let person: Person | undefined = undefined
  export let actions: Action[] = []
  export let excludedActions: string[] = []
  export let showNotify: boolean = false
  export let isHighlighted: boolean = false
  export let isSelected: boolean = false
  export let shouldScroll: boolean = false
  export let embedded: boolean = false
  export let withActions: boolean = true
  export let withFlatActions: boolean = true
  export let showEmbedded = false
  export let hideFooter = false
  export let skipLabel = false
  export let hoverable = true
  export let hoverStyles: 'borderedHover' | 'filledHover' = 'borderedHover'
  export let onClick: (() => void) | undefined = undefined
  export let onReply: (() => void) | undefined = undefined

  const client = getClient()

  let allActionIds: string[] = []

  let element: HTMLDivElement | undefined = undefined
  let extensions: ActivityMessageExtension[] = []
  let isActionsOpened = false

  let isSaved = false

  savedMessagesStore.subscribe((saved) => {
    isSaved = saved.some((savedMessage) => savedMessage.attachedTo === message._id)
  })

  $: withActions &&
    getActions(client, message, activity.class.ActivityMessage).then((res) => {
      allActionIds = res.map(({ _id }) => _id)
    })

  function scrollToMessage (): void {
    if (element != null && shouldScroll) {
      element.scrollIntoView({ behavior: 'auto', block: 'end' })
      shouldScroll = false
    }
  }

  $: if (element != null && shouldScroll) {
    setTimeout(scrollToMessage, 100)
  }

  void client
    .findAll(activity.class.ActivityMessageExtension, { ofMessage: message._class })
    .then((res: ActivityMessageExtension[]) => {
      extensions = res
    })

  function handleActionsOpened (): void {
    isActionsOpened = true
  }

  function handleActionsClosed (): void {
    isActionsOpened = false
  }

  $: key = parentMessage != null ? `${message._id}_${parentMessage._id}` : message._id

  $: isHidden = !!viewlet?.onlyWithParent && parentMessage === undefined
  $: withActionMenu =
    withActions && !embedded && (actions.length > 0 || allActionIds.some((id) => !excludedActions.includes(id)))

  let readonly: boolean = false
  $: readonly = $restrictionStore.disableComments

  $: fullDate = new Date(message.createdOn ?? message.modifiedOn).toLocaleString('default', {
    minute: '2-digit',
    hour: 'numeric',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
</script>

{#if !isHidden}
  {#key key}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      bind:this={element}
      id={message._id}
      class="activityMessage clear-mins"
      class:clickable={!!onClick}
      class:highlighted={isHighlighted}
      class:selected={isSelected}
      class:hoverable
      class:embedded
      class:actionsOpened={isActionsOpened}
      class:borderedHover={hoverStyles === 'borderedHover'}
      class:filledHover={hoverStyles === 'filledHover'}
      on:click={onClick}
    >
      {#if showNotify && !embedded}
        <div class="notify" />
      {/if}
      {#if !embedded}
        <div class="min-w-6 mt-1 relative">
          {#if $$slots.icon}
            <slot name="icon" />
          {:else if person}
            <Avatar size="medium" avatar={person.avatar} name={person.name} />
          {:else}
            <SystemAvatar size="medium" />
          {/if}
          {#if isSaved}
            <div class="saveMarker">
              <Bookmark size="xx-small" />
            </div>
          {/if}
        </div>
      {:else}
        <div class="embeddedMarker" />
      {/if}
      <div class="flex-col ml-2 w-full clear-mins message-content">
        <div class="header clear-mins">
          {#if person}
            <EmployeePresenter value={person} shouldShowAvatar={false} compact />
          {:else}
            <div class="strong">
              <Label label={core.string.System} />
            </div>
          {/if}

          {#if !skipLabel}
            <slot name="header" />
          {/if}
          <span
            class="text-sm"
            use:tooltip={{
              label: getEmbeddedLabel(fullDate)
            }}
          >
            {getDisplayTime(message.createdOn ?? 0)}
          </span>
        </div>

        <slot name="content" />

        {#if !hideFooter}
          <ActivityMessageExtensionComponent
            kind="footer"
            {extensions}
            props={{ object: message, embedded, onReply }}
          />
        {/if}
        <ReactionsPresenter object={message} {readonly} />
        {#if parentMessage && showEmbedded}
          <div class="mt-2" />
          <ActivityMessagePresenter value={parentMessage} embedded hideFooter withActions={false} />
        {/if}
      </div>

      {#if withActions && !readonly}
        <div class="actions" class:opened={isActionsOpened}>
          <ActivityMessageActions
            message={isReactionMessage(message) ? parentMessage : message}
            {extensions}
            {actions}
            {withActionMenu}
            {withFlatActions}
            {excludedActions}
            on:open={handleActionsOpened}
            on:close={handleActionsClosed}
          />
        </div>
      {/if}
    </div>
  {/key}
{/if}

<style lang="scss">
  @keyframes highlight {
    50% {
      background-color: var(--global-ui-highlight-BackgroundColor);
    }
  }

  .activityMessage {
    position: relative;
    display: flex;
    flex-shrink: 0;
    padding: 0.75rem 0.75rem 0.75rem 1rem;
    gap: 1rem;
    //overflow: hidden;
    border: 1px solid transparent;
    border-radius: 0.25rem;
    width: 100%;

    &.clickable {
      cursor: pointer;
    }

    &.highlighted {
      animation: highlight 3000ms ease-in-out;
    }

    &.selected {
      background-color: var(--highlight-select);
    }

    &.embedded {
      padding: 0.75rem 0 0 0;
      gap: 0.25rem;
      border-radius: 0;
    }

    .actions {
      position: absolute;
      visibility: hidden;
      top: -0.75rem;
      right: 0.75rem;

      &.opened {
        visibility: visible;
      }
    }

    &:hover > .actions {
      visibility: visible;
    }

    &.actionsOpened {
      &.borderedHover {
        border: 1px solid var(--highlight-hover);
      }

      &.filledHover {
        background-color: var(--global-ui-BackgroundColor);
      }
    }

    &.hoverable {
      &:hover:not(.embedded) {
        &.borderedHover {
          border: 1px solid var(--highlight-hover);
        }

        &.filledHover {
          background-color: var(--global-ui-BackgroundColor);
        }
      }
    }
  }

  .header {
    display: flex;
    align-items: baseline;
    font-size: 0.875rem;
    color: var(--theme-halfcontent-color);
    margin-bottom: 0.25rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    span {
      margin-left: 0.25rem;
      font-weight: 400;
      line-height: 1.25rem;
    }
  }

  .notify {
    position: absolute;
    top: 0.5rem;
    left: 0.25rem;
    height: 0.5rem;
    width: 0.5rem;
    background-color: var(--theme-inbox-notify);
    border-radius: 50%;
  }

  .embeddedMarker {
    width: 0.25rem;
    border-radius: 0.5rem;
    background: var(--secondary-button-default);
  }

  .saveMarker {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    padding: var(--spacing-1);
    border-radius: 50%;
    background: linear-gradient(0deg, var(--button-primary-BackgroundColor), var(--button-primary-BackgroundColor)),
      linear-gradient(0deg, var(--global-ui-BackgroundColor), var(--global-ui-BackgroundColor));
    border: 1px solid var(--global-ui-BackgroundColor);
    top: -0.5rem;
    left: -0.5rem;
    color: var(--white-color);
  }

  .message-content {
    height: max-content;
    flex-shrink: 1;
    padding: 0;
  }
</style>
