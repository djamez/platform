<!--
// Copyright © 2025 Hardcore Engineering Inc.
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
  import { Class, Doc, Ref } from '@hcengineering/core'
  import { getMetadata } from '@hcengineering/platform'
  import presentation, { MessageBox } from '@hcengineering/presentation'
  import { Breadcrumb, Button, DropdownLabelsIntl, Header, Label, Scroller, showPopup } from '@hcengineering/ui'
  import plugin from '../plugin'

  const classItems = [
    { id: 'tracker:class:Issue', label: plugin.string.ExportIssues },
    { id: 'tracker:class:Milestone', label: plugin.string.ExportMilestones },
    { id: 'document:class:Document', label: plugin.string.ExportDocuments },
    { id: 'testManagement:class:TestCase', label: plugin.string.ExportTestCases },
    { id: 'testManagement:class:TestRun', label: plugin.string.ExportTestRuns },
    { id: 'testManagement:class:TestPlan', label: plugin.string.ExportTestPlans }
  ]

  const formatItems = [
    { id: 'json', label: plugin.string.ExportJSON },
    { id: 'csv', label: plugin.string.ExportCSV }
  ]

  const detailLevelItems = [
    { id: 'everything', label: plugin.string.ExportEverything },
    { id: 'attributesOnly', label: plugin.string.ExportAttributesOnly }
  ]

  let selectedClass: Ref<Class<Doc>> = 'tracker:class:Issue' as Ref<Class<Doc>>
  let selectedFormat: string = 'json'
  let selectedDetailLevel: string = 'everything'
  let isExporting = false

  async function exportData (): Promise<void> {
    if (isExporting) return

    try {
      isExporting = true
      const baseUrl = getMetadata(plugin.metadata.ExportUrl) ?? ''
      const token = getMetadata(presentation.metadata.Token) ?? ''
      const attributesOnly = selectedDetailLevel === 'attributesOnly'

      const res = await fetch(`${baseUrl}/exportAsync?format=${selectedFormat}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          _class: selectedClass,
          attributesOnly,
          config: {}
        })
      })

      if (!res.ok) {
        throw new Error('Export failed to start')
      }

      showPopup(MessageBox, {
        label: plugin.string.ExportRequestSuccess,
        kind: 'success',
        message: plugin.string.ExportRequestSuccessMessage
      })
    } catch (err) {
      showPopup(MessageBox, {
        label: plugin.string.ExportRequestFailed,
        kind: 'error',
        message: plugin.string.ExportRequestFailedMessage
      })
    } finally {
      isExporting = false
    }
  }
</script>

<div class="hulyComponent">
  <Header adaptive={'disabled'}>
    <Breadcrumb icon={plugin.icon.Export} label={plugin.string.Export} size={'large'} isCurrent />
  </Header>
  <div class="hulyComponent-content__column content">
    <Scroller align={'center'} padding={'var(--spacing-3)'} bottomPadding={'var(--spacing-3)'}>
      <div class="hulyComponent-content">
        <div class="flex-row-center p-2 flex-no-shrink">
          <div class="p-1 min-w-80">
            <div class="antiGrid-row">
              <div class="antiGrid-row__header">
                <Label label={plugin.string.DataToExport} />
              </div>
              <div class="antiGrid-row__content">
                <DropdownLabelsIntl items={classItems} bind:selected={selectedClass} />
              </div>
            </div>
            <div class="antiGrid-row">
              <div class="antiGrid-row__header">
                <Label label={plugin.string.ExportFormat} />
              </div>
              <div class="antiGrid-row__content">
                <DropdownLabelsIntl items={formatItems} bind:selected={selectedFormat} />
              </div>
            </div>
            <div class="antiGrid-row">
              <div class="antiGrid-row__header">
                <Label label={plugin.string.ExportIncludeContent} />
              </div>
              <div class="antiGrid-row__content">
                <DropdownLabelsIntl items={detailLevelItems} bind:selected={selectedDetailLevel} />
              </div>
            </div>
          </div>
        </div>
        <div class="flex-row-center p-2">
          <Button
            label={plugin.string.Export}
            kind={'primary'}
            size={'medium'}
            disabled={isExporting}
            on:click={exportData}
          />
        </div>
      </div>
    </Scroller>
  </div>
</div>
