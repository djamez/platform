<script lang="ts">
  import { Person } from '@hcengineering/contact'
  import { AssigneePopup, EmployeePresenter } from '@hcengineering/contact-resources'
  import { Doc, Ref } from '@hcengineering/core'
  import { MessageBox, createQuery, getClient } from '@hcengineering/presentation'
  import { NodeViewContent, NodeViewProps, NodeViewWrapper } from '@hcengineering/text-editor'
  import { CheckBox, getEventPositionElement, showPopup } from '@hcengineering/ui'
  import time, { ToDo, ToDoPriority } from '@hcengineering/time'

  import document from '../../plugin'

  export let node: NodeViewProps['node']
  export let editor: NodeViewProps['editor']
  export let updateAttributes: NodeViewProps['updateAttributes']

  export let object: Doc | undefined = undefined

  const client = getClient()
  const query = createQuery()

  $: todoId = node.attrs.todoid as Ref<ToDo>
  $: userId = node.attrs.userid as Ref<Person>
  $: checked = node.attrs.checked ?? false
  $: readonly = !editor.isEditable || object === undefined

  let todo: ToDo | undefined = undefined
  $: query.query(
    time.class.ToDo,
    {
      _id: todoId
    },
    (res) => {
      ;[todo] = res
      void syncTodo(todo)
    }
  )

  async function syncTodo (todo: ToDo | undefined): Promise<void> {
    if (todo !== undefined) {
      const todoChecked = todo.doneOn != null
      if (todo._id !== todoId || todo.user !== userId || todoChecked !== checked) {
        updateAttributes({
          todoid: todo._id,
          userid: todo.user,
          checked: todoChecked
        })
      }
    } else {
      if (node.attrs.todoid != null) {
        updateAttributes({
          todoid: null,
          userid: null
        })
      }
    }
  }

  async function markDone (): Promise<void> {
    if (todo !== undefined) {
      await client.update(todo, { doneOn: todo.doneOn == null ? Date.now() : null })
    } else {
      updateAttributes({ checked: node.attrs.checked !== true })
    }
  }

  async function assignTodo (user: Ref<Person>): Promise<void> {
    if (todo !== undefined && todo.user === user) return
    if (object === undefined) return

    const title = node.textBetween(0, node.content.size, undefined, ' ')

    const ops = client.apply('todo')

    if (todo !== undefined) {
      await ops.remove(todo)
    }

    const id = await ops.addCollection(time.class.ProjectToDo, time.space.ToDos, object._id, object._class, 'todos', {
      attachedSpace: object.space,
      title,
      description: '',
      user,
      workslots: 0,
      priority: ToDoPriority.NoPriority,
      visibility: 'public',
      doneOn: node.attrs.checked === true ? Date.now() : null
    })

    await ops.commit()

    updateAttributes({
      todoid: id,
      userid: user
    })
  }

  async function unassignTodo (): Promise<void> {
    updateAttributes({
      todoid: null,
      userid: null
    })

    if (todo !== undefined) {
      await client.remove(todo)
    }
  }

  async function assignTodoConfirm (user: Ref<Person>): Promise<void> {
    showPopup(
      MessageBox,
      {
        label: document.string.ReassignToDo,
        message: document.string.ReassignToDoConfirm
      },
      'top',
      async (result?: boolean) => {
        if (result === true) {
          await assignTodo(user)
        }
      }
    )
  }

  async function unassignTodoConfirm (): Promise<void> {
    showPopup(
      MessageBox,
      {
        label: document.string.UnassignToDo,
        message: document.string.UnassignToDoConfirm
      },
      'top',
      async (result?: boolean) => {
        if (result === true) {
          await unassignTodo()
        }
      }
    )
  }

  async function changeAssignee (user: Ref<Person> | undefined): Promise<void> {
    const shouldConfirm = todo !== undefined && todo?.workslots > 0
    if (user !== undefined) {
      shouldConfirm ? await assignTodoConfirm(user) : await assignTodo(user)
    } else {
      shouldConfirm ? await unassignTodoConfirm() : await unassignTodo()
    }
  }

  let hovered = false

  function handleAssigneeEdit (ev: MouseEvent): void {
    ev.preventDefault()
    ev.stopPropagation()

    hovered = true
    showPopup(
      AssigneePopup,
      {
        selected: userId
      },
      getEventPositionElement(ev),
      async (result) => {
        if (result !== undefined && result?._id !== userId) {
          await changeAssignee(result?._id)
        }
        hovered = false
        editor.commands.focus()
      }
    )
  }
</script>

<NodeViewWrapper data-drag-handle="" data-type="todoItem">
  <div
    class="todo-item flex-row-top flex-gap-3"
    class:empty={node.textContent.length === 0}
    class:unassigned={userId == null}
    class:hovered
  >
    <div class="assignee" contenteditable="false">
      <EmployeePresenter
        value={userId}
        disabled={readonly}
        avatarSize={'card'}
        shouldShowName={false}
        shouldShowPlaceholder
        onEmployeeEdit={handleAssigneeEdit}
      />
    </div>

    <div contenteditable="false">
      <CheckBox {readonly} {checked} on:value={markDone} kind={'positive'} size={'medium'} />
    </div>

    <NodeViewContent style="outline: none;" class="flex-grow" />
  </div>
</NodeViewWrapper>

<style lang="scss">
  .todo-item {
    .assignee {
      cursor: pointer;
    }

    &.unassigned {
      .assignee {
        opacity: 0;
      }
    }

    &.empty {
      .assignee {
        visibility: hidden;
      }
    }

    &.hovered,
    &:hover,
    &:focus-within {
      .assignee {
        opacity: 1;
      }
    }
  }
</style>
