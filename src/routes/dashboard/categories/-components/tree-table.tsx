import { checkboxesFeature, hotkeysCoreFeature, selectionFeature, syncDataLoaderFeature, } from "@headless-tree/core"
import { useTree } from "@headless-tree/react"
import { FileIcon, FolderIcon, FolderOpenIcon } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Tree, TreeItem, TreeItemLabel } from "@/components/tree"

interface Item {
  name: string
  children?: string[]
}

const items: Record<string, Item> = {
  "moda-feminina": {
    name: "Moda Feminina",
    children: ["saias"],
  },
  "saias": {
    name: "Saias",
    children: ["saia-curta", "saia-longa", "saia-midi"],
  },
  "saia-curta": {
    name: "Saia Curta",
  },
  "saia-longa": {
    name: "Saia Longa",
  },
  "saia-midi": {
    name: "Saia Midi",
  },
}

const indent = 20

export default function TreeTable() {
  const tree = useTree<Item>({
    initialState: {},
    indent,
    rootItemId: "moda-feminina",
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => (item.getItemData()?.children?.length ?? 0) > 0,
    dataLoader: {
      getItem: (itemId) => items[itemId],
      getChildren: (itemId) => items[itemId].children ?? [],
    },
    canCheckFolders: true,
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      checkboxesFeature,
      hotkeysCoreFeature,
    ],
  })

  return (
    <div className="flex h-full flex-col gap-2 *:first:grow">
      <div>
        <Tree
          className="relative before:absolute before:inset-0 before:ms-4.5 before:bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)))]"
          indent={indent}
          tree={tree}
        >
          {tree.getItems().map((item) => {
            return (
              <div
                key={item.getId()}
                className="flex items-center gap-1.5 not-last:pb-0.5"
              >
                <Checkbox
                  checked={
                    {
                      checked: true,
                      unchecked: false,
                      indeterminate: "indeterminate" as const,
                    }[item.getCheckedState()]
                  }
                  onCheckedChange={(checked) => {
                    const checkboxProps = item.getCheckboxProps()
                    checkboxProps.onChange?.({ target: { checked } })
                  }}
                />
                <TreeItem item={item} className="flex-1 not-last:pb-0">
                  <TreeItemLabel className="relative before:absolute before:inset-x-0 before:-inset-y-0.5 before:-z-10 before:bg-background">
                    <span className="flex items-center gap-2">
                      {item.isFolder() ? (
                        item.isExpanded() ? (
                          <FolderOpenIcon className="pointer-events-none size-4 text-muted-foreground" />
                        ) : (
                          <FolderIcon className="pointer-events-none size-4 text-muted-foreground" />
                        )
                      ) : (
                        <FileIcon className="pointer-events-none size-4 text-muted-foreground" />
                      )}
                      {item.getItemName()}
                    </span>
                  </TreeItemLabel>
                </TreeItem>
              </div>
            )
          })}
        </Tree>
      </div>
    </div>
  )
}
