import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarHeader,
  SidebarInput,
  SidebarGroupAction
} from "@/components/ui/sidebar";
import { ChevronsRight, CalendarDays, Calendar as CalendarIcon, StickyNote, Menu, Plus, Hash, ListTodo } from "lucide-react";
import { useLists } from "@/hooks/use-lists";
import { useTags } from "@/hooks/use-tags";
import { Button } from "@/components/ui/button";

export type FilterType = {
  type: 'upcoming' | 'today' | 'calendar' | 'sticky' | 'list' | 'tag';
  id?: number;
  name?: string;
};

interface AppSidebarProps {
  selectedFilter: FilterType;
  onSelectFilter: (filter: FilterType) => void;
  onCreateListClick: () => void;
}

const SMART_FILTERS = [
  { id: 'upcoming', label: 'Upcoming', icon: ChevronsRight, type: 'upcoming' },
  { id: 'today', label: 'Today', icon: CalendarDays, type: 'today' },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon, type: 'calendar' },
] as const;

export function AppSidebar({ selectedFilter, onSelectFilter, onCreateListClick }: AppSidebarProps) {
  const { data: lists } = useLists();
  const { data: tags } = useTags();

  return (
    <Sidebar className="border-r border-border/50 bg-sidebar">
      <SidebarHeader className="pt-6 pb-4 px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold font-display text-sidebar-foreground">Menu</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <SidebarInput placeholder="Search tasks..." className="bg-background rounded-lg border-border/50 shadow-sm" />
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Tasks
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SMART_FILTERS.map((filter) => (
                <SidebarMenuItem key={filter.id}>
                  <SidebarMenuButton 
                    isActive={selectedFilter.type === filter.type}
                    onClick={() => onSelectFilter({ type: filter.type as any })}
                    className="font-medium text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-lg py-2 transition-all"
                  >
                    <filter.icon className="h-4 w-4 mr-2" />
                    <span>{filter.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <div className="flex items-center justify-between mb-2 pr-2">
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider m-0">
              Lists
            </SidebarGroupLabel>
            <SidebarGroupAction title="Add List" onClick={onCreateListClick}>
              <Plus className="h-4 w-4" /> <span className="sr-only">Add List</span>
            </SidebarGroupAction>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {lists?.map((list) => (
                <SidebarMenuItem key={list.id}>
                  <SidebarMenuButton 
                    isActive={selectedFilter.type === 'list' && selectedFilter.id === list.id}
                    onClick={() => onSelectFilter({ type: 'list', id: list.id, name: list.name })}
                    className="font-medium text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-lg py-2 transition-all"
                  >
                    <div 
                      className="w-3 h-3 rounded-sm mr-2 shadow-sm" 
                      style={{ backgroundColor: list.color || '#ccc' }} 
                    />
                    <span className="flex-1 truncate">{list.name}</span>
                    {list.taskCount > 0 && (
                      <span className="bg-background border border-border shadow-sm text-xs px-2 py-0.5 rounded-md text-muted-foreground font-semibold">
                        {list.taskCount}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {!lists?.length && (
                <div className="text-sm text-muted-foreground px-4 py-2 opacity-60 italic">No lists yet</div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Tags
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex flex-wrap gap-2 px-2">
              {tags?.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => onSelectFilter({ type: 'tag', id: tag.id, name: tag.name })}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                    selectedFilter.type === 'tag' && selectedFilter.id === tag.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-sidebar-accent/50 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground border border-border/50'
                  }`}
                >
                  <Hash className="inline h-3 w-3 mr-1 opacity-70" />
                  {tag.name}
                </button>
              ))}
              {!tags?.length && (
                <div className="text-sm text-muted-foreground px-2 py-1 opacity-60 italic">No tags</div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
