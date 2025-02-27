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
  import { Doc, Ref } from '@hcengineering/core'
  import { defineSeparators, location as locationStore, panelSeparators, Separator } from '@hcengineering/ui'
  import { DocNotifyContext } from '@hcengineering/notification'
  import { ActivityMessagesFilter } from '@hcengineering/activity'
  import { getClient } from '@hcengineering/presentation'
  import { Channel } from '@hcengineering/chunter'

  import ChannelComponent from './Channel.svelte'
  import ChannelHeader from './ChannelHeader.svelte'
  import DocAside from './chat/DocAside.svelte'
  import chunter from '../plugin'
  import ChannelAside from './chat/ChannelAside.svelte'

  export let context: DocNotifyContext
  export let object: Doc | undefined = undefined
  export let allowClose = false
  export let embedded = false

  const client = getClient()
  const hierarchy = client.getHierarchy()

  let isThreadOpened = false
  let isAsideShown = false

  let filters: Ref<ActivityMessagesFilter>[] = []

  locationStore.subscribe((newLocation) => {
    isThreadOpened = newLocation.path[4] != null
  })

  $: isDocChat = !hierarchy.isDerived(context.attachedToClass, chunter.class.ChunterSpace)
  $: withAside =
    !embedded && !isThreadOpened && !hierarchy.isDerived(context.attachedToClass, chunter.class.DirectMessage)

  function toChannel (object?: Doc) {
    return object as Channel | undefined
  }

  function toChannelRef (ref: Ref<Doc>) {
    return ref as Ref<Channel>
  }

  defineSeparators('aside', panelSeparators)
</script>

<div class="popupPanel panel" class:embedded>
  <ChannelHeader
    _id={context.attachedTo}
    _class={context.attachedToClass}
    {object}
    {allowClose}
    {withAside}
    bind:filters
    canOpen={isDocChat}
    {isAsideShown}
    on:close
    on:aside-toggled={() => {
      isAsideShown = !isAsideShown
    }}
  />

  <div class="popupPanel-body" class:asideShown={withAside && isAsideShown}>
    <div class="popupPanel-body__main">
      {#key context._id}
        <ChannelComponent {context} {object} {filters} isAsideOpened={(withAside && isAsideShown) || isThreadOpened} />
      {/key}
    </div>

    {#if withAside && isAsideShown}
      <Separator name="aside" float={false} index={0} />
      <div class="popupPanel-body__aside" class:float={false} class:shown={withAside && isAsideShown}>
        <Separator name="aside" float index={0} />
        <div class="antiPanel-wrap__content">
          {#if hierarchy.isDerived(context.attachedToClass, chunter.class.Channel)}
            <ChannelAside
              _id={toChannelRef(context.attachedTo)}
              _class={context.attachedToClass}
              object={toChannel(object)}
            />
          {:else}
            <DocAside _id={context.attachedTo} _class={context.attachedToClass} {object} />
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
