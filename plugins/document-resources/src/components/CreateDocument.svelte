<!--
//
// Copyright © 2022, 2023, 2024 Hardcore Engineering Inc.
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
//
-->
<script lang="ts">
  import { AttachedData, Ref, generateId } from '@hcengineering/core'
  import { Document, Teamspace } from '@hcengineering/document'
  import { Card, SpaceSelector, getClient } from '@hcengineering/presentation'
  import {
    Button,
    createFocusManager,
    EditBox,
    FocusHandler,
    getPlatformColorDef,
    IconWithEmoji,
    showPopup,
    themeStore
  } from '@hcengineering/ui'
  import view from '@hcengineering/view'
  import { IconPicker, ObjectBox } from '@hcengineering/view-resources'
  import { createEventDispatcher } from 'svelte'
  import document from '../plugin'
  import { createEmptyDocument } from '../utils'
  import TeamspacePresenter from './teamspace/TeamspacePresenter.svelte'

  export function canClose (): boolean {
    return object.name === ''
  }

  export let space: Ref<Teamspace>
  export let parent: Ref<Document> | undefined

  const id: Ref<Document> = generateId()

  const object: Omit<AttachedData<Document>, 'content'> = {
    name: '',
    attachments: 0,
    labels: 0,
    comments: 0,
    references: 0
  }

  const dispatch = createEventDispatcher()
  const client = getClient()

  let _space = space
  let _parent = parent

  $: if (_space !== space) _parent = undefined
  $: canSave = getTitle(object.name).length > 0 && _space !== undefined

  function chooseIcon (): void {
    const { icon, color } = object
    const icons = [document.icon.Document, document.icon.Library]
    showPopup(IconPicker, { icon, color, icons }, 'top', (result) => {
      if (result !== undefined && result !== null) {
        object.icon = result.icon
        object.color = result.color
      }
    })
  }

  function getTitle (value: string): string {
    return value.trim()
  }

  async function create (): Promise<void> {
    await createEmptyDocument(client, id, _space, _parent ?? document.ids.NoParent, object)
    dispatch('close', id)
  }

  const manager = createFocusManager()
</script>

<FocusHandler {manager} />

<Card
  label={document.string.CreateDocument}
  okAction={create}
  {canSave}
  on:close={() => {
    dispatch('close')
  }}
  on:changeContent
>
  <svelte:fragment slot="header">
    <SpaceSelector
      _class={document.class.Teamspace}
      label={document.string.Teamspace}
      bind:space={_space}
      kind={'regular'}
      size={'small'}
      component={TeamspacePresenter}
      iconWithEmoji={view.ids.IconWithEmoji}
      defaultIcon={document.icon.Teamspace}
    />
    <ObjectBox
      _class={document.class.Document}
      bind:value={_parent}
      docQuery={{
        space: _space
      }}
      kind={'regular'}
      size={'small'}
      label={document.string.NoParentDocument}
      searchField={'name'}
      allowDeselect={true}
      showNavigate={false}
      docProps={{ disabled: true, noUnderline: true }}
      focusIndex={20000}
    />
  </svelte:fragment>

  <div class="flex-row-center clear-mins">
    <div class="mr-3">
      <Button
        size={'medium'}
        kind={'link-bordered'}
        noFocus
        icon={object.icon === view.ids.IconWithEmoji ? IconWithEmoji : object.icon ?? document.icon.Document}
        iconProps={object.icon === view.ids.IconWithEmoji
          ? { icon: object.color }
          : {
              fill:
                object.color !== undefined ? getPlatformColorDef(object.color, $themeStore.dark).icon : 'currentColor'
            }}
        on:click={chooseIcon}
      />
    </div>
    <EditBox
      placeholder={document.string.DocumentNamePlaceholder}
      bind:value={object.name}
      kind={'large-style'}
      autoFocus
      focusIndex={1}
    />
  </div>
</Card>
