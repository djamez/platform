<!--
// Copyright © 2024 Hardcore Engineering Inc.
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
  import { ActivityExtension as ActivityExtensionComponent } from '@hcengineering/activity-resources'
  import { Class, Doc, Ref } from '@hcengineering/core'
  import activity, { ActivityExtension } from '@hcengineering/activity'
  import { getClient } from '@hcengineering/presentation'
  import { AnySvelteComponent, Icon, Label } from '@hcengineering/ui'
  import { Asset, getResource, IntlString } from '@hcengineering/platform'
  import view from '@hcengineering/view'

  import { getChannelName, getObjectIcon } from '../utils'
  import chunter from '../plugin'

  export let object: Doc
  export let readonly = false
  export let boundary: HTMLElement | undefined | null = undefined
  export let collection: string | undefined
  export let isThread = false
  export let autofocus = true

  const client = getClient()
  const hierarchy = client.getHierarchy()

  let extensions: ActivityExtension[] = []
  $: extensions = getExtensions(object._class)

  function getExtensions (_class: Ref<Class<Doc>>): ActivityExtension[] {
    try {
      let clazz: Ref<Class<Doc>> | undefined = _class
      while (clazz !== undefined) {
        const res = client.getModel().findAllSync(activity.class.ActivityExtension, { ofClass: clazz })
        if (res.length > 0) {
          return res
        }
        clazz = hierarchy.getClass(clazz).extends
      }
    } catch (e) {
      console.error(e)
      return []
    }
    return []
  }

  let icon: Asset | AnySvelteComponent | undefined = undefined

  $: void updateIcon(object._class)

  async function updateIcon (_class: Ref<Class<Doc>>): Promise<void> {
    if (isThread) {
      return
    }
    const iconMixin = hierarchy.classHierarchyMixin(_class, view.mixin.ObjectIcon)
    let result: AnySvelteComponent | Asset | undefined = undefined

    if (iconMixin?.component) {
      result = await getResource(iconMixin.component)
    } else {
      result = getObjectIcon(_class)
    }
    icon = result
  }

  async function getName (object: Doc): Promise<{ name: string | undefined, label: IntlString | undefined }> {
    const name = await getChannelName(object._id, object._class, object)
    const label = client.getHierarchy().getClass(object._class).label

    return { name, label }
  }
</script>

{#if !readonly}
  <div class="ref-input flex-col">
    <ActivityExtensionComponent
      kind="input"
      {extensions}
      props={{ object, boundary, collection, autofocus, withTypingInfo: true }}
    />
  </div>
{:else}
  <div class="message">
    {#if isThread}
      <Label label={chunter.string.ViewingThreadFromArchivedChannel} />
    {:else}
      <Label label={chunter.string.ViewingArchivedChannel} />
      <span class="info">
        {#if icon}
          <Icon {icon} size="x-small" />
        {/if}
        {#await getName(object) then data}
          {#if data.name}
            {data.name}
          {:else if data.label}
            <Label label={data.label} />
          {/if}
        {/await}
      </span>
    {/if}
  </div>
{/if}

<style lang="scss">
  .ref-input {
    flex-shrink: 0;
    margin: 0 1rem;
    max-height: 18.75rem;
  }

  .message {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 1rem 1rem;
    padding: 0.5rem 0;
    color: var(--global-primary-TextColor);
    background: var(--global-ui-BorderColor);
    border-radius: 0.5rem;
  }

  .info {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 0.25rem;
    gap: 0.125rem;
    font-weight: 600;
  }
</style>
