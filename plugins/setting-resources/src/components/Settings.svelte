<!--
// Copyright © 2022 Hardcore Engineering Inc.
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
  import { PersonAccount } from '@hcengineering/contact'
  import { AccountRole, getCurrentAccount, roleOrder } from '@hcengineering/core'
  import login, { loginId } from '@hcengineering/login'
  import { setMetadata } from '@hcengineering/platform'
  import presentation, { closeClient, createQuery } from '@hcengineering/presentation'
  import setting, { SettingsCategory } from '@hcengineering/setting'
  import {
    Component,
    Scroller,
    Separator,
    defineSeparators,
    settingsSeparators,
    fetchMetadataLocalStorage,
    getCurrentResolvedLocation,
    navigate,
    resolvedLocationStore,
    setMetadataLocalStorage,
    showPopup,
    Label,
    NavItem,
    NavGroup,
    type AnyComponent
  } from '@hcengineering/ui'
  import { NavFooter } from '@hcengineering/workbench-resources'
  import { ComponentType, onDestroy } from 'svelte'
  import { settingsStore, clearSettingsStore, type SettingsStore } from '../store'

  export let visibleNav: boolean = true
  export let navFloat: boolean = false
  export let appsDirection: 'vertical' | 'horizontal' = 'horizontal'

  let category: SettingsCategory | undefined
  let categoryId: string = ''

  let categories: SettingsCategory[] = []
  const account = getCurrentAccount() as PersonAccount
  let asideComponent: ComponentType | AnyComponent | null = null
  let asideProps: object | null = null

  const settingsQuery = createQuery()
  settingsQuery.query(
    setting.class.SettingsCategory,
    {},
    (res) => {
      categories = roleOrder[account.role] > roleOrder[AccountRole.User] ? res : res.filter((p) => !p.secured)
      category = findCategory(categoryId)
    },
    { sort: { order: 1 } }
  )

  onDestroy(() => {
    clearSettingsStore()
  })
  onDestroy(
    resolvedLocationStore.subscribe((loc) => {
      void (async (loc) => {
        categoryId = loc.path[3]
        category = findCategory(categoryId)
      })(loc)
    })
  )

  function findCategory (name: string): SettingsCategory | undefined {
    return categories.find((x) => x.name === name)
  }
  function selectCategory (id: string): void {
    clearSettingsStore()
    const loc = getCurrentResolvedLocation()
    if (loc.path[3] === id) {
      loc.path.length = 3
    } else {
      loc.path[3] = id
      loc.path.length = 4
    }
    navigate(loc)
  }
  function signOut (): void {
    const tokens = fetchMetadataLocalStorage(login.metadata.LoginTokens)
    if (tokens !== null) {
      const loc = getCurrentResolvedLocation()
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete tokens[loc.path[1]]
      setMetadataLocalStorage(login.metadata.LoginTokens, tokens)
    }
    setMetadata(presentation.metadata.Token, null)
    setMetadataLocalStorage(login.metadata.LastToken, null)
    setMetadataLocalStorage(login.metadata.LoginEndpoint, null)
    setMetadataLocalStorage(login.metadata.LoginEmail, null)
    void closeClient()
    navigate({ path: [loginId] })
  }
  function selectWorkspace (): void {
    navigate({ path: [loginId, 'selectWorkspace'] })
  }
  function inviteWorkspace (): void {
    showPopup(login.component.InviteLink, {})
  }

  const updatedStore = (ss: SettingsStore): ComponentType | AnyComponent | null => {
    asideProps = ss.props ?? null
    return ss.component === undefined ? null : ss.component
  }
  $: asideComponent = updatedStore($settingsStore)

  defineSeparators('setting', settingsSeparators)
</script>

<div class="hulyPanels-container">
  {#if visibleNav}
    <div
      class="antiPanel-navigator {appsDirection === 'horizontal' ? 'portrait' : 'landscape'} border-left"
      class:border-right={category?.component === undefined}
    >
      <div class="antiPanel-wrap__content hulyNavPanel-container">
        <div class="hulyNavPanel-header">
          <Label label={setting.string.Settings} />
        </div>

        <Scroller shrink>
          {#each categories as _category}
            {#if _category.extraComponents?.navigation && (_category.expandable ?? _category._id === setting.ids.Setting)}
              <NavGroup
                label={_category.label}
                categoryName={_category.name}
                selected={_category.name === categoryId}
                tools={_category.extraComponents?.tools}
              >
                <Component
                  is={_category.extraComponents?.navigation}
                  props={{
                    kind: 'navigation',
                    categoryName: _category.name
                  }}
                />
              </NavGroup>
            {:else}
              <NavItem
                icon={_category.icon}
                label={_category.label}
                selected={_category.name === categoryId}
                on:click={() => {
                  selectCategory(_category.name)
                }}
              />
            {/if}
          {/each}
        </Scroller>

        <NavFooter split>
          <NavItem
            icon={setting.icon.SelectWorkspace}
            label={setting.string.SelectWorkspace}
            on:click={selectWorkspace}
          />
          <NavItem
            icon={login.icon.InviteWorkspace}
            label={setting.string.InviteWorkspace}
            on:click={inviteWorkspace}
          />
          <NavItem icon={setting.icon.Signout} label={setting.string.Signout} on:click={signOut} />
        </NavFooter>
      </div>
      <Separator name={'setting'} float={navFloat ? 'navigator' : true} index={0} color={'transparent'} />
    </div>
    <Separator name={'setting'} float={navFloat} index={0} color={'transparent'} separatorSize={0} short />
  {/if}

  <div class="antiPanel-component filledNav" style:flex-direction={'row'}>
    {#if category}
      <Component
        is={category.component}
        props={{
          kind: 'content',
          visibleNav
        }}
        on:change={(event) => (visibleNav = event.detail)}
      />
    {/if}
  </div>
  {#if asideComponent != null}
    <Separator name={'setting'} index={1} color={'transparent'} separatorSize={0} short />
    <div class="hulySidePanel-container">
      {#key asideProps}
        {#if typeof asideComponent === 'string'}
          <Component is={asideComponent} props={{ ...asideProps }} />
        {:else}
          <svelte:component this={asideComponent} {...asideProps} />
        {/if}
      {/key}
    </div>
  {/if}
</div>
