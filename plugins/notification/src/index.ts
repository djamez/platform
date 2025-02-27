//
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
//

import { ActivityMessage } from '@hcengineering/activity'
import {
  Account,
  AnyAttribute,
  AttachedDoc,
  Class,
  Doc,
  DocumentQuery,
  Mixin,
  Ref,
  Space,
  Timestamp,
  Tx,
  TxCUD,
  TxOperations
} from '@hcengineering/core'
import type { Asset, IntlString, Plugin, Resource } from '@hcengineering/platform'
import { plugin } from '@hcengineering/platform'
import { Preference } from '@hcengineering/preference'
import { IntegrationType } from '@hcengineering/setting'
import { AnyComponent, Location, ResolvedLocation } from '@hcengineering/ui'
import { Action, Viewlet, ViewletDescriptor } from '@hcengineering/view'
import { Readable, Writable } from './types'

export * from './types'

/**
 * @public
 */
export interface Notification extends AttachedDoc {
  tx: Ref<TxCUD<Doc>>
  status: NotificationStatus
  text: string
  type: Ref<NotificationType>
}

/**
 * @public
 */
export enum NotificationStatus {
  New,
  Notified,
  Read
}

/**
 * @public
 */
export interface NotificationGroup extends Doc {
  label: IntlString
  icon: Asset
  // using for autogenerated settings
  objectClass?: Ref<Class<Doc>>
}

/**
 * @public
 */
export interface NotificationPreferencesGroup extends Doc {
  label: IntlString
  icon: Asset
  presenter: AnyComponent
}

/**
 * @public
 */
export interface NotificationTemplate {
  textTemplate: string
  htmlTemplate: string
  subjectTemplate: string
}

/**
 * @public
 */
export interface NotificationContent {
  title: IntlString
  body: IntlString
  intlParams: Record<string, string | number>
  intlParamsNotLocalized?: Record<string, IntlString>
}

export interface BaseNotificationType extends Doc {
  label: IntlString
  // Is autogenerated
  generated: boolean
  // allowed to  change setting (probably we should show it, but disable toggle??)
  hidden: boolean
  group: Ref<NotificationGroup>
  // allowed providers and default value for it
  providers: Record<Ref<NotificationProvider>, boolean>
  // templates for email (and browser/push?)
  templates?: NotificationTemplate
}
/**
 * @public
 */
export interface NotificationType extends BaseNotificationType {
  // For show/hide with attributes
  attribute?: Ref<AnyAttribute>
  txClasses: Ref<Class<Tx>>[]
  objectClass: Ref<Class<Doc>>
  // not allowed to parent doc
  onlyOwn?: boolean
  // check parent doc class
  attachedToClass?: Ref<Class<Doc>>
  // use for update/mixin txes
  field?: string
  txMatch?: DocumentQuery<Tx>
  // use for space collaborators, not object
  spaceSubscribe?: boolean
  // when true notification will be created for user which trigger it (default - false)
  allowedForAuthor?: boolean
}

export interface CommonNotificationType extends BaseNotificationType {}

/**
 * @public
 */
export interface NotificationProvider extends Doc {
  label: IntlString
}

/**
 * @public
 */
export interface NotificationSetting extends Preference {
  attachedTo: Ref<NotificationProvider>
  type: Ref<BaseNotificationType>
  enabled: boolean
}

/**
 * @public
 */
export interface ClassCollaborators extends Class<Doc> {
  fields: string[] // Ref<Account> | Ref<Employee> | Ref<Account>[] | Ref<Employee>[]
}

/**
 * @public
 */
export interface NotificationObjectPresenter extends Class<Doc> {
  presenter: AnyComponent
}

/**
 * @public
 */
export interface Collaborators extends Doc {
  collaborators: Ref<Account>[]
}

/**
 * @public
 * @deprecated
 */
export interface DocUpdateTx {
  _id: Ref<TxCUD<Doc>>
  modifiedBy: Ref<Account>
  modifiedOn: Timestamp
  isNew: boolean
  title?: IntlString
  body?: IntlString
  intlParams?: Record<string, string | number>
  intlParamsNotLocalized?: Record<string, IntlString>
}

/**
 * @public
 * @deprecated
 */
export interface DocUpdates extends Doc {
  user: Ref<Account>
  attachedTo: Ref<Doc>
  attachedToClass: Ref<Class<Doc>>
  hidden: boolean
  lastTxTime?: Timestamp
  txes: DocUpdateTx[]
}

/**
 * @public
 */
export const notificationId = 'notification' as Plugin

/**
 * @public
 */
export const inboxId = 'inbox' as Plugin

/**
 * @public
 */
export interface NotificationPreview extends Class<Doc> {
  presenter: AnyComponent
}

/**
 * @public
 */
export interface NotificationContextPresenter extends Class<Doc> {
  labelPresenter?: AnyComponent
}

/**
 * @public
 */
export interface InboxNotification extends Doc {
  user: Ref<Account>
  isViewed: boolean

  docNotifyContext: Ref<DocNotifyContext>

  // For browser notifications
  title?: IntlString
  body?: IntlString
  intlParams?: Record<string, string | number>
  intlParamsNotLocalized?: Record<string, IntlString>
}

export interface ActivityInboxNotification extends InboxNotification {
  attachedTo: Ref<ActivityMessage>
  attachedToClass: Ref<Class<ActivityMessage>>
}

export interface CommonInboxNotification extends InboxNotification {
  header?: IntlString
  message?: IntlString
  messageHtml?: string
  props?: Record<string, any>
  icon?: Asset
  iconProps?: Record<string, any>
}

export interface DisplayActivityInboxNotification extends ActivityInboxNotification {
  combinedIds: Ref<ActivityInboxNotification>[]
}

export type DisplayInboxNotification = DisplayActivityInboxNotification | InboxNotification

/**
 * @public
 */
export interface DocNotifyContext extends Doc {
  user: Ref<Account>

  // Context
  attachedTo: Ref<Doc>
  attachedToClass: Ref<Class<Doc>>

  hidden: boolean
  isPinned?: boolean
  lastViewedTimestamp?: Timestamp
  lastUpdateTimestamp?: Timestamp
}

/**
 * @public
 */
export interface InboxNotificationsClient {
  docNotifyContextByDoc: Writable<Map<Ref<Doc>, DocNotifyContext>>
  docNotifyContexts: Writable<DocNotifyContext[]>
  inboxNotifications: Readable<InboxNotification[]>
  activityInboxNotifications: Writable<ActivityInboxNotification[]>
  inboxNotificationsByContext: Readable<Map<Ref<DocNotifyContext>, InboxNotification[]>>
  readDoc: (client: TxOperations, _id: Ref<Doc>) => Promise<void>
  forceReadDoc: (client: TxOperations, _id: Ref<Doc>, _class: Ref<Class<Doc>>) => Promise<void>
  readMessages: (client: TxOperations, ids: Ref<ActivityMessage>[]) => Promise<void>
  readNotifications: (client: TxOperations, ids: Array<Ref<InboxNotification>>) => Promise<void>
  unreadNotifications: (client: TxOperations, ids: Array<Ref<InboxNotification>>) => Promise<void>
  deleteNotifications: (client: TxOperations, ids: Array<Ref<InboxNotification>>) => Promise<void>
  deleteAllNotifications: () => Promise<void>
  readAllNotifications: () => Promise<void>
}

/**
 * @public
 */
export type InboxNotificationsClientFactory = () => InboxNotificationsClient

/**
 * @public
 */
export interface ActivityNotificationViewlet extends Doc {
  messageMatch: DocumentQuery<Doc>
  presenter: AnyComponent
}

/**
 * @public
 */
const notification = plugin(notificationId, {
  mixin: {
    ClassCollaborators: '' as Ref<Mixin<ClassCollaborators>>,
    Collaborators: '' as Ref<Mixin<Collaborators>>,
    NotificationObjectPresenter: '' as Ref<Mixin<NotificationObjectPresenter>>,
    NotificationPreview: '' as Ref<Mixin<NotificationPreview>>,
    NotificationContextPresenter: '' as Ref<Mixin<NotificationContextPresenter>>
  },
  class: {
    Notification: '' as Ref<Class<Notification>>,
    BaseNotificationType: '' as Ref<Class<BaseNotificationType>>,
    NotificationType: '' as Ref<Class<NotificationType>>,
    CommonNotificationType: '' as Ref<Class<CommonNotificationType>>,
    NotificationProvider: '' as Ref<Class<NotificationProvider>>,
    NotificationSetting: '' as Ref<Class<NotificationSetting>>,
    DocUpdates: '' as Ref<Class<DocUpdates>>,
    NotificationGroup: '' as Ref<Class<NotificationGroup>>,
    NotificationPreferencesGroup: '' as Ref<Class<NotificationPreferencesGroup>>,
    DocNotifyContext: '' as Ref<Class<DocNotifyContext>>,
    InboxNotification: '' as Ref<Class<InboxNotification>>,
    ActivityInboxNotification: '' as Ref<Class<ActivityInboxNotification>>,
    CommonInboxNotification: '' as Ref<Class<CommonInboxNotification>>,
    ActivityNotificationViewlet: '' as Ref<Class<ActivityNotificationViewlet>>
  },
  ids: {
    NotificationSettings: '' as Ref<Doc>,
    NotificationGroup: '' as Ref<NotificationGroup>,
    CollaboratoAddNotification: '' as Ref<NotificationType>,
    MentionCommonNotificationType: '' as Ref<CommonNotificationType>
  },
  providers: {
    PlatformNotification: '' as Ref<NotificationProvider>,
    BrowserNotification: '' as Ref<NotificationProvider>,
    EmailNotification: '' as Ref<NotificationProvider>
  },
  integrationType: {
    MobileApp: '' as Ref<IntegrationType>
  },
  component: {
    Inbox: '' as AnyComponent,
    NotificationPresenter: '' as AnyComponent,
    NotificationCollaboratorsChanged: '' as AnyComponent,
    DocNotifyContextPresenter: '' as AnyComponent,
    InboxFlatListView: '' as AnyComponent,
    InboxGroupedListView: '' as AnyComponent
  },
  activity: {
    TxCollaboratorsChange: '' as AnyComponent
  },
  viewlet: {
    FlatList: '' as Ref<ViewletDescriptor>,
    InboxFlatList: '' as Ref<Viewlet>,
    GroupedList: '' as Ref<ViewletDescriptor>,
    InboxGroupedList: '' as Ref<Viewlet>
  },
  action: {
    MarkAsUnreadInboxNotification: '' as Ref<Action>,
    MarkAsReadInboxNotification: '' as Ref<Action>,
    DeleteInboxNotification: '' as Ref<Action>,
    PinDocNotifyContext: '' as Ref<Action>,
    UnpinDocNotifyContext: '' as Ref<Action>,
    HideDocNotifyContext: '' as Ref<Action>,
    UnHideDocNotifyContext: '' as Ref<Action>,
    UnReadNotifyContext: '' as Ref<Action>,
    ReadNotifyContext: '' as Ref<Action>,
    DeleteContextNotifications: '' as Ref<Action>
  },
  icon: {
    Notifications: '' as Asset,
    Inbox: '' as Asset,
    Track: '' as Asset,
    DontTrack: '' as Asset,
    Hide: '' as Asset
  },
  space: {
    Notifications: '' as Ref<Space>
  },
  string: {
    Notification: '' as IntlString,
    Notifications: '' as IntlString,
    DontTrack: '' as IntlString,
    Inbox: '' as IntlString,
    CommonNotificationTitle: '' as IntlString,
    CommonNotificationBody: '' as IntlString,
    ChangedCollaborators: '' as IntlString,
    NewCollaborators: '' as IntlString,
    RemovedCollaborators: '' as IntlString,
    Edited: '' as IntlString,
    Pinned: '' as IntlString,
    FlatList: '' as IntlString,
    GroupedList: '' as IntlString,
    All: '' as IntlString,
    ArchiveAll: '' as IntlString,
    ReadAll: '' as IntlString,
    ArchiveAllConfirmationTitle: '' as IntlString,
    ArchiveAllConfirmationMessage: '' as IntlString
  },
  function: {
    GetInboxNotificationsClient: '' as Resource<InboxNotificationsClientFactory>,
    HasHiddenDocNotifyContext: '' as Resource<(doc: Doc[]) => Promise<boolean>>,
    IsDocNotifyContextHidden: '' as Resource<(doc?: Doc | Doc[]) => Promise<boolean>>,
    IsDocNotifyContextTracked: '' as Resource<(doc?: Doc | Doc[]) => Promise<boolean>>,
    HasInboxNotifications: '' as Resource<
    (notificationsByContext: Map<Ref<DocNotifyContext>, InboxNotification[]>) => Promise<boolean>
    >
  },
  resolver: {
    Location: '' as Resource<(loc: Location) => Promise<ResolvedLocation | undefined>>
  }
})

export default notification
